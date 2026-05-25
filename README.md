# TicketSupport — Frontend Multi-Agente

Interfaz de usuario para el sistema de soporte técnico con IA. Permite a clientes crear tickets desde landing pages públicas por empresa, y a agentes humanos gestionarlos con asistencia de IA.

## Stack

- **Framework**: Next.js 16.2 (App Router)
- **Estilos**: Tailwind CSS v4 con animaciones Framer Motion
- **Iconos**: Lucide React
- **Backend de datos**: Supabase (Auth + Database + Realtime)
- **Autenticación**: Supabase SSR con `@supabase/ssr`

## Flujo de Datos

```
Cliente → [slug].vercel.app (formulario público)
  → Server Action (createTicket)
  → Supabase INSERT (estado: PENDING_TRIAGE)
  → (Webhook externo procesa con IA — opcional)
  → Realtime actualiza dashboard del agente
  → Agente ve análisis IA, edita borrador y responde
  → Ticket marcado como RESOLVED
```

## Páginas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Crear ticket (demo) | Público |
| `/[slug]` | Landing público por empresa | Público |
| `/login` | Inicio de sesión de agentes | Público |
| `/signup` | Registro de nueva empresa | Público |
| `/dashboard` | Lista de tickets con filtros | Agentes autenticados |
| `/tickets/[id]` | Detalle del ticket + responder | Agentes autenticados |

## Setup Local

### Requisitos

- Node.js 20+
- Una cuenta en [Supabase](https://supabase.com) con proyecto creado
- El backend de agentes IA corriendo (opcional para UI sola)

### Pasos

```bash
git clone https://github.com/schyzoid07/ticketapp-front.git
cd ticketapp-front
pnpm install
```

Crea un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_DEFAULT_COMPANY_ID=uuid_de_tu_company_demo
NEXT_PUBLIC_DEFAULT_USER_ID=uuid_de_tu_usuario_demo
NEXT_PUBLIC_DEFAULT_USER_NAME=Nombre Demo
```

Ejecuta las migraciones SQL del backend (`00001_initial_schema.sql`, `00002_add_replies.sql`, `00003_multi_tenant_setup.sql`) contra tu proyecto Supabase desde el SQL Editor del dashboard.

Inicia el servidor:

```bash
pnpm dev
```

## Funcionalidades

- **Formulario público por empresa**: Cada empresa tiene una URL única (`/mi-empresa`) donde sus clientes crean tickets.
- **Registro de empresas**: Cualquiera puede registrar su empresa y crear una cuenta admin.
- **Dashboard con filtros**: Filtra tickets por prioridad (1-4), estado (PENDING_TRIAGE, OPEN, RESOLVED, CLOSED) y rango de fechas via URL params.
- **Análisis IA**: Cada ticket muestra contexto generado por IA (reincidencia, sentimiento del cliente, resumen histórico).
- **Respuesta sugerida**: La IA genera un borrador que el agente puede editar antes de enviar.
- **Override de prioridad**: El agente puede cambiar la prioridad asignada por la IA.
- **Actualizaciones en vivo**: El dashboard se actualiza automáticamente via WebSockets (Supabase Realtime).
- **Scope safety**: Tickets fuera del ámbito de soporte técnico se cierran automáticamente.

## Limitaciones Free Tier

- **Supabase Auth**: Hasta 50,000 usuarios activos mensuales.
- **Supabase Realtime**: 200 conexiones concurrentes, 2 millones de mensajes/mes.
- **Supabase Database**: 500 MB de almacenamiento, 2 GB de ancho de banda.
- **Backend IA**: El pipeline de agentes corre en un backend separado con sus propias limitaciones (Gemini 5 req/min).
- **Sin email transactional**: No se envían notificaciones por correo (requiere Resend/SendGrid configurado).
- **Sin Database Webhook automático**: El pipeline IA se dispara manualmente vía endpoint test hasta tener URL pública.

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
