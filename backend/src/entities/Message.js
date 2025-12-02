import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { Conversation } from "./Conversation.js";

export class Message {
  id;
  conversationId;
  senderId;
  content;
  isRead;
  readAt;
  createdAt;
  updatedAt;
  conversation;
  sender;
}

export const MessageSchema = new EntitySchema({
  name: "Message",
  tableName: "messages",
  target: Message,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    conversationId: {
      type: "int",
      unsigned: true,
    },
    senderId: {
      type: "int",
      unsigned: true,
    },
    content: {
      type: "text",
    },
    isRead: {
      type: "boolean",
      default: false,
    },
    readAt: {
      type: "datetime",
      nullable: true,
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
      name: "IDX_messages_conversationId",
      columns: ["conversationId"],
    },
    {
      name: "IDX_messages_senderId",
      columns: ["senderId"],
    },
    {
      name: "IDX_messages_createdAt",
      columns: ["createdAt"],
    },
    {
      name: "IDX_messages_isRead",
      columns: ["isRead"],
    },
  ],
  relations: {
    conversation: {
      type: "many-to-one",
      target: () => Conversation,
      inverseSide: "messages",
      joinColumn: {
        name: "conversationId",
      },
      onDelete: "CASCADE",
    },
    sender: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "senderId",
      },
      onDelete: "CASCADE",
    },
  },
});

