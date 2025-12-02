import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { Message } from "./Message.js";

export class Conversation {
  id;
  participant1Id;
  participant2Id;
  lastMessageId;
  lastMessageAt;
  participant1UnreadCount;
  participant2UnreadCount;
  participant1Archived;
  participant2Archived;
  participant1Deleted;
  participant2Deleted;
  createdAt;
  updatedAt;
  participant1;
  participant2;
  lastMessage;
  messages;
}

export const ConversationSchema = new EntitySchema({
  name: "Conversation",
  tableName: "conversations",
  target: Conversation,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    participant1Id: {
      type: "int",
      unsigned: true,
    },
    participant2Id: {
      type: "int",
      unsigned: true,
    },
    lastMessageId: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    lastMessageAt: {
      type: "datetime",
      nullable: true,
    },
    participant1UnreadCount: {
      type: "int",
      unsigned: true,
      default: 0,
    },
    participant2UnreadCount: {
      type: "int",
      unsigned: true,
      default: 0,
    },
    participant1Archived: {
      type: "boolean",
      default: false,
    },
    participant2Archived: {
      type: "boolean",
      default: false,
    },
    participant1Deleted: {
      type: "boolean",
      default: false,
    },
    participant2Deleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
  indices: [
    {
      name: "IDX_conversations_participant1",
      columns: ["participant1Id"],
    },
    {
      name: "IDX_conversations_participant2",
      columns: ["participant2Id"],
    },
    {
      name: "IDX_conversations_lastMessageAt",
      columns: ["lastMessageAt"],
    },
    {
      name: "UQ_conversations_participants",
      unique: true,
      columns: ["participant1Id", "participant2Id"],
    },
  ],
  relations: {
    participant1: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "participant1Id",
      },
      onDelete: "CASCADE",
    },
    participant2: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "participant2Id",
      },
      onDelete: "CASCADE",
    },
    lastMessage: {
      type: "many-to-one",
      target: () => Message,
      joinColumn: {
        name: "lastMessageId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    messages: {
      type: "one-to-many",
      target: () => Message,
      inverseSide: "conversation",
      cascade: true,
    },
  },
});

