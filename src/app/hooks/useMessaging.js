import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteConversationById as deleteConversationByIdService,
  deleteMessageById as deleteMessageByIdService,
  emitConversationsChanged,
  fetchConversationSummariesForUser,
  fetchMessagesForConversation,
  mapMessageRow,
  markConversationReadForUser,
  replacePendingWithServerMessage,
  sendMessageInConversation,
  subscribeToChatMessages,
  subscribeToConversationList,
} from "../services/messaging.js";

export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const reloadTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const loadConversations = useCallback(async () => {
    if (!userId) {
      if (mountedRef.current) {
        setConversations([]);
        setLoading(false);
      }
      return;
    }

    const requestId = ++requestIdRef.current;
    if (mountedRef.current) setLoading(true);

    try {
      const next = await fetchConversationSummariesForUser(userId);
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setConversations(next);
    } catch (error) {
      console.error("load conversations failed", error);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setConversations([]);
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      loadConversations();
    }, 120);
  }, [loadConversations]);

  const openConversation = useCallback(async (conversation, setChat, setPage) => {
    setChat?.(conversation);
    setPage?.("chat");

    if (!userId || !conversation?.id) return;

    setConversations((prev) => prev.map((item) => (
      item.id === conversation.id ? { ...item, unread: 0 } : item
    )));

    try {
      await markConversationReadForUser(conversation.id, userId);
      emitConversationsChanged();
    } catch (error) {
      console.error("mark conversation read failed", error);
      scheduleReload();
    }
  }, [scheduleReload, userId]);

  const deleteConversationById = useCallback(async (conversationId) => {
    if (!conversationId) return false;

    const previous = conversations;
    setConversations((prev) => prev.filter((item) => item.id !== conversationId));

    try {
      await deleteConversationByIdService(conversationId);
      return true;
    } catch (error) {
      console.error("delete conversation failed", error);
      setConversations(previous);
      return false;
    }
  }, [conversations]);

  useEffect(() => {
    mountedRef.current = true;
    loadConversations();

    if (!userId) {
      return () => {
        mountedRef.current = false;
        clearTimeout(reloadTimerRef.current);
      };
    }

    const unsubscribe = subscribeToConversationList(userId, scheduleReload);

    return () => {
      mountedRef.current = false;
      clearTimeout(reloadTimerRef.current);
      unsubscribe();
    };
  }, [loadConversations, scheduleReload, userId]);

  return {
    conversations,
    loading,
    reloadConversations: loadConversations,
    openConversation,
    deleteConversationById,
  };
}

export function useChatMessages({ conversation, user, bannedWords = [] }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warnMsg, setWarnMsg] = useState("");
  const warnTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const userId = user?.id;
  const conversationId = conversation?.id;

  const showWarning = useCallback((message) => {
    clearTimeout(warnTimerRef.current);
    setWarnMsg(message);
    warnTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setWarnMsg("");
    }, 3000);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      if (mountedRef.current) {
        setMessages([]);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) setLoading(true);
    try {
      const next = await fetchMessagesForConversation(conversationId, userId);
      if (mountedRef.current) setMessages(next);
      await markConversationReadForUser(conversationId, userId);
      emitConversationsChanged();
    } catch (error) {
      console.error("load messages failed", error);
      if (mountedRef.current) setMessages([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [conversationId, userId]);

  const sendMessage = useCallback(async (rawText) => {
    const content = rawText?.trim();
    if (!content) return { ok: false, reason: "empty" };

    if (user?.isSuspended) {
      showWarning("🚫 حسابك موقوف — لا يمكنك إرسال رسائل");
      return { ok: false, reason: "suspended" };
    }

    const found = bannedWords.find((word) => content.toLowerCase().includes(word));
    if (found) {
      showWarning("⚠️ رسالتك تحتوي على كلام غير لائق");
      return { ok: false, reason: "banned-word" };
    }

    if (!conversationId || !userId) {
      showWarning("تعذر إرسال الرسالة الآن");
      return { ok: false, reason: "missing-dependencies" };
    }

    const receiverId = conversation?.seller_id === userId ? conversation?.buyer_id : conversation?.seller_id;
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingMessage = {
      id: tempId,
      from: "me",
      text: content,
      time: new Date(nowIso).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
      created_at: nowIso,
      sender_id: userId,
      pending: true,
      failed: false,
    };

    setMessages((prev) => [...prev, pendingMessage]);

    try {
      const saved = await sendMessageInConversation({
        conversationId,
        senderId: userId,
        receiverId,
        content,
        senderName: user?.name,
      });

      setMessages((prev) => replacePendingWithServerMessage(prev, saved, userId));
      return { ok: true };
    } catch (error) {
      console.error("send message failed", error);
      setMessages((prev) => prev.map((item) => (
        item.id === tempId ? { ...item, pending: false, failed: true } : item
      )));
      showWarning("فشل إرسال الرسالة — حاول مرة أخرى");
      return { ok: false, reason: "send-failed" };
    }
  }, [bannedWords, conversation, conversationId, showWarning, user, userId]);

  const deleteMessageById = useCallback(async (messageId) => {
    if (!messageId) return false;

    const previous = messages;
    setMessages((prev) => prev.filter((item) => item.id !== messageId));
    try {
      await deleteMessageByIdService(messageId);
      return true;
    } catch (error) {
      console.error("delete message failed", error);
      setMessages(previous);
      showWarning("تعذر حذف الرسالة");
      return false;
    }
  }, [messages, showWarning]);

  const deleteConversationAndLeave = useCallback(async () => {
    if (!conversationId) return false;
    try {
      await deleteConversationByIdService(conversationId);
      return true;
    } catch (error) {
      console.error("delete conversation failed", error);
      showWarning("تعذر حذف المحادثة");
      return false;
    }
  }, [conversationId, showWarning]);

  useEffect(() => {
    mountedRef.current = true;
    loadMessages();

    if (!conversationId || !userId) {
      return () => {
        mountedRef.current = false;
        clearTimeout(warnTimerRef.current);
      };
    }

    const unsubscribe = subscribeToChatMessages(conversationId, {
      onInsert: (payload) => {
        if (!payload?.new) return;
        setMessages((prev) => replacePendingWithServerMessage(prev, payload.new, userId));
        if (payload.new.receiver_id === userId && !payload.new.is_read) {
          markConversationReadForUser(conversationId, userId).then(() => emitConversationsChanged());
        }
      },
      onDelete: (payload) => {
        const deletedId = payload?.old?.id;
        if (!deletedId) return;
        setMessages((prev) => prev.filter((item) => item.id !== deletedId));
      },
      onUpdate: (payload) => {
        if (!payload?.new?.id) return;
        setMessages((prev) => prev.map((item) => (
          item.id === payload.new.id ? mapMessageRow(payload.new, userId) : item
        )));
      },
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(warnTimerRef.current);
      unsubscribe();
    };
  }, [conversationId, loadMessages, userId]);

  const hasFailedMessages = useMemo(() => messages.some((item) => item.failed), [messages]);

  return {
    messages,
    loading,
    warnMsg,
    hasFailedMessages,
    sendMessage,
    deleteMessageById,
    deleteConversationAndLeave,
    reloadMessages: loadMessages,
  };
}
