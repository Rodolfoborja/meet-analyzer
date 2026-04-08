# Deployment - Docker en VPS

## Requisitos

- VPS con Docker y Docker Compose instalados
- Dominio configurado (ej: meet.tudominio.com)
- Certificado SSL (Let's Encrypt via Dokploy/Traefik)

## Pasos

### 1. Clonar el repositorio

```bash
git clone https://github.com/Rodolfoborja/meet-analyzer.git
cd meet-analyzer
```

### 2. Configurar variables de entorno

```bash
cp .env.production.example .env
nano .env
```

**Variables obligatorias:**
- `DB_PASSWORD` - Contraseña segura para PostgreSQL
- `NEXTAUTH_URL` - URL pública (https://meet.tudominio.com)
- `NEXTAUTH_SECRET` - Generar con: `openssl rand -base64 32`
- `ASSEMBLYAI_API_KEY` - Tu API key de AssemblyAI

### 3. Levantar servicios

```bash
docker-compose up -d
```

### 4. Inicializar base de datos

```bash
docker-compose exec app npx prisma db push
```

### 5. Verificar

```bash
docker-compose ps
docker-compose logs -f app
```

## Dokploy

Si usas Dokploy:

1. Crear nuevo proyecto desde GitHub
2. Seleccionar `docker-compose.yml`
3. Configurar variables de entorno en el panel
4. Configurar dominio y SSL automático
5. Deploy

## Nginx Reverse Proxy (alternativa)

Si usas nginx directamente:

```nginx
server {
    listen 80;
    server_name meet.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name meet.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/meet.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/meet.tudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Para uploads grandes
        client_max_body_size 500M;
    }
}
```

## Actualizaciones

```bash
cd meet-analyzer
git pull
docker-compose build
docker-compose up -d
docker-compose exec app npx prisma db push  # Si hay cambios de schema
```

## Backups

### PostgreSQL
```bash
docker-compose exec postgres pg_dump -U meetanalyzer meetanalyzer > backup.sql
```

### Restaurar
```bash
cat backup.sql | docker-compose exec -T postgres psql -U meetanalyzer meetanalyzer
```

## Monitoreo

```bash
# Logs en tiempo real
docker-compose logs -f

# Estado de contenedores
docker-compose ps

# Uso de recursos
docker stats
```

## Troubleshooting

### Error de conexión a DB
```bash
docker-compose exec app npx prisma db push
```

### Reiniciar todo
```bash
docker-compose down
docker-compose up -d
```

### Limpiar y reconstruir
```bash
docker-compose down -v  # ⚠️ Borra datos
docker-compose build --no-cache
docker-compose up -d
```
