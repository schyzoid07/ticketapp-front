# TicketSupport — Frontend Multi-Agente

Interfaz de usuario para el sistema de soporte técnico con IA. Permite a clientes crear tickets desde landing pages públicas por empresa, y a agentes humanos gestionarlos con asistencia de IA.

## Stack

- **Framework**: Next.js 16.2 (App Router)
- **Estilos**: Tailwind CSS v4 con animaciones Framer Motion
- **Paleta**: Ámbar (#f59e0b) + Naranja (#f97316) — reemplaza el indigo/purple anterior
- **Iconos**: Lucide React
- **Backend de datos**: Supabase (Auth + Database + Realtime)
- **Autenticación**: Supabase SSR con `@supabase/ssr`
- **Keep-alive**: Vercel Cron Jobs (ping al backend cada 5 min para evitar sleep en free tier)

## Flujo de Datos

```
Cliente → [slug].vercel.app (formulario público)
  → Server Action (createTicket)
  → Supabase INSERT (estado: PENDING_TRIAGE)
  → (Webhook externo procesa con IA — opcional)
  → Realtime actualiza dashboard del agente
  → Agente ve análisis IA, toma el ticket, responde y resuelve
  → Ticket marcado como RESOLVED
```

## Páginas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing principal | Público |
| `/[slug]` | Landing público por empresa | Público |
| `/login` | Inicio de sesión de agentes | Público |
| `/signup` | Registro de nueva empresa | Público |
| `/invite` | Aceptar invitación de equipo | Público (con token) |
| `/dashboard` | Lista de tickets con filtros | Agentes autenticados |
| `/tickets/[id]` | Detalle del ticket + responder | Agentes autenticados |
| `/profile` | Perfil del usuario + empresa | Agentes autenticados |
| `/admin/agents` | Equipo y estadísticas por agente | Owner y Admin |

## Setup Local

### Requisitos

- Node.js 20+
- **pnpm** (reemplaza a npm, evitar vulnerabilidades)
- Una cuenta en [Supabase](https://supabase.com) con proyecto creado
- El backend de agentes IA corriendo (opcional para UI sola)

### Pasos

```bash
git clone https://github.com/schyzoid07/ticketapp-front.git
cd ticketapp-front
pnpm install
```

> **Nota**: Este proyecto usa **pnpm** en lugar de npm por seguridad (vulnerabilidades conocidas en npm). Si clonas el repo, asegúrate de tener pnpm instalado (`npm install -g pnpm`).

Crea un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_COMPANY_ID=uuid_de_tu_company_demo
NEXT_PUBLIC_DEFAULT_USER_ID=uuid_de_tu_usuario_demo
NEXT_PUBLIC_DEFAULT_USER_NAME=Nombre Demo
```

Ejecuta las migraciones SQL del backend (`00001_initial_schema.sql`, `00002_add_replies.sql`, `00003_multi_tenant_setup.sql`, `00006_in_progress_status.sql`) contra tu proyecto Supabase desde el SQL Editor del dashboard.

Inicia el servidor:

```bash
pnpm dev
```

## Funcionalidades

- **Formulario público por empresa**: Cada empresa tiene una URL única (`/mi-empresa`) donde sus clientes crean tickets.
- **Registro de empresas**: Cualquiera puede registrar su empresa y crear una cuenta owner.
- **Sistema de 3 roles**: Owner (dueño), Admin, Agent (agente de soporte).
- **Dashboard con filtros**: Filtra tickets por prioridad (1-4), estado, rango de fechas, tags y asignación (sin asignar / por agente).
- **Paginación infinita**: "Cargar más" cada 10 tickets.
- **Análisis IA**: Cada ticket muestra contexto generado por IA (reincidencia, sentimiento del cliente, resumen histórico).
- **Respuesta sugerida**: La IA genera un borrador en Markdown que el agente puede editar y enviar.
- **Auto-resolve**: Al enviar respuesta, el ticket se resuelve automáticamente y se registra el nombre del agente.
- **Tomar ticket**: Los agentes pueden tomar tickets OPEN y se les asigna automáticamente.
- **Override de prioridad**: Owner/Admin pueden cambiar la prioridad asignada por la IA.
- **Perfil de usuario**: Todos ven sus datos; el owner puede editar el nombre de la empresa y ver el enlace público de tickets.
- **Estadísticas por agente**: En `/admin/agents` se muestra cuántos tickets ha resuelto y pendientes cada miembro.
- **Invitación de miembros**: Owner/Admin invitan agents mediante enlace de invitación.
- **Actualizaciones en vivo**: El dashboard se actualiza automáticamente via WebSockets (Supabase Realtime).
- **Scope safety**: Tickets fuera del ámbito de soporte técnico se cierran automáticamente (prioridad 0).
- **Keep-alive**: Vercel Cron mantiene el backend de Render activo (ping cada 5 min).

## Limitaciones Free Tier

- **Supabase Auth**: Hasta 50,000 usuarios activos mensuales.
- **Supabase Realtime**: 200 conexiones concurrentes, 2 millones de mensajes/mes.
- **Supabase Database**: 500 MB de almacenamiento, 2 GB de ancho de banda.
- **Backend IA**: El pipeline de agentes corre en Render con Gemini (5 req/min).
- **Sin email transactional**: No se envían notificaciones por correo (requiere Resend/SendGrid configurado).
- **Render free**: El backend se duerme tras 15 min de inactividad (mitigado por keep-alive).

## Prueba de funcionamiento en producción

### 1. Backend

```bash
curl https://ticketapp-back.onrender.com/
# → { "status": "ok", "service": "ticket-agent-api" }

curl -X POST https://ticketapp-back.onrender.com/api/webhooks/test-process \
  -H "Content-Type: application/json" \
  -d '{"ticket":{"title":"Error al iniciar sesión","description":"No puedo acceder","user_name":"Carlos"}}'
# → Debe devolver JSON con category, priority, tags, ai_context, ai_suggested_response
```

### 2. Frontend

- Visitar `https://ticketapp-front.vercel.app/` → landing con botón "Registrar mi empresa"
- Visitar `https://ticketapp-front.vercel.app/demo` → formulario público de tickets
- Ir a `https://ticketapp-front.vercel.app/login` → loguearse con `admin@demo.com / demo123456`
- Dashboard debe cargar tickets (si existen en Supabase)
- Crear un ticket desde el formulario público → debe aparecer en Supabase

### 3. Webhook (si configurado)

Al insertar un ticket desde el formulario público, el webhook dispara el pipeline IA automáticamente. Revisar logs del backend en Render.

## Pruebas Realizadas

- Creación de tickets desde formulario web
- Dashboard con filtros por prioridad, estado y rango de fechas
- Autenticación (login/logout) con Supabase SSR
- Vista detalle con contexto IA y sugerencia de respuesta
- Envío de respuestas y resolución de tickets
- Landing público por slug de empresa
- Registro de nueva empresa + admin inicial
- Override manual de prioridad
- Aislamiento multi-tenant via RLS Policies
- Asignación de tickets a agentes (ClaimButton)
- Perfil de usuario con edición de empresa (owner)
- Estadísticas por agente (pendientes y resueltos)
- Keep-alive endpoint via Vercel Cron
