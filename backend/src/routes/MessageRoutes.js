import express from "express";
import {
  getConversations,
  getConversation,
  createOrGetConversation,
  createConversationFromApplication,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  markConversationAsRead,
  getUnreadCount,
  getMessages,
  sendMessage,
  deleteMessage,
  updateMessage,
  sendMessageWithFile,
} from "../controllers/MessageController.js";
import { authRequired } from "../middleware/auth.js";
import { uploadMessageFile } from "../middleware/Upload.js";

const router = express.Router();

// All routes require authentication
router.use(authRequired);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *         description: Include archived conversations
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: Include deleted conversations
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get("/conversations", getConversations);

/**
 * @swagger
 * /api/messages/conversations/unread-count:
 *   get:
 *     summary: Get total unread message count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */
router.get("/conversations/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/messages/conversations:
 *   post:
 *     summary: Create or get existing conversation with another user (requires approved application)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otherUserId
 *             properties:
 *               otherUserId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Conversation retrieved/created successfully
 *       201:
 *         description: Conversation created successfully
 *       403:
 *         description: Cannot create conversation - application must be approved
 */
router.post("/conversations", createOrGetConversation);

/**
 * @swagger
 * /api/messages/conversations/from-application:
 *   post:
 *     summary: Create conversation from approved job application
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *             properties:
 *               applicationId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       403:
 *         description: Application must be approved
 *       404:
 *         description: Application not found
 */
router.post(
  "/conversations/from-application",
  createConversationFromApplication
);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 */
router.get("/conversations/:conversationId", getConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   patch:
 *     summary: Mark conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.patch("/conversations/:conversationId/read", markConversationAsRead);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/archive:
 *   patch:
 *     summary: Archive conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation archived successfully
 */
router.patch("/conversations/:conversationId/archive", archiveConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/unarchive:
 *   patch:
 *     summary: Unarchive conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation unarchived successfully
 */
router.patch("/conversations/:conversationId/unarchive", unarchiveConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   delete:
 *     summary: Delete conversation (soft delete)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 */
router.delete("/conversations/:conversationId", deleteConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get("/conversations/:conversationId/messages", getMessages);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post("/conversations/:conversationId/messages", sendMessage);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages/upload:
 *   post:
 *     summary: Send a message with file attachment
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Message with file sent successfully
 */
router.post(
  "/conversations/:conversationId/messages/upload",
  uploadMessageFile.single("file"),
  sendMessageWithFile
);

/**
 * @swagger
 * /api/messages/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete("/messages/:messageId", deleteMessage);

/**
 * @swagger
 * /api/messages/messages/{messageId}:
 *   patch:
 *     summary: Update a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 */
router.patch("/messages/:messageId", updateMessage);

export default router;
