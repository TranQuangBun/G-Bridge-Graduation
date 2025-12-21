import { ConversationRepository } from "../repositories/ConversationRepository.js";
import { MessageRepository } from "../repositories/MessageRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { Conversation } from "../entities/Conversation.js";
import { Message } from "../entities/Message.js";
import { JobApplication } from "../entities/JobApplication.js";
import { ApplicationStatusEnum } from "../entities/JobApplication.js";

export class ConversationService {
  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.messageRepository = new MessageRepository();
    this.userRepository = AppDataSource.getRepository(User);
    this.jobApplicationRepository = AppDataSource.getRepository(JobApplication);
  }

  async checkApprovedApplication(userId1, userId2) {
    // Check if there's an approved application between these two users
    // One must be client (employer) and one must be interpreter
    const user1 = await this.userRepository.findOne({
      where: { id: parseInt(userId1) },
    });
    const user2 = await this.userRepository.findOne({
      where: { id: parseInt(userId2) },
    });

    if (!user1 || !user2) {
      return false;
    }

    // Determine which is client and which is interpreter
    let clientId, interpreterId;
    if (user1.role === "client" && user2.role === "interpreter") {
      clientId = parseInt(userId1);
      interpreterId = parseInt(userId2);
    } else if (user1.role === "interpreter" && user2.role === "client") {
      clientId = parseInt(userId2);
      interpreterId = parseInt(userId1);
    } else {
      // If not client-interpreter pair, allow conversation (for admin or same role)
      return true;
    }

    // Check if there's an approved application
    const approvedApplication = await this.jobApplicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.job", "job")
      .leftJoinAndSelect("job.organization", "organization")
      .where("application.interpreterId = :interpreterId", { interpreterId })
      .andWhere("application.status = :status", {
        status: ApplicationStatusEnum.APPROVED,
      })
      .andWhere("organization.ownerUserId = :clientId", { clientId })
      .getOne();

    return !!approvedApplication;
  }

  async getOrCreateConversation(userId1, userId2, skipApprovalCheck = false) {
    // Check if conversation already exists
    let conversation = await this.conversationRepository.findByParticipants(
      userId1,
      userId2
    );

    if (!conversation) {
      // Check if there's an approved application (unless skipApprovalCheck is true)
      if (!skipApprovalCheck) {
        const hasApprovedApplication = await this.checkApprovedApplication(
          userId1,
          userId2
        );
        if (!hasApprovedApplication) {
          throw new Error(
            "Cannot create conversation. You can only chat after the employer has approved your application."
          );
        }
      }

      // Ensure userId1 < userId2 for consistency
      const [p1, p2] =
        userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

      // Verify both users exist
      const user1 = await this.userRepository.findOne({
        where: { id: parseInt(p1) },
      });
      const user2 = await this.userRepository.findOne({
        where: { id: parseInt(p2) },
      });

      if (!user1 || !user2) {
        throw new Error("One or both users not found");
      }

      conversation = await this.conversationRepository.create({
        participant1Id: parseInt(p1),
        participant2Id: parseInt(p2),
        participant1UnreadCount: 0,
        participant2UnreadCount: 0,
        participant1Archived: false,
        participant2Archived: false,
        participant1Deleted: false,
        participant2Deleted: false,
      });
    }

    return await this.conversationRepository.findByIdWithParticipants(
      conversation.id
    );
  }

  async getOrCreateConversationFromApplication(applicationId, userId) {
    // Get the application
    const application = await this.jobApplicationRepository.findOne({
      where: { id: parseInt(applicationId) },
      relations: ["job", "job.organization", "interpreter"],
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // Verify application is approved
    if (application.status !== ApplicationStatusEnum.APPROVED) {
      throw new Error(
        "Application must be approved before starting a conversation"
      );
    }

    // Determine the other participant
    const clientId = application.job?.organization?.ownerUserId;
    const interpreterId = application.interpreterId;

    if (!clientId || !interpreterId) {
      throw new Error("Invalid application data");
    }

    // Verify user is one of the participants
    const parsedUserId = parseInt(userId);
    if (parsedUserId !== clientId && parsedUserId !== interpreterId) {
      throw new Error("You are not authorized to create this conversation");
    }

    // Create or get conversation (skip approval check since we already verified)
    return await this.getOrCreateConversation(clientId, interpreterId, true);
  }

  async getUserConversations(
    userId,
    includeArchived = false,
    includeDeleted = false
  ) {
    return await this.conversationRepository.findByParticipant(
      userId,
      includeArchived,
      includeDeleted
    );
  }

  async getConversationById(conversationId, userId) {
    const conversation =
      await this.conversationRepository.findByIdWithParticipants(
        conversationId
      );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is a participant
    if (
      conversation.participant1Id !== parseInt(userId) &&
      conversation.participant2Id !== parseInt(userId)
    ) {
      throw new Error(
        "Unauthorized: You are not a participant in this conversation"
      );
    }

    // Find related job application (if exists)
    // Query: find application where one participant is interpreter and other is client
    const jobAppRepository = AppDataSource.getRepository(JobApplication);

    // Get the other participant ID
    const otherUserId =
      conversation.participant1Id === parseInt(userId)
        ? conversation.participant2Id
        : conversation.participant1Id;

    // Try to find job application where current user is interpreter and other is client
    let application = await jobAppRepository
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.job", "job")
      .leftJoinAndSelect("job.organization", "organization")
      .where(
        "app.interpreterId = :interpreterId AND organization.ownerUserId = :clientId",
        {
          interpreterId: userId,
          clientId: otherUserId,
        }
      )
      .andWhere("app.status = :status", { status: "approved" })
      .orderBy("app.createdAt", "DESC")
      .getOne();

    // If not found, try reverse (other is interpreter, current user is client)
    if (!application) {
      application = await jobAppRepository
        .createQueryBuilder("app")
        .leftJoinAndSelect("app.job", "job")
        .leftJoinAndSelect("job.organization", "organization")
        .where(
          "app.interpreterId = :interpreterId AND organization.ownerUserId = :clientId",
          {
            interpreterId: otherUserId,
            clientId: userId,
          }
        )
        .andWhere("app.status = :status", { status: "approved" })
        .orderBy("app.createdAt", "DESC")
        .getOne();
    }

    // Attach application to conversation object
    if (application) {
      conversation.application = application;
    }

    return conversation;
  }

  async archiveConversation(conversationId, userId) {
    console.log(
      "archiveConversation - conversationId:",
      conversationId,
      "userId:",
      userId
    );
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    console.log("archiveConversation - before archive:", {
      participant1Id: conversation.participant1Id,
      participant2Id: conversation.participant2Id,
      participant1Archived: conversation.participant1Archived,
      participant2Archived: conversation.participant2Archived,
    });

    if (conversation.participant1Id === parseInt(userId)) {
      conversation.participant1Archived = true;
      console.log("archiveConversation - setting participant1Archived = true");
    } else if (conversation.participant2Id === parseInt(userId)) {
      conversation.participant2Archived = true;
      console.log("archiveConversation - setting participant2Archived = true");
    } else {
      throw new Error("Unauthorized");
    }

    const result = await this.conversationRepository.repository.save(
      conversation
    );
    console.log("archiveConversation - after save:", {
      participant1Archived: result.participant1Archived,
      participant2Archived: result.participant2Archived,
    });
    return result;
  }

  async unarchiveConversation(conversationId, userId) {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.participant1Id === parseInt(userId)) {
      conversation.participant1Archived = false;
    } else if (conversation.participant2Id === parseInt(userId)) {
      conversation.participant2Archived = false;
    } else {
      throw new Error("Unauthorized");
    }

    return await this.conversationRepository.repository.save(conversation);
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.participant1Id === parseInt(userId)) {
      conversation.participant1Deleted = true;
    } else if (conversation.participant2Id === parseInt(userId)) {
      conversation.participant2Deleted = true;
    } else {
      throw new Error("Unauthorized");
    }

    return await this.conversationRepository.repository.save(conversation);
  }

  async getUnreadCount(userId) {
    return await this.conversationRepository.getUnreadCount(userId);
  }

  async markConversationAsRead(conversationId, userId) {
    const conversation = await this.conversationRepository.findById(
      conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Mark messages as read
    await this.messageRepository.markAsRead(conversationId, userId);

    // Reset unread count
    if (conversation.participant1Id === parseInt(userId)) {
      conversation.participant1UnreadCount = 0;
    } else if (conversation.participant2Id === parseInt(userId)) {
      conversation.participant2UnreadCount = 0;
    }

    return await this.conversationRepository.repository.save(conversation);
  }
}
