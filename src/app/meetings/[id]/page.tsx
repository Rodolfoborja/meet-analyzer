"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Loader2,
  CheckCircle,
  ListChecks,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Mail,
  Download,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  status: string;
  duration: number | null;
  createdAt: string;
  transcript: {
    content: Array<{ timestamp: number; speaker: string; text: string }>;
    rawText: string;
    wordCount: number;
  } | null;
  analysis: {
    summary: string;
    keyPoints: string[];
    actionItems: Array<{
      task: string;
      assignee?: string;
      deadline?: string;
      priority?: string;
    }>;
    decisions: string[];
    followUps: string[];
    oratoryMetrics: {
      speakingPace: { [speaker: string]: number };
      participationBalance: { [speaker: string]: number };
      fillerWords: { [speaker: string]: { [word: string]: number } };
    } | null;
  } | null;
  participants: Array<{
    id: string;
    speakerLabel: string;
    name: string | null;
    speakingTime: number;
    wordCount: number;
    wordsPerMinute: number | null;
  }>;
}

type Tab = "summary" | "transcript" | "actions" | "oratory";

export default function MeetingDetailPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [editingNames, setEditingNames] = useState(false);
  const [participantNames, setParticipantNames] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    fetchMeeting();
  }, [params.id]);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        // Initialize participant names
        const names: { [key: string]: string } = {};
        data.participants.forEach((p: any) => {
          names[p.speakerLabel] = p.name || "";
        });
        setParticipantNames(names);
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNames = async () => {
    try {
      await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantNames }),
      });
      setEditingNames(false);
      fetchMeeting();
    } catch (error) {
      console.error("Error saving names:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Reunión no encontrada</p>
      </div>
    );
  }

  const tabs = [
    { id: "summary", label: "Resumen", icon: Lightbulb },
    { id: "transcript", label: "Transcripción", icon: MessageSquare },
    { id: "actions", label: "Action Items", icon: ListChecks },
    { id: "oratory", label: "Oratoria", icon: BarChart3 },
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Meeting Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{meeting.title}</h1>
              {meeting.status === "COMPLETED" && (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(meeting.createdAt)}
              </span>
              {meeting.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(meeting.duration * 60)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {meeting.participants.length} participantes
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </div>

        {/* Participants Card */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Participantes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingNames(!editingNames)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {editingNames ? "Cancelar" : "Editar Nombres"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meeting.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {(p.name || p.speakerLabel).charAt(0).toUpperCase()}
                  </div>
                  {editingNames ? (
                    <input
                      type="text"
                      value={participantNames[p.speakerLabel] || ""}
                      onChange={(e) =>
                        setParticipantNames({
                          ...participantNames,
                          [p.speakerLabel]: e.target.value,
                        })
                      }
                      className="flex-1 px-2 py-1 border rounded"
                      placeholder={p.speakerLabel}
                    />
                  ) : (
                    <div>
                      <p className="font-medium">
                        {p.name || p.speakerLabel}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(p.speakingTime)} · {p.wordCount} palabras
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {editingNames && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveNames}>Guardar Nombres</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "summary" && meeting.analysis && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Ejecutivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {meeting.analysis.summary}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Puntos Clave</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {meeting.analysis.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {meeting.analysis.decisions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Decisiones Tomadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.analysis.decisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        {decision}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "transcript" && meeting.transcript && (
          <Card>
            <CardHeader>
              <CardTitle>Transcripción Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {meeting.transcript.content.map((segment, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-xs text-gray-400 font-mono w-16">
                      {formatTime(segment.timestamp)}
                    </span>
                    <div>
                      <span className="font-medium text-primary">
                        {participantNames[segment.speaker] || segment.speaker}:
                      </span>{" "}
                      <span className="text-gray-700">{segment.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "actions" && meeting.analysis && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.analysis.actionItems.length === 0 ? (
                  <p className="text-gray-500">
                    No se identificaron action items en esta reunión.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {meeting.analysis.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <p className="font-medium">{item.task}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          {item.assignee && (
                            <span>👤 {item.assignee}</span>
                          )}
                          {item.deadline && (
                            <span>📅 {item.deadline}</span>
                          )}
                          {item.priority && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                item.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : item.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {meeting.analysis.followUps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Seguimientos Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.analysis.followUps.map((followUp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500">🔄</span>
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "oratory" && meeting.analysis?.oratoryMetrics && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Participación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    meeting.analysis.oratoryMetrics.participationBalance
                  ).map(([speaker, percentage]) => (
                    <div key={speaker}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{participantNames[speaker] || speaker}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Velocidad de Habla</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    meeting.analysis.oratoryMetrics.speakingPace
                  ).map(([speaker, wpm]) => (
                    <div
                      key={speaker}
                      className="flex justify-between items-center"
                    >
                      <span>{participantNames[speaker] || speaker}</span>
                      <span className="font-mono text-lg">
                        {wpm}{" "}
                        <span className="text-sm text-gray-500">
                          palabras/min
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Velocidad promedio recomendada: 120-150 palabras/minuto
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Palabras de Relleno (Muletillas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(
                    meeting.analysis.oratoryMetrics.fillerWords
                  ).map(([speaker, words]) => (
                    <div key={speaker}>
                      <h4 className="font-medium mb-2">
                        {participantNames[speaker] || speaker}
                      </h4>
                      {Object.keys(words).length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No se detectaron muletillas
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(words).map(([word, count]) => (
                            <span
                              key={word}
                              className="px-2 py-1 bg-gray-100 rounded text-sm"
                            >
                              "{word}" × {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
