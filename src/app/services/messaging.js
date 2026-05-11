import { getSupabase } from "../../shared/services/supabaseClient.js";
import { shouldStartRealtime } from "../../shared/utils/realtimePolicy.js";

const MESSAGING_EVENTS = {
  conversationsChanged: 'messaging:conversations-changed',
};

function getBus() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    return window;
  }
  return null;
}


function handleError(error, context) {
  if (error) {
    console.error(`[messaging] ${context}`, error);
    throw new Error(error.message || context);
  }
}

export function emitConversationsChanged() {
  const bus = getBus();
  if (!bus) return;
  bus.dispatchEvent(new CustomEvent(MESSAGING_EVENTS.conversationsChanged));
}

export function subscribeConversationsChanged(handler) {
  const bus = getBus();
  if (!bus) return () => {};
  bus.addEventListener(MESSAGING_EVENTS.conversationsChanged, handler);
  return () => bus.removeEventListener(MESSAGING_EVENTS.conversationsChanged, handler);
}

export function mapConversationRow(row, userId, unreadCount = 0) {
  const other = row.buyer_id === userId ? row.seller : row.buyer;
  const otherId = row.buyer_id === userId ? row.seller_id : row.buyer_id;

  return {
    id: row.id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    sellerId: otherId,
    listing_id: row.listing_id,
    name: other?.name || 'مستخدم',
    init: (other?.name || 'م')[0],
    accountType: other?.account_type || 'individual',
    lastMsg: row.last_message || '',
    time: row.last_at ? new Date(row.last_at).toLocaleDateString('ar') : '',
    unread: unreadCount || 0,
    property: row.listings?.title || '',
    online: false,
  };
}

export function mapMessageRow(row, userId) {
  return {
    id: row.id,
    from: row.sender_id === userId ? 'me' : 'them',
    text: row.content,
    time: new Date(row.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }),
    created_at: row.created_at,
    sender_id: row.sender_id,
    pending: false,
    failed: false,
  };
}

export async function fetchConversationRows(sb, userId) {
  const { data, error } = await sb
    .from('conversations')
    .select('*,buyer:profiles!buyer_id(name, account_type),seller:profiles!seller_id(name, account_type), listings(title)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchUnreadMap(sb, userId) {
  const { data, error } = await sb
    .from('messages')
    .select('conversation_id')
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) throw error;

  return (data || []).reduce((acc, item) => {
    acc[item.conversation_id] = (acc[item.conversation_id] || 0) + 1;
    return acc;
  }, {});
}

export async function fetchConversationSummaries(sb, userId) {
  const [rows, unreadMap] = await Promise.all([
    fetchConversationRows(sb, userId),
    fetchUnreadMap(sb, userId),
  ]);

  return rows.map((row) => mapConversationRow(row, userId, unreadMap[row.id] || 0));
}

export async function fetchMessages(sb, conversationId, userId) {
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) throw error;
  return (data || []).map((row) => mapMessageRow(row, userId));
}

export async function markConversationRead(sb, conversationId, userId) {
  if (!conversationId || !userId) return;
  const { error } = await sb
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('is_read', false);
  handleError(error, 'markConversationRead');
}

/**
 * تعليم كل رسائل محادثة كمقروءة (بدون الحاجة لتمرير sb أو userId)
 * بديل عن markMessagesRead القديمة في contentService (مع إصلاح بَق getClient)
 */
export async function markMessagesRead(conversationId) {
  if (!conversationId) return;
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false);
}

/**
 * جلب كلمات الفلترة الممنوعة في الدردشة (lowercase)
 */
export async function fetchBannedWords() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from("banned_words").select("word");
  return (data || [])
    .map((row) => String(row.word || "").toLowerCase())
    .filter(Boolean);
}

/**
 * البحث عن محادثة موجودة بين مشتر وبائع، أو إنشاء واحدة جديدة
 * يُرجع { conv, isNew } — null لو فشل
 */
export async function findOrCreateConversation(buyerId, sellerId) {
  if (!buyerId || !sellerId || buyerId === sellerId) return null;
  const sb = getSupabase();
  if (!sb) return null;

  const { data: existing } = await sb
    .from("conversations")
    .select("*")
    .or(
      `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`
    )
    .limit(1)
    .maybeSingle();

  if (existing) return { conv: existing, isNew: false };

  const { data: newConv, error } = await sb
    .from("conversations")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      last_message: "",
      last_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return null;
  return { conv: newConv, isNew: true };
}

export async function removeConversation(sb, conversationId) {
  const { error: msgErr } = await sb.from('messages').delete().eq('conversation_id', conversationId);
  handleError(msgErr, 'removeConversation:messages');
  const { error: convErr } = await sb.from('conversations').delete().eq('id', conversationId);
  handleError(convErr, 'removeConversation:conversation');
}

export async function removeMessage(sb, messageId) {
  const { error } = await sb.from('messages').delete().eq('id', messageId);
  handleError(error, 'removeMessage');
}

