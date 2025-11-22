import { EntitySchema } from "typeorm";
import { User } from "./User.js";

export class SavedInterpreter {
  userId;
  interpreterId;
  savedDate;
  createdAt;
  updatedAt;
  user;
  interpreter;
}

export const SavedInterpreterSchema = new EntitySchema({
  name: "SavedInterpreter",
  tableName: "saved_interpreters",
  target: SavedInterpreter,
  columns: {
    userId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
    interpreterId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
    savedDate: {
      type: "datetime",
      default: () => "CURRENT_TIMESTAMP",
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
      name: "IDX_saved_interpreters_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_saved_interpreters_interpreterId",
      columns: ["interpreterId"],
    },
    {
      name: "IDX_saved_interpreters_savedDate",
      columns: ["savedDate"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "savedInterpreters",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    interpreter: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "savedByUsers",
      joinColumn: {
        name: "interpreterId",
      },
      onDelete: "CASCADE",
    },
  },
});
