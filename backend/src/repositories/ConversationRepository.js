import { BaseRepository } from "./BaseRepository.js";
import { Conversation } from "../entities/Conversation.js";
import { AppDataSource } from "../config/DataSource.js";

export class ConversationRepository extends BaseRepository {
  constructor() {
    super(Conversation);
  }

  async findByParticipant(
    userId,
    includeArchived = false,
    includeDeleted = false
  ) {
    const parsedUserId = parseInt(userId);
    console.log(
      "ConversationRepository.findByParticipant - userId:",
      parsedUserId
    );
    console.log(
      "ConversationRepository.findByParticipant - includeArchived:",
      includeArchived
    );
    console.log(
      "ConversationRepository.findByParticipant - includeDeleted:",
      includeDeleted
    );

    const queryBuilder = this.repository
      .createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.participant1", "participant1")
      .leftJoinAndSelect("conversation.participant2", "participant2")
      .leftJoinAndSelect("conversation.lastMessage", "lastMessage")
      .leftJoinAndSelect("lastMessage.sender", "lastMessageSender")
      .where(
        "(conversation.participant1Id = :userId OR conversation.participant2Id = :userId)",
        { userId: parsedUserId }
      );

    // If includeArchived is false, exclude archived conversations
    if (!includeArchived) {
      queryBuilder.andWhere(
        `(
          (conversation.participant1Id = :userId AND conversation.participant1Archived = false) 
          OR 
          (conversation.participant2Id = :userId AND conversation.participant2Archived = false)
        )`,
        { userId: parsedUserId }
      );
    }
    // If includeArchived is true, include ALL conversations (both archived and non-archived)

    if (!includeDeleted) {
      queryBuilder.andWhere(
        `(
          (conversation.participant1Id = :userId AND conversation.participant1Deleted = false) 
          OR 
          (conversation.participant2Id = :userId AND conversation.participant2Deleted = false)
        )`,
        { userId: parsedUserId }
      );
    }

    console.log(
      "ConversationRepository.findByParticipant - SQL:",
      queryBuilder.getSql()
    );
    console.log(
      "ConversationRepository.findByParticipant - Parameters:",
      queryBuilder.getParameters()
    );

    const results = await queryBuilder
      .orderBy("conversation.lastMessageAt", "DESC")
      .addOrderBy("conversation.createdAt", "DESC")
      .getMany();

    console.log(
      "ConversationRepository.findByParticipant - results count:",
      results.length
    );

    return results;
  }

  async findByParticipants(userId1, userId2) {
    return await this.repository.findOne({
      where: [
        {
          participant1Id: parseInt(userId1),
          participant2Id: parseInt(userId2),
        },
        {
          participant1Id: parseInt(userId2),
          participant2Id: parseInt(userId1),
        },
      ],
      relations: [
        "participant1",
        "participant2",
        "lastMessage",
        "lastMessage.sender",
      ],
    });
  }

  async findByIdWithParticipants(id) {
    return await this.repository.findOne({
      where: { id: parseInt(id) },
      relations: [
        "participant1",
        "participant2",
        "lastMessage",
        "lastMessage.sender",
      ],
    });
  }

  async getUnreadCount(userId) {
    const conversations = await this.repository
      .createQueryBuilder("conversation")
      .where(
        "(conversation.participant1Id = :userId AND conversation.participant1UnreadCount > 0) OR (conversation.participant2Id = :userId AND conversation.participant2UnreadCount > 0)",
        { userId: parseInt(userId) }
      )
      .andWhere(
        "((conversation.participant1Id = :userId AND conversation.participant1Deleted = false) OR (conversation.participant2Id = :userId AND conversation.participant2Deleted = false))"
      )
      .getMany();

    let totalUnread = 0;
    conversations.forEach((conv) => {
      if (conv.participant1Id === parseInt(userId)) {
        totalUnread += conv.participant1UnreadCount || 0;
      } else {
        totalUnread += conv.participant2UnreadCount || 0;
      }
    });

    return totalUnread;
  }
}
