import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  TranscriptionService,
  calculateSpeakingMetrics,
} from "@/services/transcription";
import { AnalysisService } from "@/services/analysis";
import { EmailService } from "@/services/email";

// POST /api/meetings/[id]/process - Process meeting (transcribe + analyze)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get meeting and user
    const [meeting, user] = await Promise.all([
      db.meeting.findFirst({
        where: {
          id: params.id,
          userId: session.user.id,
        },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
      }),
    ]);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!meeting.audioUrl) {
      return NextResponse.json(
        { error: "No audio file uploaded" },
        { status: 400 }
      );
    }

    // Check for API keys
    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 }
      );
    }

    // Determine which LLM to use
    let llmProvider = user?.defaultLlmProvider?.toLowerCase() || "openai";
    let llmApiKey: string | null = null;

    switch (llmProvider) {
      case "openai":
        llmApiKey = user?.openaiApiKey || null;
        break;
      case "anthropic":
        llmApiKey = user?.anthropicApiKey || null;
        break;
      case "gemini":
        llmApiKey = user?.geminiApiKey || null;
        break;
    }

    if (!llmApiKey) {
      return NextResponse.json(
        {
          error: `No API key configured for ${llmProvider}. Please add your API key in Settings.`,
        },
        { status: 400 }
      );
    }

    // Update status to processing
    await db.meeting.update({
      where: { id: meeting.id },
      data: { status: "TRANSCRIBING" },
    });

    try {
      // Step 1: Transcribe
      const transcriptionService = new TranscriptionService(assemblyKey);
      const transcriptionResult = await transcriptionService.transcribe(
        meeting.audioUrl
      );

      // Save transcript
      await db.transcript.create({
        data: {
          meetingId: meeting.id,
          content: transcriptionResult.segments,
          rawText: transcriptionResult.rawText,
          wordCount: transcriptionResult.wordCount,
          language: transcriptionResult.language,
          transcriptionId: transcriptionResult.transcriptId,
        },
      });

      // Create participants
      const speakerMetrics = calculateSpeakingMetrics(
        transcriptionResult.segments
      );
      for (const [speaker, metrics] of speakerMetrics) {
        await db.participant.create({
          data: {
            meetingId: meeting.id,
            speakerLabel: speaker,
            speakingTime: Math.round(metrics.speakingTime),
            wordCount: metrics.wordCount,
            turnCount: metrics.turnCount,
          },
        });
      }

      // Update meeting with audio duration
      await db.meeting.update({
        where: { id: meeting.id },
        data: {
          status: "ANALYZING",
          audioDuration: transcriptionResult.duration,
          duration: Math.ceil(transcriptionResult.duration / 60),
        },
      });

      // Step 2: Analyze with LLM
      const analysisService = new AnalysisService(
        llmProvider as any,
        llmApiKey
      );
      const analysisResult = await analysisService.analyze(
        transcriptionResult.segments,
        transcriptionResult.rawText
      );

      // Save analysis
      await db.analysis.create({
        data: {
          meetingId: meeting.id,
          llmProvider: llmProvider.toUpperCase() as any,
          model:
            llmProvider === "openai"
              ? "gpt-4-turbo-preview"
              : llmProvider === "anthropic"
              ? "claude-3-sonnet"
              : "gemini-pro",
          summary: analysisResult.summary,
          keyPoints: analysisResult.keyPoints,
          actionItems: analysisResult.actionItems,
          decisions: analysisResult.decisions,
          followUps: analysisResult.followUps,
          oratoryMetrics: analysisResult.oratoryMetrics,
        },
      });

      // Update participant oratory metrics
      if (analysisResult.oratoryMetrics) {
        for (const [speaker, pace] of Object.entries(
          analysisResult.oratoryMetrics.speakingPace
        )) {
          await db.participant.updateMany({
            where: {
              meetingId: meeting.id,
              speakerLabel: speaker,
            },
            data: {
              wordsPerMinute: pace,
              fillerWords: analysisResult.oratoryMetrics.fillerWords[speaker],
            },
          });
        }
      }

      // Mark as completed
      await db.meeting.update({
        where: { id: meeting.id },
        data: { status: "COMPLETED" },
      });

      // Step 3: Send email report if enabled
      if (user?.emailNotifications && process.env.RESEND_API_KEY) {
        try {
          const participants = await db.participant.findMany({
            where: { meetingId: meeting.id },
          });

          const emailService = new EmailService({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || "MeetAnalyzer <noreply@example.com>",
          });

          await emailService.sendMeetingReport(user.email!, {
            meetingTitle: meeting.title,
            meetingDate: meeting.createdAt,
            duration: meeting.duration || 0,
            participants: participants.map((p) => p.name || p.speakerLabel),
            analysis: analysisResult,
            dashboardUrl: `${process.env.NEXTAUTH_URL}/meetings/${meeting.id}`,
          });
        } catch (emailError) {
          console.error("Failed to send email report:", emailError);
          // Don't fail the whole process for email errors
        }
      }

      return NextResponse.json({
        success: true,
        message: "Meeting processed successfully",
      });
    } catch (processingError: any) {
      // Update status to error
      await db.meeting.update({
        where: { id: meeting.id },
        data: { status: "ERROR" },
      });
      throw processingError;
    }
  } catch (error: any) {
    console.error("Error processing meeting:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
