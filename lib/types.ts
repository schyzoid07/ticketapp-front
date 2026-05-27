import type {
  Ticket,
  TicketFull,
  TicketData,
  Reply,
  Company,
  AgentUser,
  InvitationData,
} from './schemas';

export type {
  Ticket,
  TicketFull,
  TicketData,
  Reply,
  Company,
  AgentUser,
  InvitationData,
};

export type { AiContext } from './schemas';

export type TicketFormState = { error: string; ticket: TicketData | null; rateLimit?: { remaining: number; resetMinutes: number } };
export type ReplyState = { error: string; success: boolean };
export type ClaimTicketState = { error: string; success: boolean };

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    company_id?: string;
    full_name?: string;
    role?: string;
  };
}
