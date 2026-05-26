export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  priority: number | null;
  tags: string[] | null;
  created_at: string;
}

export interface TicketFull extends Ticket {
  company_id: string;
  user_id: string | null;
  user_name: string | null;
  email: string | null;
  ai_context: AiContext | null;
  ai_suggested_response: string | null;
  resolution: string | null;
  assigned_to: string | null;
  updated_at: string;
}

export interface AiContext {
  is_recurring_issue: boolean;
  customer_sentiment: string;
  historical_summary: string;
}

export interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export type TicketFormState = { error: string; ticket: TicketData | null };

export interface Reply {
  id: string;
  ticket_id: string;
  user_id: string | null;
  author_type: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface ReplyState {
  error: string;
  success: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    company_id?: string;
    full_name?: string;
    role?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface AgentUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface InvitationData {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
  token: string;
  accepted: boolean;
  created_at: string;
}
