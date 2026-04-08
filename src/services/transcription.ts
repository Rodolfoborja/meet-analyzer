import { AssemblyAI, TranscriptUtterance } from "assemblyai";

export interface TranscriptionSegment {
  timestamp: number;
  speaker: string;
  text: string;
  confidence: number;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  rawText: string;
  wordCount: number;
  duration: number;
  speakers: string[];
  language: string;
  transcriptId: string;
}

export class TranscriptionService {
  private client: AssemblyAI;

  constructor(apiKey: string) {
    this.client = new AssemblyAI({ apiKey });
  }

  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    // Create transcription with speaker diarization
    const transcript = await this.client.transcripts.transcribe({
      audio: audioUrl,
      speaker_labels: true,
      language_detection: true,
      punctuate: true,
      format_text: true,
    });

    if (transcript.status === "error") {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    // Parse utterances into segments
    const segments: TranscriptionSegment[] = [];
    const speakerSet = new Set<string>();

    if (transcript.utterances) {
      for (const utterance of transcript.utterances) {
        const speaker = utterance.speaker || "Unknown";
        speakerSet.add(speaker);

        segments.push({
          timestamp: utterance.start / 1000, // Convert ms to seconds
          speaker: `Speaker ${speaker}`,
          text: utterance.text,
          confidence: utterance.confidence,
        });
      }
    }

    // Fallback if no utterances (no speaker diarization)
    if (segments.length === 0 && transcript.words) {
      let currentText = "";
      let currentStart = 0;

      for (const word of transcript.words) {
        if (!currentText) {
          currentStart = word.start;
        }
        currentText += (currentText ? " " : "") + word.text;

        // Create segments at sentence boundaries
        if (word.text.match(/[.!?]$/)) {
          segments.push({
            timestamp: currentStart / 1000,
            speaker: "Speaker 1",
            text: currentText,
            confidence: word.confidence,
          });
          currentText = "";
        }
      }

      // Add remaining text
      if (currentText) {
        segments.push({
          timestamp: currentStart / 1000,
          speaker: "Speaker 1",
          text: currentText,
          confidence: 0.9,
        });
      }
      speakerSet.add("1");
    }

    return {
      segments,
      rawText: transcript.text || "",
      wordCount: transcript.words?.length || 0,
      duration: (transcript.audio_duration || 0),
      speakers: Array.from(speakerSet).map((s) => `Speaker ${s}`),
      language: transcript.language_code || "es",
      transcriptId: transcript.id,
    };
  }

  async getTranscriptionStatus(transcriptId: string): Promise<string> {
    const transcript = await this.client.transcripts.get(transcriptId);
    return transcript.status;
  }
}

// Helper to calculate speaking time per speaker
export function calculateSpeakingMetrics(
  segments: TranscriptionSegment[]
): Map<string, { speakingTime: number; wordCount: number; turnCount: number }> {
  const metrics = new Map<
    string,
    { speakingTime: number; wordCount: number; turnCount: number }
  >();

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];

    // Estimate duration based on next segment or word count
    const duration = nextSegment
      ? nextSegment.timestamp - segment.timestamp
      : segment.text.split(" ").length * 0.5; // ~0.5 sec per word

    const words = segment.text.split(/\s+/).filter((w) => w).length;

    const existing = metrics.get(segment.speaker) || {
      speakingTime: 0,
      wordCount: 0,
      turnCount: 0,
    };

    metrics.set(segment.speaker, {
      speakingTime: existing.speakingTime + duration,
      wordCount: existing.wordCount + words,
      turnCount: existing.turnCount + 1,
    });
  }

  return metrics;
}