export async function createMessage(sb, payload) {
  const { data, error } = await sb.from('messages').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function touchConversation(sb, conversationId, content) {
  const { error } = await sb
    .from('conversations')
    .update({ last_message: content, last_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function createMessageNotification(sb, receiverId, senderName, content, conversationId) {
  if (!receiverId) return;

  const row = {
    user_id: receiverId,
    type: 'message',
    text: `${senderName || 'مستخدم'}: ${content.slice(0, 60)}`,
    is_read: false,
  };

  // لا نرسل conversation_id كعمود مباشر؛ بعض قواعد البيانات القديمة لا تملك هذا العمود.
  // نخزنه داخل data إن كان العمود موجوداً، حتى تبقى الإشعارات قابلة للربط بالمحادثة بلا تعديل للـ schema.
  if (conversationId) {
    row.data = { conversation_id: conversationId };
  }

  await sb.from('notifications').insert(row);
}

export function replacePendingWithServerMessage(currentMessages, serverMessage, userId) {
  const mapped = mapMessageRow(serverMessage, userId);
  const serverCreatedAt = new Date(serverMessage.created_at).getTime();

  const pendingIndex = currentMessages.findIndex((item) => {
    if (!item?.pending) return false;
    if (item.from !== 'me') return false;
    if (item.text !== mapped.text) return false;
    const pendingTime = item.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.abs(serverCreatedAt - pendingTime) < 15000;
  });

  if (pendingIndex >= 0) {
    const next = [...currentMessages];
    next[pendingIndex] = mapped;
    return next;
  }

  if (currentMessages.some((item) => item.id === mapped.id)) {
    return currentMessages;
  }

  return [...currentMessages, mapped].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}


export async function findOrCreateConversationForListing(currentUserId, sellerId, listingId) {
  if (!currentUserId || !sellerId || !listingId || currentUserId === sellerId) return null;
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("conversations")
    .select("*")
    .eq("listing_id", listingId)
    .or(`and(buyer_id.eq.${currentUserId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${currentUserId})`)
    .maybeSingle();

  if (existing) return { conv: existing, isNew: false };

  const { data: newConv, error } = await sb
    .from("conversations")
    .insert({
      buyer_id: currentUserId,
      seller_id: sellerId,
      listing_id: listingId,
      last_message: "",
      last_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return { conv: newConv, isNew: true };
}

export async function sendConversationText({ conversationId, senderId, receiverId, content, senderName }) {
  const sb = getSupabase();
  const msg = String(content || "").trim();
  if (!conversationId || !senderId || !receiverId || !msg) return null;
  const message = await createMessage(sb, {
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content: msg,
    is_read: false,
  });
  await touchConversation(sb, conversationId, msg);
  await createMessageNotification(sb, receiverId, senderName, msg, conversationId);
  emitConversationsChanged();
  return message;
}


export async function fetchConversationSummariesForUser(userId) {
  const sb = getSupabase();
  if (!sb || !userId) return [];
  return fetchConversationSummaries(sb, userId);
}

export async function fetchMessagesForConversation(conversationId, userId) {
  const sb = getSupabase();
  if (!sb || !conversationId || !userId) return [];
  return fetchMessages(sb, conversationId, userId);
}

export async function markConversationReadForUser(conversationId, userId) {
  const sb = getSupabase();
  if (!sb || !conversationId || !userId) return;
  return markConversationRead(sb, conversationId, userId);
}

export async function deleteConversationById(conversationId) {
  const sb = getSupabase();
  if (!sb || !conversationId) return false;
  await removeConversation(sb, conversationId);
  emitConversationsChanged();
  return true;
}

export async function deleteMessageById(messageId) {
  const sb = getSupabase();
  if (!sb || !messageId) return false;
  await removeMessage(sb, messageId);
  emitConversationsChanged();
  return true;
}

export async function sendMessageInConversation({ conversationId, senderId, receiverId, content, senderName }) {
  const sb = getSupabase();
  if (!sb || !conversationId || !senderId || !receiverId) throw new Error("Missing message dependencies");
  const saved = await createMessage(sb, {
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    is_read: false,
  });
  await touchConversation(sb, conversationId, content);
  await createMessageNotification(sb, receiverId, senderName, content, conversationId);
  emitConversationsChanged();
  return saved;
}

export function subscribeToConversationList(userId, onChange) {
  if (!shouldStartRealtime({ requireRealtimePage: true })) return () => {};

  const sb = getSupabase();
  if (!sb || !userId) return () => {};
  const refresh = () => onChange?.();
  const channel = sb
    .channel(`conversations-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, refresh)
    .subscribe();
  const unsubscribe = subscribeConversationsChanged(refresh);
  return () => {
    unsubscribe();
    sb.removeChannel(channel);
  };
}

export function subscribeToChatMessages(conversationId, handlers = {}) {
  if (!shouldStartRealtime({ requireRealtimePage: true })) return () => {};

  const sb = getSupabase();
  if (!sb || !conversationId) return () => {};
  const channel = sb
    .channel(`chat-${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handlers.onInsert?.(payload))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handlers.onDelete?.(payload))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handlers.onUpdate?.(payload))
    .subscribe();
  return () => sb.removeChannel(channel);
}
