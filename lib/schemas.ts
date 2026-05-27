import { z } from 'zod';

// ─── Form input schemas ───

export const CreateTicketSchema = z.object({
  title: z.string().trim().min(1, 'El título es requerido').max(500, 'El título no puede exceder 500 caracteres'),
  description: z.string().trim().min(1, 'La descripción es requerida').max(5000, 'La descripción no puede exceder 5000 caracteres'),
  company_id: z.string().min(1, 'La empresa es requerida'),
  user_id: z.string().optional(),
  user_name: z.string().trim().min(1, 'El nombre es requerido').max(200).optional(),
  email: z.string().trim().email('Correo electrónico inválido').optional().or(z.literal('')),
});

export const RegisterCompanySchema = z.object({
  company_name: z.string().trim().min(1, 'El nombre de empresa es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
  slug: z.string().trim().min(2, 'La dirección debe tener al menos 2 caracteres').max(50, 'La dirección no puede exceder 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  full_name: z.string().trim().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const CreateInvitationSchema = z.object({
  company_id: z.string().min(1, 'La empresa es requerida'),
  email: z.string().trim().email('Correo electrónico inválido'),
  full_name: z.string().trim().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
  role: z.enum(['admin', 'agent']),
});

export const SendReplySchema = z.object({
  ticket_id: z.string().min(1, 'ID de ticket requerido'),
  body: z.string().trim().min(1, 'La respuesta no puede estar vacía').max(10000, 'La respuesta no puede exceder 10000 caracteres'),
  user_id: z.string().optional(),
  author_name: z.string().optional(),
});

// ─── Supabase response schemas ───

export const TicketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['PENDING_TRIAGE', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  category: z.string().nullable(),
  priority: z.number().nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const AiContextSchema = z.object({
  is_recurring_issue: z.boolean(),
  customer_sentiment: z.string(),
  historical_summary: z.string(),
});

export type AiContext = z.infer<typeof AiContextSchema>;

export const TokenUsageSchema = z.object({
  triage: z.object({ promptTokens: z.number(), candidatesTokens: z.number(), totalTokens: z.number() }),
  context: z.object({ promptTokens: z.number(), candidatesTokens: z.number(), totalTokens: z.number() }),
  response: z.object({ promptTokens: z.number(), candidatesTokens: z.number(), totalTokens: z.number() }),
  total: z.object({ promptTokens: z.number(), candidatesTokens: z.number(), totalTokens: z.number() }),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const TokenUsageAggregateSchema = z.object({
  promptTokens: z.number(),
  candidatesTokens: z.number(),
  totalTokens: z.number(),
});

export type TokenUsageAggregate = z.infer<typeof TokenUsageAggregateSchema>;

export const MonthlyTokenUsageSchema = z.object({
  total: TokenUsageAggregateSchema,
  triage: TokenUsageAggregateSchema,
  context: TokenUsageAggregateSchema,
  response: TokenUsageAggregateSchema,
  ticketCount: z.number(),
});

export type MonthlyTokenUsage = z.infer<typeof MonthlyTokenUsageSchema>;

export const DailyTokenUsageSchema = z.object({
  date: z.string(),
  totalTokens: z.number(),
  ticketCount: z.number(),
});

export type DailyTokenUsage = z.infer<typeof DailyTokenUsageSchema>;

export const CompanyTokenUsageReportSchema = z.object({
  currentMonth: MonthlyTokenUsageSchema,
  previousMonthTotal: z.number(),
  previousMonthTicketCount: z.number(),
  dailyUsage: z.array(DailyTokenUsageSchema),
  recentTickets: z.array(z.object({
    id: z.string(),
    title: z.string(),
    created_at: z.string(),
    totalTokens: z.number(),
  })),
});

export type CompanyTokenUsageReport = z.infer<typeof CompanyTokenUsageReportSchema>;

export const TicketFullSchema = TicketSchema.extend({
  company_id: z.string(),
  user_id: z.string().nullable(),
  assigned_at: z.string().nullable(),
  user_name: z.string().nullable(),
  email: z.string().nullable(),
  ai_context: AiContextSchema.nullable(),
  ai_suggested_response: z.string().nullable(),
  ai_token_usage: TokenUsageSchema.nullable(),
  ai_mode: z.enum(['minimal', 'complete']).default('minimal'),
  resolution: z.string().nullable(),
  assigned_to: z.string().nullable(),
  resolved_by_name: z.string().nullable(),
  updated_at: z.string(),
});

export type TicketFull = z.infer<typeof TicketFullSchema>;

export const TicketDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['PENDING_TRIAGE', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  created_at: z.string(),
});

export type TicketData = z.infer<typeof TicketDataSchema>;

export const ReplySchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  user_id: z.string().nullable(),
  author_type: z.string(),
  author_name: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
});

export type Reply = z.infer<typeof ReplySchema>;

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  webhook_url: z.string().nullable().optional(),
});

export type Company = z.infer<typeof CompanySchema>;

export const AgentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  role: z.string(),
  created_at: z.string(),
});

export type AgentUser = z.infer<typeof AgentUserSchema>;

export const InvitationDataSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: z.string(),
  token: z.string(),
  accepted: z.boolean(),
  created_at: z.string(),
});

export type InvitationData = z.infer<typeof InvitationDataSchema>;
