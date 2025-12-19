import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./SystemNotificationsPage.module.css";

const SystemNotificationsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipientIds: "",
    sendToAll: true,
  });
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Convert editor state to HTML
    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    
    // Check if message has content (strip HTML tags)
    const messageText = htmlContent.replace(/<[^>]*>/g, "").trim();
    if (!messageText) {
      alert("Vui lòng nhập nội dung thông báo");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        message: htmlContent, // Send HTML content
        ...(formData.sendToAll
          ? {}
          : {
              recipientIds: formData.recipientIds
                .split(",")
                .map((id) => parseInt(id.trim()))
                .filter((id) => !isNaN(id)),
            }),
      };

      const response = await adminService.createSystemNotification(payload);
      if (response.success) {
        setSuccess(true);
        setFormData({
          title: "",
          message: "",
          recipientIds: "",
          sendToAll: true,
        });
        setEditorState(EditorState.createEmpty());
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error creating system notification:", error);
      alert(error.message || "Không thể tạo thông báo hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Tạo thông báo hệ thống</h1>
          <p>Gửi thông báo đến người dùng</p>
        </div>

        {success && (
          <div className={styles.successMessage}>
            Thông báo đã được gửi thành công!
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Tiêu đề *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Nhập tiêu đề thông báo"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Nội dung *</label>
            <div className={styles.editorWrapper}>
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                placeholder="Nhập nội dung thông báo (có thể sử dụng định dạng: in đậm, in nghiêng, gạch chân, ...)"
                toolbar={{
                  options: [
                    "inline",
                    "blockType",
                    "fontSize",
                    "fontFamily",
                    "list",
                    "textAlign",
                    "colorPicker",
                    "link",
                    "emoji",
                    "image",
                    "remove",
                    "history",
                  ],
                  inline: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ["bold", "italic", "underline", "strikethrough", "monospace"],
                  },
                  blockType: {
                    inDropdown: true,
                    options: ["Normal", "H1", "H2", "H3", "H4", "H5", "H6", "Blockquote"],
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                  },
                  fontSize: {
                    options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                  },
                  list: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ["unordered", "ordered", "indent", "outdent"],
                  },
                  textAlign: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ["left", "center", "right", "justify"],
                  },
                  colorPicker: {
                    className: undefined,
                    component: undefined,
                    popupClassName: undefined,
                    colors: [
                      "rgb(97,189,109)",
                      "rgb(26,188,156)",
                      "rgb(84,172,210)",
                      "rgb(44,130,201)",
                      "rgb(147,101,184)",
                      "rgb(71,85,119)",
                      "rgb(204,204,204)",
                      "rgb(65,168,95)",
                      "rgb(0,168,133)",
                      "rgb(61,142,185)",
                      "rgb(41,105,176)",
                      "rgb(85,57,130)",
                      "rgb(40,50,78)",
                      "rgb(0,0,0)",
                      "rgb(247,218,100)",
                      "rgb(251,160,38)",
                      "rgb(235,107,86)",
                      "rgb(226,80,65)",
                      "rgb(163,143,132)",
                      "rgb(239,239,239)",
                      "rgb(255,255,255)",
                      "rgb(250,197,28)",
                      "rgb(243,121,52)",
                      "rgb(209,72,65)",
                      "rgb(184,49,47)",
                      "rgb(124,112,107)",
                      "rgb(209,213,216)",
                    ],
                  },
                }}
                editorClassName={styles.editor}
              />
            </div>
            <small className={styles.helpText}>
              Bạn có thể sử dụng các công cụ định dạng ở trên để tạo nội dung phong phú
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.sendToAll}
                onChange={(e) =>
                  setFormData({ ...formData, sendToAll: e.target.checked })
                }
              />
              <span>Gửi đến tất cả người dùng</span>
            </label>
          </div>

          {!formData.sendToAll && (
            <div className={styles.formGroup}>
              <label htmlFor="recipientIds">
                ID người nhận (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                id="recipientIds"
                value={formData.recipientIds}
                onChange={(e) =>
                  setFormData({ ...formData, recipientIds: e.target.value })
                }
                placeholder="Ví dụ: 1, 2, 3"
              />
              <small className={styles.helpText}>
                Nhập ID của người dùng, phân cách bằng dấu phẩy
              </small>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate("/admin/dashboard")}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !formData.title || !draftToHtml(convertToRaw(editorState.getCurrentContent())).replace(/<[^>]*>/g, "").trim()}
            >
              {loading ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SystemNotificationsPage;

