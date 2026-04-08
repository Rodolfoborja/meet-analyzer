import Link from "next/link";
import { ArrowRight, FileAudio, Brain, Mail, Users, BarChart3, Mic } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MeetAnalyzer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Comenzar gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Transforma tus reuniones en
          <span className="text-primary"> insights accionables</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transcribe automáticamente, identifica hablantes, genera resúmenes 
          inteligentes y extrae compromisos de todas tus reuniones virtuales.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
          >
            Empezar ahora <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#features"
            className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
          >
            Ver características
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Todo lo que necesitas para reuniones productivas
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileAudio className="h-8 w-8" />}
            title="Transcripción Automática"
            description="Convierte audio a texto con identificación automática de hablantes y timestamps precisos."
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="Análisis con IA"
            description="Usa Gemini, Claude o GPT para generar resúmenes, extraer puntos clave y detectar compromisos."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Detección de Hablantes"
            description="Identifica automáticamente quién dijo qué y mapea los hablantes a nombres reales."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Análisis de Oratoria"
            description="Métricas de participación, velocidad de habla, palabras de relleno y más."
          />
          <FeatureCard
            icon={<Mail className="h-8 w-8" />}
            title="Reportes por Email"
            description="Recibe automáticamente el resumen de cada reunión en tu correo."
          />
          <FeatureCard
            icon={<Mic className="h-8 w-8" />}
            title="Multi-Plataforma"
            description="Compatible con Google Meet, Microsoft Teams, Zoom y archivos de audio."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step
              number={1}
              title="Configura"
              description="Conecta tu API key de IA preferida (Gemini, Claude o GPT)"
            />
            <Step
              number={2}
              title="Sube o Conecta"
              description="Sube un archivo de audio o conecta con Google Meet/Teams"
            />
            <Step
              number={3}
              title="Procesa"
              description="El sistema transcribe e identifica a cada hablante"
            />
            <Step
              number={4}
              title="Analiza"
              description="Obtén resumen, action items y métricas de oratoria"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Comienza a analizar tus reuniones hoy
        </h2>
        <p className="text-gray-600 mb-8">
          Usa tu propia API key. Sin costos ocultos.
        </p>
        <Link
          href="/register"
          className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition inline-flex items-center gap-2"
        >
          Crear cuenta gratuita <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 MeetAnalyzer. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
