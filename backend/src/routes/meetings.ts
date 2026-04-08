import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/db.js';
import { TranscriptionService, calculateSpeakingMetrics } from '../services/transcription.js';
import { AnalysisService } from '../services/analysis.js';
import { EmailService } from '../services/email.js';

const router = Router();

// GET /api/meetings - List meetings
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
        where,
        include: {
          participants: true,
          analysis: { select: { summary: true, keyPoints: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.meeting.count({ where }),
    ]);

    res.json({ meetings, total, hasMore: offset + meetings.length < total });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meetings/:id - Get meeting details
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const meeting = await db.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        transcript: true,
        analysis: true,
        participants: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meetings - Create meeting
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, description, platform, audioUrl, scheduledAt } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const meeting = await db.meeting.create({
      data: {
        userId: req.userId!,
        title,
        description,
        platform: platform || 'UPLOAD',
        audioUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'PENDING',
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meetings/:id/process - Process meeting
router.post('/:id/process', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [meeting, user] = await Promise.all([
      db.meeting.findFirst({ where: { id: req.params.id, userId: req.userId } }),
      db.user.findUnique({ where: { id: req.userId } }),
    ]);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.audioUrl) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyKey) {
      return res.status(500).json({ error: 'AssemblyAI not configured' });
    }

    // Get LLM config
    let llmProvider = (user?.defaultLlmProvider?.toLowerCase() || 'openai') as 'openai' | 'anthropic' | 'gemini';
    let llmApiKey: string | null = null;

    switch (llmProvider) {
      case 'openai': llmApiKey = user?.openaiApiKey || null; break;
      case 'anthropic': llmApiKey = user?.anthropicApiKey || null; break;
      case 'gemini': llmApiKey = user?.geminiApiKey || null; break;
    }

    if (!llmApiKey) {
      return res.status(400).json({ error: `No API key for ${llmProvider}` });
    }

    // Update status
    await db.meeting.update({ where: { id: meeting.id }, data: { status: 'TRANSCRIBING' } });

    // Respond immediately, process in background
    res.json({ success: true, message: 'Processing started' });

    // Background processing
    (async () => {
      try {
        // Transcribe
        const transcriptionService = new TranscriptionService(assemblyKey);
        const transcription = await transcriptionService.transcribe(meeting.audioUrl!);

        await db.transcript.create({
          data: {
            meetingId: meeting.id,
            content: transcription.segments,
            rawText: transcription.rawText,
            wordCount: transcription.wordCount,
            language: transcription.language,
            transcriptionId: transcription.transcriptId,
          },
        });

        // Create participants
        const metrics = calculateSpeakingMetrics(transcription.segments);
        for (const [speaker, data] of metrics) {
          await db.participant.create({
            data: {
              meetingId: meeting.id,
              speakerLabel: speaker,
              speakingTime: Math.round(data.speakingTime),
              wordCount: data.wordCount,
              turnCount: data.turnCount,
            },
          });
        }

        await db.meeting.update({
          where: { id: meeting.id },
          data: { status: 'ANALYZING', audioDuration: transcription.duration, duration: Math.ceil(transcription.duration / 60) },
        });

        // Analyze
        const analysisService = new AnalysisService(llmProvider, llmApiKey!);
        const analysis = await analysisService.analyze(transcription.segments, transcription.rawText);

        await db.analysis.create({
          data: {
            meetingId: meeting.id,
            llmProvider: llmProvider.toUpperCase() as any,
            model: llmProvider === 'openai' ? 'gpt-4-turbo' : llmProvider === 'anthropic' ? 'claude-3-sonnet' : 'gemini-pro',
            summary: analysis.summary,
            keyPoints: analysis.keyPoints,
            actionItems: analysis.actionItems,
            decisions: analysis.decisions,
            followUps: analysis.followUps,
            oratoryMetrics: analysis.oratoryMetrics,
          },
        });

        await db.meeting.update({ where: { id: meeting.id }, data: { status: 'COMPLETED' } });

        // Send email if enabled
        if (user?.emailNotifications && process.env.RESEND_API_KEY && user.email) {
          const participants = await db.participant.findMany({ where: { meetingId: meeting.id } });
          const emailService = new EmailService({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || 'MeetAnalyzer <noreply@example.com>',
          });
          await emailService.sendMeetingReport(user.email, {
            meetingTitle: meeting.title,
            meetingDate: meeting.createdAt,
            duration: meeting.duration || 0,
            participants: participants.map(p => p.name || p.speakerLabel),
            analysis,
            dashboardUrl: `${process.env.FRONTEND_URL}/meetings/${meeting.id}`,
          });
        }
      } catch (error) {
        console.error('Processing error:', error);
        await db.meeting.update({ where: { id: meeting.id }, data: { status: 'ERROR' } });
      }
    })();
  } catch (error) {
    console.error('Error starting processing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/meetings/:id - Update meeting
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const existing = await db.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const { title, description, participantNames } = req.body;

    const meeting = await db.meeting.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
      include: { participants: true },
    });

    if (participantNames) {
      for (const [speakerLabel, name] of Object.entries(participantNames)) {
        await db.participant.updateMany({
          where: { meetingId: req.params.id, speakerLabel },
          data: { name: name as string },
        });
      }
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const existing = await db.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await db.meeting.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as meetingsRoutes };
