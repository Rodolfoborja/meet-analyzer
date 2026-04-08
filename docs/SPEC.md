# MeetAnalyzer - Especificación Técnica

## Visión General

Plataforma de análisis de reuniones virtuales que se integra con Google Meet, Microsoft Teams y otras plataformas para proporcionar:

- **Transcripción automática** con identificación de hablantes
- **Resúmenes inteligentes** generados por IA
- **Extracción de action items** y compromisos
- **Análisis de oratoria** (velocidad, claridad, participación)
- **Reportes** visuales en dashboard y por correo

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js + React)                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │Dashboard│  │Meetings │  │ Reports │  │Settings │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│                    (Node.js + Express)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Service │  │Meeting Service│  │Analysis Svc │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Bot Service  │  │ Email Service│  │ Report Svc  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │     Redis       │ │   File Storage  │
│   (Meetings,    │ │   (Jobs,        │ │   (Audio,       │
│    Users)       │ │    Sessions)    │ │    Reports)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘

                    INTEGRACIONES EXTERNAS
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Google Meet    │ │ Microsoft Teams │ │   Zoom (futuro) │
│  Calendar API   │ │   Graph API     │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Speech-to-Text │ │   LLM APIs      │ │   Email (SMTP)  │
│  (Whisper/      │ │ (Gemini/Claude/ │ │   (Resend/      │
│   AssemblyAI)   │ │  OpenAI)        │ │    SendGrid)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Funcionalidades Detalladas

### 1. Conexión a Reuniones

**Opción A: Bot que se une a la reunión**
- Usar Recall.ai, Assembly.ai o similar para unirse como participante
- Graba audio y detecta hablantes automáticamente

**Opción B: Grabación manual + upload**
- Usuario sube grabación de la reunión
- Sistema procesa el archivo

**Opción C: Integraciones nativas (recomendado para MVP)**
- Google Meet: usar Google Cloud Speech-to-Text con diarización
- Teams: usar Azure Cognitive Services

### 2. Transcripción

- **Motor principal:** AssemblyAI o Whisper (local/API)
- **Diarización:** Identificar speakers automáticamente
- **Formato:** Timestamps + speaker labels

### 3. Análisis con IA

Configurable por usuario (API key propia):
- **Gemini** (Google)
- **Claude** (Anthropic)
- **GPT-4** (OpenAI)

**Outputs:**
- Resumen ejecutivo
- Puntos clave discutidos
- Action items con asignados
- Compromisos y deadlines
- Decisiones tomadas

### 4. Análisis de Oratoria

- Tiempo de habla por participante (%)
- Velocidad de habla (palabras/minuto)
- Interrupciones
- Palabras de relleno ("eh", "este", "bueno")
- Claridad y estructura

### 5. Reportes

**Dashboard:**
- Lista de reuniones
- Detalle por reunión
- Métricas agregadas
- Historial de análisis

**Email:**
- Resumen automático post-reunión
- PDF adjunto opcional
- Configurable: inmediato o programado

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **ORM:** Prisma
- **Jobs:** BullMQ + Redis
- **Auth:** NextAuth.js

### Base de Datos
- **Principal:** PostgreSQL
- **Cache/Queue:** Redis
- **Files:** S3-compatible (MinIO local o AWS)

### APIs Externas
- **Transcripción:** AssemblyAI (incluye diarización)
- **LLM:** Configurable (Gemini/Claude/GPT)
- **Email:** Resend
- **Calendar:** Google Calendar API

## Modelo de Datos

```sql
-- Usuarios
users {
  id UUID PK
  email VARCHAR
  name VARCHAR
  api_keys JSONB  -- {gemini: "...", anthropic: "...", openai: "..."}
  settings JSONB
  created_at TIMESTAMP
}

-- Reuniones
meetings {
  id UUID PK
  user_id UUID FK
  title VARCHAR
  platform ENUM (google_meet, teams, zoom, upload)
  meeting_url VARCHAR
  scheduled_at TIMESTAMP
  duration_minutes INT
  status ENUM (pending, processing, completed, error)
  created_at TIMESTAMP
}

-- Transcripciones
transcripts {
  id UUID PK
  meeting_id UUID FK
  content JSONB  -- [{timestamp, speaker, text}]
  raw_audio_url VARCHAR
  created_at TIMESTAMP
}

-- Análisis
analyses {
  id UUID PK
  meeting_id UUID FK
  llm_provider VARCHAR
  summary TEXT
  key_points JSONB
  action_items JSONB  -- [{task, assignee, deadline}]
  decisions JSONB
  oratory_metrics JSONB
  created_at TIMESTAMP
}

-- Participantes
participants {
  id UUID PK
  meeting_id UUID FK
  name VARCHAR
  email VARCHAR
  speaker_label VARCHAR  -- "Speaker 1", etc
  speaking_time_seconds INT
  word_count INT
}
```

## Flujo de Uso

1. **Usuario configura API keys** (una vez)
2. **Conecta calendario** (Google/Microsoft)
3. **Reunión ocurre:**
   - Opción A: Bot se une automáticamente
   - Opción B: Usuario sube grabación
4. **Sistema procesa:**
   - Transcribe audio
   - Identifica hablantes
   - Analiza con LLM configurado
5. **Usuario recibe:**
   - Notificación en app
   - Email con resumen
   - Acceso a reporte completo

## Fases de Desarrollo

### Fase 1: MVP (2-3 semanas)
- [ ] Estructura del proyecto
- [ ] Autenticación básica
- [ ] Upload de archivos de audio
- [ ] Transcripción con AssemblyAI
- [ ] Análisis con LLM (una opción)
- [ ] Dashboard básico
- [ ] Envío de email

### Fase 2: Integraciones (2 semanas)
- [ ] Conexión Google Calendar
- [ ] Bot para Google Meet
- [ ] Múltiples LLMs configurables
- [ ] Reportes PDF

### Fase 3: Avanzado (2 semanas)
- [ ] Microsoft Teams integration
- [ ] Análisis de oratoria completo
- [ ] Analytics agregados
- [ ] API pública

## Configuración Requerida

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Transcription
ASSEMBLYAI_API_KEY=...

# Email
RESEND_API_KEY=...

# Storage
S3_ENDPOINT=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
```

## Notas de Implementación

### Detección de Hablantes
AssemblyAI incluye "Speaker Diarization" que automáticamente:
- Detecta número de hablantes
- Asigna labels (Speaker A, B, C...)
- Permite mapear labels a nombres reales

### Unirse a Reuniones
Para que un bot se una a Meet/Teams:
- **Recall.ai** - Servicio especializado (de pago)
- **Custom bot** - Puppeteer + Chromium (complejo)
- **Recomendación inicial:** Empezar con upload manual, agregar bot después

### Límites de APIs
- AssemblyAI: $0.37/hora de audio
- LLMs: Variable según tokens
- Considerar caching de análisis
