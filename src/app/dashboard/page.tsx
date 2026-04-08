"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  FileAudio,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  platform: string;
  status: string;
  duration: number | null;
  createdAt: string;
  participants: Array<{ speakerLabel: string; name: string | null }>;
  analysis: { summary: string; keyPoints: string[] } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    totalMinutes: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchMeetings();
    }
  }, [session]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meetings?limit=10");
      const data = await res.json();
      setMeetings(data.meetings || []);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeek = data.meetings.filter(
        (m: Meeting) => new Date(m.createdAt) > weekAgo
      ).length;
      const totalMinutes = data.meetings.reduce(
        (sum: number, m: Meeting) => sum + (m.duration || 0),
        0
      );

      setStats({
        total: data.total || 0,
        thisWeek,
        totalMinutes,
      });
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "TRANSCRIBING":
      case "ANALYZING":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MeetAnalyzer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Reuniones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisWeek}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Minutos Analizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMinutes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Reuniones</h2>
          <Link href="/meetings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reunión
            </Button>
          </Link>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay reuniones todavía
              </h3>
              <p className="text-gray-600 mb-4">
                Sube un archivo de audio para comenzar a analizar tus reuniones.
              </p>
              <Link href="/meetings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Primera Reunión
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <Card className="hover:shadow-md transition cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {statusIcon(meeting.status)}
                        <div>
                          <h3 className="font-semibold">{meeting.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
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
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    {meeting.analysis?.summary && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {meeting.analysis.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
