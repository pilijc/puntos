import type { RealtimeChannel } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { supabase } from "@/supabase/supabase";
import {
  SupportAttachmentInput,
  SupportConversation,
  SupportConversationStatus,
  SupportMessage,
  SupportSenderRole,
} from "@/type/support-chat";

const SUPPORT_ATTACHMENTS_BUCKET = "support-attachments";

const CONVERSATION_SELECT = `
  id,
  store_id,
  owner_id,
  status,
  last_message,
  last_message_at,
  last_message_sender,
  created_at,
  updated_at,
  stores!store_id(name, logo),
  users!owner_id(name)
`;

function mapConversation(row: any): SupportConversation {
  return {
    id: row.id,
    store_id: Number(row.store_id),
    owner_id: row.owner_id,
    status: row.status,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    last_message_sender: row.last_message_sender,
    created_at: row.created_at,
    updated_at: row.updated_at,
    store_name: row.stores?.name ?? null,
    store_logo: row.stores?.logo ?? null,
    owner_name: row.users?.name ?? null,
  };
}

export async function getOrCreateSupportConversation(
  storeId: number,
  ownerId: string,
): Promise<SupportConversation> {
  const { data: existing, error: existingError } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_SELECT)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return mapConversation(existing);

  const { data, error } = await supabase
    .from("support_conversations")
    .insert({ store_id: storeId, owner_id: ownerId })
    .select(CONVERSATION_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapConversation(data);
}

export async function listSupportConversations(): Promise<SupportConversation[]> {
  const { data, error } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_SELECT)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const conversations = ((data ?? []) as any[]).map(mapConversation);
  return hydrateUnreadCounts(conversations);
}

export async function listManagerConversations(ownerId: string): Promise<SupportConversation[]> {
  const { data, error } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_SELECT)
    .eq("owner_id", ownerId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  const conversations = ((data ?? []) as any[]).map(mapConversation);
  return hydrateUnreadCounts(conversations);
}

export async function getSupportConversation(conversationId: string): Promise<SupportConversation | null> {
  const { data, error } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapConversation(data) : null;
}

export async function hydrateUnreadCounts(
  conversations: SupportConversation[],
): Promise<SupportConversation[]> {
  if (conversations.length === 0) return conversations;

  const ids = conversations.map((conversation) => conversation.id);
  const { data, error } = await supabase
    .from("support_messages")
    .select("conversation_id, sender_role, read_by_store_at, read_by_admin_at")
    .in("conversation_id", ids)
    .or("and(sender_role.eq.store_manager,read_by_admin_at.is.null),and(sender_role.eq.super_admin,read_by_store_at.is.null)");

  if (error) throw new Error(error.message);

  const counts = new Map<string, { admin: number; store: number }>();
  for (const row of (data ?? []) as any[]) {
    const current = counts.get(row.conversation_id) ?? { admin: 0, store: 0 };
    if (row.sender_role === "store_manager" && !row.read_by_admin_at) current.admin += 1;
    if (row.sender_role === "super_admin" && !row.read_by_store_at) current.store += 1;
    counts.set(row.conversation_id, current);
  }

  return conversations.map((conversation) => {
    const count = counts.get(conversation.id);
    return {
      ...conversation,
      unread_admin_count: count?.admin ?? 0,
      unread_store_count: count?.store ?? 0,
    };
  });
}

export async function loadSupportMessages(conversationId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return attachSignedUrls((data ?? []) as SupportMessage[]);
}

export async function sendSupportMessage(
  conversationId: string,
  body: string,
  senderRole: SupportSenderRole,
): Promise<SupportMessage> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: senderRole,
      body: body.trim(),
      message_kind: "text",
      read_by_store_at: senderRole === "store_manager" ? new Date().toISOString() : null,
      read_by_admin_at: senderRole === "super_admin" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as SupportMessage;
}

function sanitizeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || `attachment-${Date.now()}`;
}

function fileExtensionFromMime(mimeType: string) {
  if (mimeType.includes("/")) return mimeType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
  return "bin";
}


