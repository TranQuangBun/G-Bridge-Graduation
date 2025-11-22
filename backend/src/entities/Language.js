import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { JobRequiredLanguage } from "./JobRequiredLanguage.js";

export const ProficiencyLevel = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  NATIVE: "Native",
  PROFESSIONAL: "Professional",
};

export class Language {
  id;
  userId;
  name;
  proficiencyLevel;
  canSpeak;
  canWrite;
  canRead;
  yearsOfExperience;
  isActive;
  createdAt;
  updatedAt;
  user;
  jobRequirements;
}

export const LanguageSchema = new EntitySchema({
  name: "Language",
  tableName: "languages",
  target: Language,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    userId: {
      type: "int",
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 100,
    },
    proficiencyLevel: {
      type: "enum",
      enum: Object.values(ProficiencyLevel),
      default: ProficiencyLevel.INTERMEDIATE,
    },
    canSpeak: {
      type: "boolean",
      default: true,
    },
    canWrite: {
      type: "boolean",
      default: true,
    },
    canRead: {
      type: "boolean",
      default: true,
    },
    yearsOfExperience: {
      type: "int",
      default: 0,
    },
    isActive: {
      type: "boolean",
      default: true,
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
      name: "IDX_languages_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_languages_name",
      columns: ["name"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "languages",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    jobRequirements: {
      type: "one-to-many",
      target: () => JobRequiredLanguage,
      inverseSide: "language",
    },
  },
});
