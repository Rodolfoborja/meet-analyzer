"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileAudio,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "upload" | "details" | "processing" | "complete";

export default function NewMeetingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      // Auto-generate title from filename
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".webm"],
      "video/*": [".mp4", ".webm"],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      setAudioUrl(uploadData.url);
      setStep("details");
    } catch (err: any) {
      setError(err.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAndProcess = async () => {
    if (!title || !audioUrl) return;

    setStep("processing");
    setError("");

    try {
      // Create meeting
      const createRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          audioUrl,
          platform: "UPLOAD",
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to create meeting");
      }

      const meeting = await createRes.json();
      setMeetingId(meeting.id);

      // Start processing
      const processRes = await fetch(`/api/meetings/${meeting.id}/process`, {
        method: "POST",
      });

      if (!processRes.ok) {
        const data = await processRes.json();
        throw new Error(data.error || "Failed to process meeting");
      }

      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Error processing meeting");
      setStep("details");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Nueva Reunión</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Archivo de Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-lg">Suelta el archivo aquí...</p>
                ) : (
                  <>
                    <p className="text-lg mb-2">
                      Arrastra un archivo de audio aquí
                    </p>
                    <p className="text-sm text-gray-500">
                      o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      MP3, WAV, M4A, OGG, WebM, MP4 (máx. 500MB)
                    </p>
                  </>
                )}
              </div>

              {file && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Reunión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Reunión de planificación semanal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Notas adicionales sobre la reunión..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setAudioUrl("");
                  }}
                >
                  Volver
                </Button>
                <Button onClick={handleCreateAndProcess} disabled={!title}>
                  Procesar Reunión
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Procesando reunión...</h2>
              <p className="text-gray-600 mb-4">
                Esto puede tomar unos minutos dependiendo de la duración del
                audio.
              </p>
              <div className="text-sm text-gray-500">
                <p>1. Transcribiendo audio con identificación de hablantes</p>
                <p>2. Analizando contenido con IA</p>
                <p>3. Generando resumen y action items</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">¡Listo!</h2>
              <p className="text-gray-600 mb-6">
                Tu reunión ha sido procesada exitosamente.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard">
                  <Button variant="outline">Ir al Dashboard</Button>
                </Link>
                <Link href={`/meetings/${meetingId}`}>
                  <Button>Ver Análisis</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