async function signedUrlForPath(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(SUPPORT_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function attachSignedUrls(messages: SupportMessage[]): Promise<SupportMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (!message.attachment_path) return message;
      const signedUrl = await signedUrlForPath(message.attachment_path);
      return { ...message, attachment_url: signedUrl };
    }),
  );
}

export async function uploadSupportAttachment(
  conversationId: string,
  attachment: SupportAttachmentInput,
): Promise<{
  path: string;
  signedUrl: string | null;
}> {
  const safeName = sanitizeFileName(attachment.name);
  const nameWithExtension = safeName.includes(".")
    ? safeName
    : `${safeName}.${fileExtensionFromMime(attachment.mimeType)}`;
  const path = `support/${conversationId}/${Date.now()}-${nameWithExtension}`;

  // React Native: FormData with file URI — recommended by Supabase for RN.
  // Web: fetch the URI as a Blob (file:// URIs don't exist on web anyway).
  let uploadData: FormData | Blob;
  if (Platform.OS === "web") {
    const res = await fetch(attachment.uri);
    uploadData = await res.blob();
  } else {
    const fd = new FormData();
    fd.append("file", {
      uri: attachment.uri,
      name: nameWithExtension,
      type: attachment.mimeType,
    } as any);
    uploadData = fd;
  }

  const { error } = await supabase.storage
    .from(SUPPORT_ATTACHMENTS_BUCKET)
    .upload(path, uploadData, {
      contentType: attachment.mimeType,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    path,
    signedUrl: await signedUrlForPath(path),
  };
}

export async function sendSupportAttachmentMessage(
  conversationId: string,
  attachment: SupportAttachmentInput,
  senderRole: SupportSenderRole,
  body?: string,
): Promise<SupportMessage> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("User not authenticated");

  const uploaded = await uploadSupportAttachment(conversationId, attachment);

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: senderRole,
      body: body?.trim() || null,
      message_kind: attachment.kind,
      attachment_path: uploaded.path,
      attachment_name: attachment.name,
      attachment_type: attachment.mimeType,
      attachment_size: attachment.size ?? null,
      read_by_store_at: senderRole === "store_manager" ? new Date().toISOString() : null,
      read_by_admin_at: senderRole === "super_admin" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { ...(data as SupportMessage), attachment_url: uploaded.signedUrl };
}

export async function markSupportMessagesRead(
  conversationId: string,
  reader: "store" | "admin",
): Promise<void> {
  const now = new Date().toISOString();
  const isStoreReader = reader === "store";

  let query = supabase
    .from("support_messages")
    .update(isStoreReader ? { read_by_store_at: now } : { read_by_admin_at: now })
    .eq("conversation_id", conversationId);

  query = isStoreReader
    ? query.eq("sender_role", "super_admin").is("read_by_store_at", null)
    : query.eq("sender_role", "store_manager").is("read_by_admin_at", null);

  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function setSupportConversationStatus(
  conversationId: string,
  status: SupportConversationStatus,
): Promise<void> {
  const { error } = await supabase
    .from("support_conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);
}

export function subscribeToSupportMessages(
  conversationId: string,
  onInsert: (message: SupportMessage) => void,
  onUpdate?: (message: SupportMessage) => void,
): RealtimeChannel {
  return supabase
    .channel(`support_messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const [message] = await attachSignedUrls([payload.new as SupportMessage]);
        onInsert(message);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (!onUpdate) return;
        const [message] = await attachSignedUrls([payload.new as SupportMessage]);
        onUpdate(message);
      },
    )
    .subscribe();
}

export function subscribeToSupportConversations(
  onChange: (conversationId: string) => void,
): RealtimeChannel {
  return supabase
    .channel("support_conversations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_conversations",
      },
      (payload) => {
        const row = (payload.new || payload.old) as { id?: string };
        if (row?.id) onChange(row.id);
      },
    )
    .subscribe();
}

export function removeSupportChannel(channel: RealtimeChannel | null): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
