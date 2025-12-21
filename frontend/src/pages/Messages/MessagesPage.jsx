import React, { useState, useEffect, useCallback } from "react";
import styles from "./MessagesPage.module.css";
import { MainLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import ConversationList from "../../components/ConversationList/ConversationList.jsx";
import ChatWindow from "../../components/ChatWindow/ChatWindow.jsx";
import messageService from "../../services/messageService.js";
import { FaInbox, FaArchive, FaSpinner } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Define loadSelectedConversation first (before useEffect that uses it)
  const loadSelectedConversation = useCallback(async (conversationId) => {
    try {
      const response = await messageService.getConversation(conversationId);
      console.log("Selected conversation response:", response);
      const conversationData = response.data?.data || response.data;
      setSelectedConversation(conversationData);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      console.log("Loading conversations with showArchived:", showArchived);
      const response = await messageService.getConversations(
        true, // Always load all conversations (including archived)
        false // Don't include deleted
      );
      console.log("Conversations response:", response);
      const conversationsData = response.data?.data || response.data || [];
      console.log("All conversations count:", conversationsData.length);

      // If showArchived is false (Inbox), show all conversations
      // If showArchived is true (Archived), show only archived conversations
      const filteredData = showArchived
        ? conversationsData.filter((conv) => conv.isArchived === true)
        : conversationsData; // Show all in inbox

      console.log("Filtered conversations count:", filteredData.length);
      setConversations(filteredData);
    } catch (error) {
      console.error("Error loading conversations:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  }, [showArchived]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await messageService.getUnreadCount();
      console.log("Unread count response:", response);
      const count =
        response.data?.unreadCount || response.data?.data?.unreadCount || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }, []);

  // Check for conversation ID in URL params
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && !selectedConversationId) {
      const id = parseInt(conversationId);
      setSelectedConversationId(id);
      loadSelectedConversation(id);
      // Remove from URL after setting
      setSearchParams({});
    }
  }, [
    searchParams,
    setSearchParams,
    selectedConversationId,
    loadSelectedConversation,
  ]);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadConversations(), loadUnreadCount()]);
      setLoading(false);
    };
    initialize();
  }, [loadConversations, loadUnreadCount]);

  // Reload when showArchived changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Polling for new messages and conversations
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
      loadUnreadCount();
      // Reload selected conversation to get updated lastMessage
      if (selectedConversationId) {
        loadSelectedConversation(selectedConversationId).then(() => {
          // This will trigger ChatWindow to refresh if conversation data changed
        });
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    loadConversations,
    loadUnreadCount,
    loadSelectedConversation,
    selectedConversationId,
  ]);

  const handleSelectConversation = async (conversationId) => {
    setSelectedConversationId(conversationId);
    await loadSelectedConversation(conversationId);
    await messageService.markConversationAsRead(conversationId);
    await loadConversations(); // Refresh to update unread count
    await loadUnreadCount();
  };

  const handleArchive = async (conversationId) => {
    try {
      await messageService.archiveConversation(conversationId);
      await loadConversations();
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error archiving conversation:", error);
      alert("Không thể lưu trữ cuộc trò chuyện");
    }
  };

  const handleUnarchive = async (conversationId) => {
    try {
      await messageService.unarchiveConversation(conversationId);
      await loadConversations();
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
      alert("Không thể bỏ lưu trữ cuộc trò chuyện");
    }
  };

  const handleDelete = async (conversationId) => {
    if (!window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;

    try {
      await messageService.deleteConversation(conversationId);
      await loadConversations();
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Không thể xóa cuộc trò chuyện");
    }
  };

  const handleMessageSent = async (message) => {
    // Refresh conversations to update last message
    await loadConversations();
    if (selectedConversationId) {
      await loadSelectedConversation(selectedConversationId);
    }
  };

  const handleMessageDeleted = async () => {
    // Refresh conversations
    await loadConversations();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Đang tải tin nhắn...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.messagesPage}>
        <div
          className={`${styles.sidebar} ${
            selectedConversationId ? styles.hideOnMobile : ""
          }`}
        >
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                !showArchived ? styles.tabActive : ""
              }`}
              onClick={() => {
                setShowArchived(false);
                setSelectedConversationId(null);
                setSelectedConversation(null);
              }}
            >
              <FaInbox />
              <span>Hộp thư đến</span>
              {!showArchived && unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${
                showArchived ? styles.tabActive : ""
              }`}
              onClick={() => {
                setShowArchived(true);
                setSelectedConversationId(null);
                setSelectedConversation(null);
              }}
            >
              <FaArchive />
              <span>Đã lưu trữ</span>
            </button>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
            showArchived={showArchived}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={false}
          />
        </div>

        <div
          className={`${styles.chatArea} ${
            selectedConversationId ? styles.fullScreenOnMobile : ""
          }`}
        >
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={user?.id || user?.sub}
            onMessageSent={handleMessageSent}
            onMessageDeleted={handleMessageDeleted}
            onBackClick={() => {
              setSelectedConversationId(null);
              setSelectedConversation(null);
            }}
            loading={false}
          />
        </div>
      </div>
    </MainLayout>
  );
}

export default MessagesPage;
