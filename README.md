# 🎙️ MeetAnalyzer

Plataforma de análisis inteligente de reuniones virtuales. Transcribe automáticamente, identifica hablantes, genera resúmenes con IA y extrae action items.

## ✨ Características

- **📝 Transcripción Automática** - Con identificación de hablantes (diarización)
- **🤖 Análisis con IA** - Soporta OpenAI (GPT-4), Anthropic (Claude), Google (Gemini)
- **✅ Extracción de Action Items** - Detecta tareas, asignados y deadlines
- **📊 Análisis de Oratoria** - Velocidad, participación, muletillas
- **📧 Reportes por Email** - Envío automático post-reunión
- **🔐 Tu propia API Key** - Usa tus propias credenciales, sin costos ocultos

## 🚀 Quick Start

### Requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis (opcional, para jobs en background)
- API Key de [AssemblyAI](https://www.assemblyai.com/) (para transcripción)

### Instalación

```bash
# Clonar o navegar al directorio
cd meet-analyzer

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push

# Iniciar en desarrollo
npm run dev
```

### Variables de Entorno Requeridas

```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/meetanalyzer"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-uno-con-openssl-rand-base64-32"

# Transcripción (AssemblyAI)
ASSEMBLYAI_API_KEY="tu-api-key"

# Email (opcional - Resend)
RESEND_API_KEY="tu-api-key"
EMAIL_FROM="MeetAnalyzer <noreply@tudominio.com>"
```

### Primera Ejecución

1. Abre `http://localhost:3000`
2. Inicia sesión (demo: cualquier email + contraseña `demo123`)
3. Ve a **Settings** y configura tu API key de IA (OpenAI, Anthropic o Gemini)
4. Sube un archivo de audio de una reunión
5. Espera el procesamiento (~1-2 min por hora de audio)
6. ¡Revisa tu análisis completo!

## 📖 Uso

### Subir una Reunión

1. Click en "Nueva Reunión"
2. Arrastra o selecciona un archivo de audio (MP3, WAV, M4A, etc.)
3. Ingresa un título descriptivo
4. Click "Procesar Reunión"

### Formatos Soportados

- Audio: MP3, WAV, M4A, OGG, WebM
- Video: MP4, WebM (se extrae el audio)
- Tamaño máximo: 500 MB

### Análisis Generado

- **Resumen Ejecutivo** - Párrafo conciso de la reunión
- **Puntos Clave** - Temas principales discutidos
- **Action Items** - Tareas con asignados y deadlines
- **Decisiones** - Acuerdos explícitos o implícitos
- **Seguimientos** - Temas pendientes

### Métricas de Oratoria

- Tiempo de habla por participante
- Palabras por minuto (velocidad)
- Balance de participación
- Detección de muletillas

## 🏗️ Arquitectura

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── meetings/       # CRUD de reuniones
│   │   ├── settings/       # Configuración
│   │   └── login/          # Autenticación
│   ├── components/         # Componentes React
│   ├── lib/                # Utilidades
│   └── services/           # Servicios de negocio
│       ├── transcription.ts # AssemblyAI
│       ├── analysis.ts      # LLM Analysis
│       └── email.ts         # Email Reports
├── prisma/
│   └── schema.prisma       # Modelo de datos
└── docs/
    └── SPEC.md             # Especificación técnica
```

## 🔌 Integraciones

### Transcripción: AssemblyAI

Usamos [AssemblyAI](https://www.assemblyai.com/) para:
- Transcripción de alta precisión
- Diarización automática (identificar hablantes)
- Soporte multi-idioma (español, inglés, etc.)
- Costo: ~$0.37/hora de audio

### LLMs para Análisis

Configurable por usuario:

| Provider | Modelo | Costo aprox. |
|----------|--------|--------------|
| OpenAI | GPT-4 Turbo | ~$0.03/1K tokens |
| Anthropic | Claude 3 Sonnet | ~$0.003/1K tokens |
| Google | Gemini Pro | Gratis (con límites) |

### Email: Resend

[Resend](https://resend.com/) para envío de reportes.
- 3,000 emails/mes gratis
- API simple y confiable

## 🛣️ Roadmap

### Fase 1 ✅ MVP
- [x] Upload de audio
- [x] Transcripción con diarización
- [x] Análisis con IA
- [x] Dashboard básico
- [x] Reportes por email

### Fase 2 🚧 En progreso
- [ ] Integración Google Calendar
- [ ] Bot para Google Meet
- [ ] Exportar a PDF
- [ ] Webhooks

### Fase 3 📋 Planeado
- [ ] Microsoft Teams integration
- [ ] Zoom integration
- [ ] API pública
- [ ] Workspace/equipos

## 🐛 Troubleshooting

### Error: "No API key configured"
→ Ve a Settings y agrega tu API key del proveedor de IA elegido.

### Error: "Transcription failed"
→ Verifica que el archivo de audio sea válido y que tu API key de AssemblyAI esté configurada.

### Error de base de datos
→ Asegúrate de que PostgreSQL esté corriendo y ejecuta `npm run db:push`.

## 📝 Licencia

MIT - Usa, modifica y distribuye libremente.

---

Creado con ❤️ para hacer las reuniones más productivas.
