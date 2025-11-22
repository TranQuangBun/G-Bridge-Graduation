import { EntitySchema } from "typeorm";
import { JobRequiredLanguage } from "./JobRequiredLanguage.js";

export class Level {
  id;
  name;
  description;
  order;
  createdAt;
  updatedAt;
  jobRequirements;
}

export const LevelSchema = new EntitySchema({
  name: "Level",
  tableName: "levels",
  target: Level,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 50,
      unique: true,
    },
    description: {
      type: "text",
      nullable: true,
    },
    order: {
      type: "int",
      default: 0,
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
      name: "IDX_levels_name",
      unique: true,
      columns: ["name"],
    },
    {
      name: "IDX_levels_order",
      columns: ["order"],
    },
  ],
  relations: {
    jobRequirements: {
      type: "one-to-many",
      target: () => JobRequiredLanguage,
      inverseSide: "level",
    },
  },
});
