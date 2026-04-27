export type SupportSenderRole = "store_manager" | "super_admin";
export type SupportConversationStatus = "open" | "archived";
export type SupportInboxFilter = "all" | "unread" | "read" | "archived";
export type SupportMessageKind = "text" | "image" | "file";

export interface SupportConversation {
  id: string;
  store_id: number;
  owner_id: string;
  status: SupportConversationStatus;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender: SupportSenderRole | null;
  created_at: string;
  updated_at: string;
  store_name?: string | null;
  store_logo?: string | null;
  owner_name?: string | null;
  unread_admin_count?: number;
  unread_store_count?: number;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: SupportSenderRole;
  body: string | null;
  message_kind?: SupportMessageKind;
  attachment_path?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  read_by_store_at: string | null;
  read_by_admin_at: string | null;
  created_at: string;
}

export interface SupportAttachmentInput {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
  kind: Exclude<SupportMessageKind, "text">;
}
