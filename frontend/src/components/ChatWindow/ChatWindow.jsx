import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ChatWindow.module.css";
import { FaPaperPlane, FaTrash, FaUser } from "react-icons/fa";
import messageService from "../../services/messageService.js";

function ChatWindow({
  conversation,
  currentUserId,
  onMessageSent,
  onMessageDeleted,
  loading = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const lastMessageIdRef = useRef(null);
  const loadingMessagesRef = useRef(false);

  const scrollToBottom = (force = false) => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: force ? "auto" : "smooth",
            block: "end",
            inline: "nearest"
          });
        }
      });
    });
  };

  const loadMessages = useCallback(async (pageNum = 1, append = false) => {
    if (!conversation?.id || loadingMessagesRef.current) return;

    try {
      setLoadingMessages(true);
      loadingMessagesRef.current = true;
      const response = await messageService.getMessages(conversation.id, pageNum, 50);
      const newMessages = response.data || [];

      if (append) {
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
        // Update last message ID reference
        if (newMessages.length > 0) {
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }
      }

      setHasMore(response.pagination?.totalPages > pageNum);
      setPage(pageNum);

      // Mark conversation as read
      if (pageNum === 1 && newMessages.length > 0) {
        try {
          await messageService.markConversationAsRead(conversation.id);
        } catch (error) {
          console.error("Error marking as read:", error);
        }
      }

      // Scroll to bottom on initial load (force immediate scroll)
      if (isInitialLoad.current && !append) {
        isInitialLoad.current = false;
        // Wait for messages to render, then scroll
        setTimeout(() => scrollToBottom(true), 150);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
      loadingMessagesRef.current = false;
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation?.id) {
      isInitialLoad.current = true;
      setMessages([]);
      setPage(1);
      setHasMore(true);
      lastMessageIdRef.current = null; // Reset last message ID
      loadingMessagesRef.current = false; // Reset loading ref
      loadMessages(1, false);
    }
  }, [conversation?.id, loadMessages]);

  // Scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messages.length > 0 && !isInitialLoad.current && !loadingMessages) {
      // Small delay to ensure message is rendered
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, loadingMessages]);

  // Polling for new messages when conversation is open
  useEffect(() => {
    if (!conversation?.id) return;

    const pollInterval = setInterval(async () => {
      if (loadingMessagesRef.current) return; // Skip if already loading
      
      try {
        // Get latest messages (only first page to check for new messages)
        const response = await messageService.getMessages(conversation.id, 1, 50);
        const latestMessages = response.data || [];
        
        if (latestMessages.length > 0) {
          // Get the latest message ID
          const latestMessageId = latestMessages[latestMessages.length - 1].id;
          
          // Check if we have a new message (compare with last known message ID)
          // If lastMessageIdRef is null, it means this is the first poll, so check against current messages
          let hasNewMessage = false;
          
          // Always compare with last known message ID from ref
          // If ref is null, it means initial load hasn't completed yet, so skip
          if (lastMessageIdRef.current === null) {
            // Initial load not complete yet, skip this poll
            return;
          }
          
          // Compare with last known message ID
          hasNewMessage = lastMessageIdRef.current !== latestMessageId;
          
          if (hasNewMessage) {
            // Reload all messages to get the complete list
            setLoadingMessages(true);
            loadingMessagesRef.current = true;
            setMessages(latestMessages);
            setHasMore(response.pagination?.totalPages > 1);
            setPage(1);
            lastMessageIdRef.current = latestMessageId;
            
            // Scroll to bottom after a short delay to ensure DOM is updated
            setTimeout(() => {
              scrollToBottom();
              setLoadingMessages(false);
              loadingMessagesRef.current = false;
            }, 150);
            
            // Mark as read if new message is from other participant
            const latestMsg = latestMessages[latestMessages.length - 1];
            if (latestMsg.senderId !== parseInt(currentUserId)) {
              try {
                await messageService.markConversationAsRead(conversation.id);
              } catch (error) {
                console.error("Error marking as read:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error polling for new messages:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [conversation?.id, currentUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sentMessage = await messageService.sendMessage(
        conversation.id,
        messageContent
      );

      // Add message to local state
      setMessages((prev) => {
        const updated = [...prev, sentMessage.data];
        lastMessageIdRef.current = sentMessage.data.id;
        return updated;
      });
      // Scroll after message is added to DOM
      setTimeout(() => scrollToBottom(), 100);

      // Notify parent
      if (onMessageSent) {
        onMessageSent(sentMessage.data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;

    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      if (onMessageDeleted) {
        onMessageDeleted(messageId);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Không thể xóa tin nhắn");
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMessages) {
      loadMessages(page + 1, true);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.emptyState}>
          <FaUser className={styles.emptyIcon} />
          <p>Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.headerAvatar}>
            {conversation.otherParticipant?.avatar ? (
              <img
                src={conversation.otherParticipant.avatar}
                alt={conversation.otherParticipant.fullName}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(conversation.otherParticipant?.fullName)}
              </span>
            )}
          </div>
          <div>
            <h3 className={styles.headerName}>
              {conversation.otherParticipant?.fullName ||
                conversation.otherParticipant?.email ||
                "Người dùng"}
            </h3>
            <p className={styles.headerStatus}>Đang hoạt động</p>
          </div>
        </div>
      </div>

      <div
        className={styles.messagesContainer}
        ref={messagesContainerRef}
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMore && !loadingMessages) {
            handleLoadMore();
          }
        }}
      >
        {loadingMessages && page > 1 && (
          <div className={styles.loadMore}>Đang tải thêm...</div>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === parseInt(currentUserId);
          return (
            <div
              key={message.id}
              className={`${styles.message} ${isOwn ? styles.messageOwn : styles.messageOther}`}
            >
              <div className={styles.messageContent}>
                {!isOwn && (
                  <div className={styles.messageAvatar}>
                    {message.sender?.avatar ? (
                      <img src={message.sender.avatar} alt={message.sender.fullName} />
                    ) : (
                      <span className={styles.avatarInitials}>
                        {getInitials(message.sender?.fullName)}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.messageBubble}>
                  <p className={styles.messageText}>{message.content}</p>
                  <div className={styles.messageMeta}>
                    <span className={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && message.isRead && (
                      <span className={styles.readIndicator}>✓✓</span>
                    )}
                  </div>
                </div>
                {isOwn && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteMessage(message.id)}
                    title="Xóa tin nhắn"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageInput} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className={styles.input}
          disabled={sending}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim() || sending}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;

