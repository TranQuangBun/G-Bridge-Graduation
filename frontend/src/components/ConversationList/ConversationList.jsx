import React from "react";
import styles from "./ConversationList.module.css";
import { FaUser, FaArchive, FaTrash, FaSearch } from "react-icons/fa";

function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onArchive,
  onDelete,
  onUnarchive,
  showArchived = false,
  searchQuery = "",
  onSearchChange,
  loading = false,
}) {
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
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

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.otherParticipant.fullName?.toLowerCase().includes(searchLower) ||
      conv.otherParticipant.email?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

  console.log("ConversationList - conversations:", conversations);
  console.log(
    "ConversationList - filteredConversations:",
    filteredConversations
  );
  console.log("ConversationList - searchQuery:", searchQuery);

  if (loading) {
    return (
      <div className={styles.conversationList}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.conversationList}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tin nhắn</h2>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.conversations}>
        {filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUser className={styles.emptyIcon} />
            <p>
              {searchQuery
                ? "Không tìm thấy cuộc trò chuyện nào"
                : showArchived
                ? "Không có cuộc trò chuyện nào đã lưu trữ"
                : "Chưa có cuộc trò chuyện nào"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`${styles.conversationItem} ${
                selectedConversationId === conversation.id
                  ? styles.conversationItemActive
                  : ""
              } ${conversation.unreadCount > 0 ? styles.hasUnread : ""}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className={styles.avatar}>
                {conversation.otherParticipant.avatar ? (
                  <img
                    src={conversation.otherParticipant.avatar}
                    alt={conversation.otherParticipant.fullName}
                  />
                ) : (
                  <span className={styles.avatarInitials}>
                    {getInitials(conversation.otherParticipant.fullName)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </span>
                )}
              </div>

              <div className={styles.conversationInfo}>
                <div className={styles.conversationHeader}>
                  <h3 className={styles.participantName}>
                    {conversation.otherParticipant.fullName ||
                      conversation.otherParticipant.email ||
                      "Người dùng"}
                  </h3>
                  {conversation.lastMessageAt && (
                    <span className={styles.time}>
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>

                <div className={styles.conversationPreview}>
                  {conversation.lastMessage ? (
                    <p className={styles.lastMessage}>
                      {conversation.lastMessage.senderId ===
                      conversation.otherParticipant.id
                        ? ""
                        : "Bạn: "}
                      {conversation.lastMessage.content}
                    </p>
                  ) : (
                    <p className={styles.noMessage}>Chưa có tin nhắn</p>
                  )}
                </div>
              </div>

              <div className={styles.conversationActions}>
                {showArchived ? (
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnarchive(conversation.id);
                    }}
                    title="Bỏ lưu trữ"
                  >
                    <FaArchive />
                  </button>
                ) : (
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(conversation.id);
                    }}
                    title="Lưu trữ"
                  >
                    <FaArchive />
                  </button>
                )}
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conversation.id);
                  }}
                  title="Xóa"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;
