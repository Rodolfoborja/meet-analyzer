"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  defaultLlmProvider: "OPENAI" | "ANTHROPIC" | "GEMINI";
  emailNotifications: boolean;
  timezone: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings>({
    openaiApiKey: "",
    anthropicApiKey: "",
    geminiApiKey: "",
    defaultLlmProvider: "OPENAI",
    emailNotifications: true,
    timezone: "America/Guayaquil",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          openaiApiKey: data.openaiApiKey || "",
          anthropicApiKey: data.anthropicApiKey || "",
          geminiApiKey: data.geminiApiKey || "",
          defaultLlmProvider: data.defaultLlmProvider || "OPENAI",
          emailNotifications: data.emailNotifications ?? true,
          timezone: data.timezone || "America/Guayaquil",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold mb-8">Configuración</h1>

        <div className="space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys de IA</CardTitle>
              <p className="text-sm text-gray-600">
                Configura las API keys para los modelos de lenguaje. Tus keys se
                almacenan de forma segura y nunca se comparten.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OpenAI */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openai ? "text" : "password"}
                    value={settings.openaiApiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, openaiApiKey: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowKeys({ ...showKeys, openai: !showKeys.openai })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.openai ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Obtén tu key en{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>

              {/* Anthropic */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Anthropic API Key (Claude)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.anthropic ? "text" : "password"}
                    value={settings.anthropicApiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        anthropicApiKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowKeys({
                        ...showKeys,
                        anthropic: !showKeys.anthropic,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.anthropic ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Obtén tu key en{" "}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>

              {/* Gemini */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Google AI API Key (Gemini)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? "text" : "password"}
                    value={settings.geminiApiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, geminiApiKey: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="AIza..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowKeys({ ...showKeys, gemini: !showKeys.gemini })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.gemini ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Obtén tu key en{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Default Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Modelo de IA Predeterminado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "OPENAI", name: "OpenAI", model: "GPT-4 Turbo" },
                  { id: "ANTHROPIC", name: "Anthropic", model: "Claude 3" },
                  { id: "GEMINI", name: "Google", model: "Gemini Pro" },
                ].map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        defaultLlmProvider: provider.id as any,
                      })
                    }
                    className={`p-4 border rounded-lg text-left transition ${
                      settings.defaultLlmProvider === provider.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-gray-500">{provider.model}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>
                  Enviar resumen por email después de procesar cada reunión
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>Zona Horaria</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="America/Guayaquil">
                  Ecuador (GMT-5)
                </option>
                <option value="America/Lima">Perú (GMT-5)</option>
                <option value="America/Bogota">Colombia (GMT-5)</option>
                <option value="America/Mexico_City">México (GMT-6)</option>
                <option value="America/Santiago">Chile (GMT-4)</option>
                <option value="America/Buenos_Aires">Argentina (GMT-3)</option>
                <option value="Europe/Madrid">España (GMT+1)</option>
                <option value="UTC">UTC</option>
              </select>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[150px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
