import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TranscriptionSegment } from "./transcription";

export type LlmProvider = "openai" | "anthropic" | "gemini";

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  actionItems: Array<{
    task: string;
    assignee?: string;
    deadline?: string;
    priority?: "high" | "medium" | "low";
  }>;
  decisions: string[];
  followUps: string[];
  oratoryMetrics?: OratoryMetrics;
}

export interface OratoryMetrics {
  speakingPace: { [speaker: string]: number }; // words per minute
  fillerWords: { [speaker: string]: { [word: string]: number } };
  participationBalance: { [speaker: string]: number }; // percentage
}

const ANALYSIS_PROMPT = `Analiza la siguiente transcripción de una reunión y proporciona:

1. **Resumen Ejecutivo**: Un resumen conciso de 2-3 párrafos sobre la reunión.

2. **Puntos Clave**: Los temas principales discutidos (lista de 5-10 puntos).

3. **Action Items / Compromisos**: Tareas específicas mencionadas con:
   - Descripción de la tarea
   - Persona asignada (si se menciona)
   - Fecha límite (si se menciona)
   - Prioridad estimada (alta/media/baja)

4. **Decisiones Tomadas**: Lista de decisiones explícitas o implícitas acordadas.

5. **Seguimientos Pendientes**: Temas que requieren seguimiento o fueron dejados sin resolver.

Responde en formato JSON con esta estructura:
{
  "summary": "...",
  "keyPoints": ["punto1", "punto2", ...],
  "actionItems": [
    {"task": "...", "assignee": "...", "deadline": "...", "priority": "high|medium|low"}
  ],
  "decisions": ["decisión1", "decisión2", ...],
  "followUps": ["seguimiento1", "seguimiento2", ...]
}

TRANSCRIPCIÓN:
`;

const ORATORY_PROMPT = `Analiza los patrones de comunicación en esta transcripción:

1. Identifica palabras de relleno (muletillas) por hablante: "eh", "este", "bueno", "o sea", "básicamente", "digamos", etc.

2. Evalúa la claridad y estructura del discurso de cada participante.

Responde en JSON:
{
  "fillerWords": {
    "Speaker X": {"eh": 5, "este": 3, ...}
  },
  "clarity": {
    "Speaker X": "Evaluación breve de claridad y estructura"
  }
}

TRANSCRIPCIÓN:
`;

export class AnalysisService {
  private provider: LlmProvider;
  private apiKey: string;

  constructor(provider: LlmProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  async analyze(
    segments: TranscriptionSegment[],
    rawText: string
  ): Promise<AnalysisResult> {
    // Format transcript for analysis
    const formattedTranscript = segments
      .map(
        (s) =>
          `[${this.formatTime(s.timestamp)}] ${s.speaker}: ${s.text}`
      )
      .join("\n");

    const prompt = ANALYSIS_PROMPT + formattedTranscript;

    let response: string;

    switch (this.provider) {
      case "openai":
        response = await this.analyzeWithOpenAI(prompt);
        break;
      case "anthropic":
        response = await this.analyzeWithAnthropic(prompt);
        break;
      case "gemini":
        response = await this.analyzeWithGemini(prompt);
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }

    // Parse JSON response
    const result = this.parseJsonResponse(response);

    // Calculate oratory metrics
    const oratoryMetrics = await this.analyzeOratory(segments, formattedTranscript);

    return {
      ...result,
      oratoryMetrics,
    };
  }

  private async analyzeWithOpenAI(prompt: string): Promise<string> {
    const client = new OpenAI({ apiKey: this.apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado en análisis de reuniones. Responde siempre en JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || "{}";
  }

  private async analyzeWithAnthropic(prompt: string): Promise<string> {
    const client = new Anthropic({ apiKey: this.apiKey });

    const message = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nResponde únicamente con el JSON, sin texto adicional.`,
        },
      ],
    });

    const content = message.content[0];
    return content.type === "text" ? content.text : "{}";
  }

  private async analyzeWithGemini(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(
      `${prompt}\n\nResponde únicamente con JSON válido, sin markdown ni texto adicional.`
    );

    return result.response.text();
  }

  private async analyzeOratory(
    segments: TranscriptionSegment[],
    formattedTranscript: string
  ): Promise<OratoryMetrics> {
    // Calculate speaking pace
    const speakingPace: { [speaker: string]: number } = {};
    const speakerTimes: { [speaker: string]: { words: number; time: number } } =
      {};

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];
      const duration = nextSegment
        ? nextSegment.timestamp - segment.timestamp
        : segment.text.split(" ").length * 0.4;

      const words = segment.text.split(/\s+/).filter((w) => w).length;

      if (!speakerTimes[segment.speaker]) {
        speakerTimes[segment.speaker] = { words: 0, time: 0 };
      }
      speakerTimes[segment.speaker].words += words;
      speakerTimes[segment.speaker].time += duration;
    }

    for (const [speaker, data] of Object.entries(speakerTimes)) {
      if (data.time > 0) {
        speakingPace[speaker] = Math.round((data.words / data.time) * 60);
      }
    }

    // Calculate participation balance
    const totalWords = Object.values(speakerTimes).reduce(
      (sum, d) => sum + d.words,
      0
    );
    const participationBalance: { [speaker: string]: number } = {};

    for (const [speaker, data] of Object.entries(speakerTimes)) {
      participationBalance[speaker] = Math.round(
        (data.words / totalWords) * 100
      );
    }

    // Detect filler words (basic version - LLM can provide more accurate)
    const fillerPatterns = [
      "\\beh\\b",
      "\\beste\\b",
      "\\bbueno\\b",
      "\\bo sea\\b",
      "\\bbásicamente\\b",
      "\\bdigamos\\b",
      "\\bpues\\b",
      "\\bmmm\\b",
      "\\bumm\\b",
    ];

    const fillerWords: { [speaker: string]: { [word: string]: number } } = {};

    for (const segment of segments) {
      if (!fillerWords[segment.speaker]) {
        fillerWords[segment.speaker] = {};
      }

      const text = segment.text.toLowerCase();
      for (const pattern of fillerPatterns) {
        const regex = new RegExp(pattern, "gi");
        const matches = text.match(regex);
        if (matches) {
          const word = pattern.replace(/\\b/g, "");
          fillerWords[segment.speaker][word] =
            (fillerWords[segment.speaker][word] || 0) + matches.length;
        }
      }
    }

    return {
      speakingPace,
      fillerWords,
      participationBalance,
    };
  }

  private parseJsonResponse(response: string): Omit<AnalysisResult, "oratoryMetrics"> {
    try {
      // Clean up response - remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }

      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary || "",
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
        decisions: parsed.decisions || [],
        followUps: parsed.followUps || [],
      };
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      return {
        summary: "Error al procesar el análisis",
        keyPoints: [],
        actionItems: [],
        decisions: [],
        followUps: [],
      };
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}
