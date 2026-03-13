import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ChatWindow.module.css";
import {
  FaPaperPlane,
  FaTrash,
  FaUser,
  FaSmile,
  FaCopy,
  FaEdit,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import messageService from "../../services/messageService.js";
import EmojiPicker from "emoji-picker-react";
import JobCompletionWidget from "../JobCompletionWidget/JobCompletionWidget.jsx";
import toastService from "../../services/toastService";
import { useLanguage } from "../../translet/LanguageContext";

function ChatWindow({
  conversation,
  currentUserId,
  onMessageSent,
  onMessageDeleted,
  onBackClick,
  loading = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [applicationData, setApplicationData] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const lastMessageIdRef = useRef(null);
  const messagesRef = useRef(messages); // Ref to track current messages
  const loadingMessagesRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const checkTypingIntervalRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const { t } = useLanguage();

  // Update messagesRef when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = (force = false) => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: force ? "auto" : "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      });
    });
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!conversation?.id) return;

    // Set current user is typing
    if (!isTyping) {
      setIsTyping(true);
    }

    // Broadcast typing status
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "typing",
        conversationId: conversation.id,
        userId: currentUserId,
        timestamp: Date.now(),
      });
    }

    // Also save to localStorage for persistence
    localStorage.setItem(
      `typing_${conversation.id}`,
      JSON.stringify({
        userId: currentUserId,
        timestamp: Date.now(),
      })
    );

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      localStorage.removeItem(`typing_${conversation.id}`);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "stop-typing",
          conversationId: conversation.id,
          userId: currentUserId,
        });
      }
    }, 2000);
  };

  // Check if other user is typing
  const checkOtherUserTyping = useCallback(() => {
    if (!conversation?.id) return;

    try {
      const typingData = localStorage.getItem(`typing_${conversation.id}`);
      if (typingData) {
        const { userId, timestamp } = JSON.parse(typingData);
        // Check if it's not current user and within 3 seconds
        if (userId !== currentUserId && Date.now() - timestamp < 3000) {
          setOtherUserTyping(true);
        } else {
          setOtherUserTyping(false);
        }
      } else {
        setOtherUserTyping(false);
      }
    } catch (error) {
      console.error("Error checking typing status:", error);
    }
  }, [conversation?.id, currentUserId]);

  const loadMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!conversation?.id || loadingMessagesRef.current) return;

      try {
        setLoadingMessages(true);
        loadingMessagesRef.current = true;
        const response = await messageService.getMessages(
          conversation.id,
          pageNum,
          50
        );
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
    },
    [conversation?.id]
  );

  // Poll for typing status
  useEffect(() => {
    if (conversation?.id) {
      // Initialize BroadcastChannel
      try {
        broadcastChannelRef.current = new BroadcastChannel("chat-typing");

        // Listen for typing events from other tabs
        broadcastChannelRef.current.onmessage = (event) => {
          const { type, conversationId, userId, timestamp } = event.data;

          if (conversationId === conversation.id && userId !== currentUserId) {
            if (type === "typing" && Date.now() - timestamp < 3000) {
              setOtherUserTyping(true);
            } else if (type === "stop-typing") {
              setOtherUserTyping(false);
            }
          }
        };
      } catch (error) {
        console.log("BroadcastChannel not supported, using polling");
      }

      checkOtherUserTyping();
      checkTypingIntervalRef.current = setInterval(checkOtherUserTyping, 500);

      // Listen for storage changes from other tabs/windows
      const handleStorageChange = (e) => {
        if (e.key === `typing_${conversation.id}`) {
          checkOtherUserTyping();
        }
      };

      window.addEventListener("storage", handleStorageChange);

      return () => {
        if (checkTypingIntervalRef.current) {
          clearInterval(checkTypingIntervalRef.current);
        }
        window.removeEventListener("storage", handleStorageChange);
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close();
        }
      };
    }
  }, [conversation?.id, checkOtherUserTyping, currentUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (conversation?.id) {
        localStorage.removeItem(`typing_${conversation.id}`);
      }
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation?.id) {
      isInitialLoad.current = true;
      setMessages([]);
      setPage(1);
      setHasMore(true);
      lastMessageIdRef.current = null; // Reset last message ID
      loadingMessagesRef.current = false; // Reset loading ref
      setOtherUserTyping(false); // Reset typing indicator
      setApplicationData(conversation.application || null); // Set application data
      loadMessages(1, false);
    }
  }, [conversation?.id, conversation?.application, loadMessages]);

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
        const response = await messageService.getMessages(
          conversation.id,
          1,
          50
        );
        const latestMessages = response.data || [];

        console.log("Polling: Got messages", {
          count: latestMessages.length,
          hasDeletedMessages: latestMessages.filter((m) => m.deletedAt).length,
          deletedMessages: latestMessages
            .filter((m) => m.deletedAt)
            .map((m) => ({
              id: m.id,
              deletedAt: m.deletedAt,
              content: m.content,
            })),
        });

        if (latestMessages.length > 0) {
          // Get the latest message ID
          const latestMessageId = latestMessages[latestMessages.length - 1].id;

          // Check if we have a new message or any message updates (like deletedAt)
          // If lastMessageIdRef is null, it means this is the first poll, so check against current messages
          let hasChanges = false;

          // Always compare with last known message ID from ref
          // If ref is null, it means initial load hasn't completed yet, so skip
          if (lastMessageIdRef.current === null) {
            // Initial load not complete yet, skip this poll
            return;
          }

          // Compare with last known message ID (new message)
          hasChanges = lastMessageIdRef.current !== latestMessageId;

          // Also check if any existing message was updated (e.g., deleted)
          if (
            !hasChanges &&
            messagesRef.current.length === latestMessages.length
          ) {
            // Compare messages to detect updates (like deletedAt changes)
            for (let i = 0; i < latestMessages.length; i++) {
              const currentMsg = messagesRef.current.find(
                (m) => m.id === latestMessages[i].id
              );
              if (currentMsg) {
                // Check if deletedAt changed (compare as strings)
                const currentDeletedAt = currentMsg.deletedAt
                  ? String(currentMsg.deletedAt)
                  : null;
                const latestDeletedAt = latestMessages[i].deletedAt
                  ? String(latestMessages[i].deletedAt)
                  : null;

                console.log("Comparing message:", {
                  id: currentMsg.id,
                  currentDeletedAt,
                  latestDeletedAt,
                  isDifferent: currentDeletedAt !== latestDeletedAt,
                });

                if (currentDeletedAt !== latestDeletedAt) {
                  hasChanges = true;
                  console.log("Detected deletedAt change:", {
                    messageId: latestMessages[i].id,
                    old: currentDeletedAt,
                    new: latestDeletedAt,
                  });
                  break;
                }
                // Check if content changed (edit)
                if (currentMsg.content !== latestMessages[i].content) {
                  hasChanges = true;
                  console.log("Detected content change:", {
                    messageId: latestMessages[i].id,
                  });
                  break;
                }
                // Check if isEdited changed
                if (currentMsg.isEdited !== latestMessages[i].isEdited) {
                  hasChanges = true;
                  break;
                }
              }
            }
          }

          if (hasChanges) {
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

  // Validate message content for sensitive information
  const validateMessage = (content) => {
    const issues = [];

    // Email regex pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
    if (emailPattern.test(content)) {
      issues.push("email");
    }

    // Phone number patterns
    // Vietnamese phone: starts with 0 or +84, followed by 9-10 digits
    // Format: 0xx-xxx-xxxx, 0xx.xxx.xxxx, 0xxxxxxxxx, +84xxxxxxxxx
    const vnPhonePattern = /(\+84|0)[1-9]\d{8,9}\b/g;
    // International phone: +[country code][number with spaces/dashes]
    const intlPhonePattern = /\+\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{4,}/g;
    // Phone with separators: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx
    const formattedPhonePattern = /[()]?\d{3,4}[()]?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
    
    // Check for phone numbers (but exclude years like 2024, 2025, etc.)
    const yearPattern = new RegExp(`\\b(19|20)\\d{2}\\b`, 'g');
    const years = content.match(yearPattern) || [];
    const isYear = (num) => {
      const numStr = num.toString();
      return (numStr.length === 4 && (numStr.startsWith('19') || numStr.startsWith('20'))) ||
             years.some(y => numStr.includes(y));
    };

    if (vnPhonePattern.test(content) || intlPhonePattern.test(content) || formattedPhonePattern.test(content)) {
      const phoneMatches = [
        ...content.matchAll(vnPhonePattern),
        ...content.matchAll(intlPhonePattern),
        ...content.matchAll(formattedPhonePattern)
      ];
      
      // Check if matches are not years or common non-phone numbers
      const hasPhone = phoneMatches.some(match => {
        const num = match[0].replace(/[\s.()-]/g, '');
        return num.length >= 8 && !isYear(num) && !num.match(/^[12]\d{3}$/); // Exclude years
      });
      
      if (hasPhone) {
        issues.push("phone");
      }
    }

    // Bank account number (STK) pattern: typically 10-16 digits
    // Look for sequences of 10+ consecutive digits that might be account numbers
    const accountPattern = /\b\d{10,16}\b/g;
    if (accountPattern.test(content)) {
      const matches = content.match(accountPattern) || [];
      // Exclude years and common number patterns
      const hasAccount = matches.some(m => {
        const num = m;
        // Exclude if it's a year (4 digits starting with 19 or 20)
        if (num.length === 4 && (num.startsWith('19') || num.startsWith('20'))) {
          return false;
        }
        // Exclude if it's a date pattern (8 digits like 20240101)
        if (num.length === 8 && num.startsWith('20')) {
          return false;
        }
        // Account numbers are typically 10-16 digits
        return num.length >= 10;
      });
      
      if (hasAccount) {
        issues.push("account");
      }
    }

    return issues;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation?.id) return;

    const messageContent = newMessage.trim();
    
    // Validate message for sensitive information
    const validationIssues = validateMessage(messageContent);
    if (validationIssues.length > 0) {
      let warningMessage = t("chat.warning.containsSensitive") || "Cảnh báo: Tin nhắn của bạn có chứa thông tin nhạy cảm: ";
      const issueLabels = [];
      
      if (validationIssues.includes("email")) {
        issueLabels.push(t("chat.warning.email") || "Email");
      }
      if (validationIssues.includes("phone")) {
        issueLabels.push(t("chat.warning.phone") || "Số điện thoại");
      }
      if (validationIssues.includes("account")) {
        issueLabels.push(t("chat.warning.account") || "Số tài khoản");
      }
      
      warningMessage += issueLabels.join(", ");
      warningMessage += ". " + (t("chat.warning.recommendation") || "Vui lòng không chia sẻ thông tin cá nhân qua tin nhắn.");
      
      toastService.warning(warningMessage, 7000);
      setNewMessage(messageContent); // Keep the message so user can edit
      return;
    }

    setNewMessage("");
    setSending(true);

    try {
      // Send text message only
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
      const response = await messageService.deleteMessage(messageId);
      console.log("Delete response:", response.data);

      // Update message in state with deleted version
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === messageId ? response.data : msg
        );
        console.log(
          "Updated messages after delete:",
          updated.filter((m) => m.deletedAt)
        );
        return updated;
      });

      if (onMessageDeleted) {
        onMessageDeleted(messageId);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Không thể xóa tin nhắn");
    }
  };

  const handleCopyMessage = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Error copying message:", error);
      alert("Đã sao chép!");
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingContent.trim()) return;

    try {
      await messageService.updateMessage(messageId, {
        content: editingContent,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: editingContent, isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Không thể sửa tin nhắn");
    }
  };

  const handleEmojiSelect = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
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
        {onBackClick && (
          <button
            className={styles.backButton}
            onClick={onBackClick}
            title="Quay lại"
          >
            ←
          </button>
        )}
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
        {/* Job Completion Widget */}
        {applicationData && (
          <JobCompletionWidget
            application={applicationData}
            currentUserId={currentUserId}
            onUpdate={(updatedApp) => {
              setApplicationData(updatedApp);
              // Optionally reload conversation to get fresh data
            }}
          />
        )}

        {loadingMessages && page > 1 && (
          <div className={styles.loadMore}>Đang tải thêm...</div>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === parseInt(currentUserId);
          const isEditing = editingMessageId === message.id;
          return (
            <div
              key={message.id}
              className={`${styles.message} ${
                isOwn ? styles.messageOwn : styles.messageOther
              }`}
            >
              <div className={styles.messageContent}>
                {!isOwn && (
                  <div className={styles.messageAvatar}>
                    {message.sender?.avatar ? (
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.fullName}
                      />
                    ) : (
                      <span className={styles.avatarInitials}>
                        {getInitials(message.sender?.fullName)}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.messageBubbleWrapper}>
                  {isEditing ? (
                    <div className={styles.editingBubble}>
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(message.id);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleSaveEdit(message.id)}
                          className={styles.saveEditBtn}
                          title="Lưu"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={styles.cancelEditBtn}
                          title="Hủy"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.messageBubble}>
                      {/* Check if message is deleted */}
                      {message.deletedAt ? (
                        // Deleted message display
                        <div className={styles.deletedMessage}>
                          <p className={styles.deletedText}>
                            Tin nhắn đã bị xóa
                          </p>
                          <div className={styles.messageMeta}>
                            <span className={styles.messageTime}>
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        // Normal message display
                        <>
                          {message.content && (
                            <p className={styles.messageText}>
                              {message.content}
                            </p>
                          )}
                          {message.isEdited && (
                            <span className={styles.editedLabel}>
                              (Đã chỉnh sửa)
                            </span>
                          )}
                          <div className={styles.messageMeta}>
                            <span className={styles.messageTime}>
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && message.isRead && (
                              <span className={styles.readIndicator}></span>
                            )}
                          </div>
                          <div className={styles.messageActions}>
                            <button
                              onClick={() =>
                                handleCopyMessage(message.content, message.id)
                              }
                              className={styles.actionBtn}
                              title="Copy tin nhắn"
                            >
                              {copiedMessageId === message.id ? (
                                ""
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                            {isOwn && !message.deletedAt && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(message)}
                                  className={styles.actionBtn}
                                  title="Sửa tin nhắn"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteMessage(message.id)
                                  }
                                  className={styles.actionBtn}
                                  title="Xóa tin nhắn"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
            </div>
            <span className={styles.typingText}>
              {conversation?.otherUser?.fullName || "Người dùng"} đang soạn
              tin...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageInput} onSubmit={handleSendMessage}>
        <button
          type="button"
          className={styles.emojiButton}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Chọn emoji"
        >
          <FaSmile />
        </button>
        {showEmojiPicker && (
          <div className={styles.emojiPickerWrapper}>
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme="light"
              searchPlaceHolder="Tìm emoji..."
              width="100%"
              height="400px"
            />
          </div>
        )}

        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
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
