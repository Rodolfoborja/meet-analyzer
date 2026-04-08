# 🎙️ MeetAnalyzer

Plataforma de análisis inteligente de reuniones virtuales.

## ✨ Características

- 📝 **Transcripción Automática** - Con identificación de hablantes
- 🤖 **Análisis con IA** - GPT-4, Claude, Gemini (configurable)
- ✅ **Action Items** - Extracción automática de tareas y compromisos
- 📊 **Métricas de Oratoria** - Participación, velocidad, muletillas
- 📧 **Reportes por Email** - Envío automático post-reunión

## 📁 Estructura

```
meet-analyzer/
├── backend/          # API REST (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── routes/   # Endpoints API
│   │   ├── services/ # Transcripción, Análisis, Email
│   │   └── middleware/
│   ├── prisma/       # Schema de base de datos
│   └── Dockerfile
├── frontend/         # UI (Next.js + React + Tailwind)
│   ├── src/
│   │   ├── app/      # Páginas
│   │   ├── components/
│   │   └── lib/      # API client, utils
│   └── Dockerfile
├── docker-compose.yml
└── docs/
```

## 🚀 Deployment en Dokploy

### 1. Crear servicio PostgreSQL

En Dokploy, crear un nuevo servicio PostgreSQL y copiar la URL de conexión.

### 2. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

**Variables requeridas:**
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/meetanalyzer
JWT_SECRET=<openssl rand -base64 32>
FRONTEND_URL=https://meet.tudominio.com
BACKEND_URL=https://api-meet.tudominio.com
ASSEMBLYAI_API_KEY=tu-api-key
```

### 3. Desplegar

**Opción A: Docker Compose**
```bash
docker-compose up -d
```

**Opción B: Servicios separados en Dokploy**

1. Crear servicio "meetanalyzer-backend" desde `./backend`
2. Crear servicio "meetanalyzer-frontend" desde `./frontend`
3. Configurar variables de entorno en cada uno
4. Configurar dominios y SSL

### 4. Inicializar base de datos

```bash
docker-compose exec backend npx prisma db push
```

## 🔧 Desarrollo Local

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurar DATABASE_URL
npm run db:push
npm run dev           # Puerto 4000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev           # Puerto 3000
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual

### Meetings
- `GET /api/meetings` - Listar reuniones
- `POST /api/meetings` - Crear reunión
- `GET /api/meetings/:id` - Detalle
- `POST /api/meetings/:id/process` - Procesar (transcribir + analizar)
- `PATCH /api/meetings/:id` - Actualizar
- `DELETE /api/meetings/:id` - Eliminar

### Settings
- `GET /api/settings` - Obtener configuración
- `PATCH /api/settings` - Actualizar API keys

### Upload
- `POST /api/upload` - Subir archivo de audio

## 🔌 Integraciones

| Servicio | Uso | Costo |
|----------|-----|-------|
| AssemblyAI | Transcripción + Diarización | ~$0.37/hora |
| OpenAI | Análisis (GPT-4) | ~$0.03/1K tokens |
| Anthropic | Análisis (Claude) | ~$0.003/1K tokens |
| Google | Análisis (Gemini) | Gratis con límites |
| Resend | Email | 3K/mes gratis |

## 📝 Licencia

MIT
