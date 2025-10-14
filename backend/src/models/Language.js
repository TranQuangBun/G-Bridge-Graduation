import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Language = sequelize.define(
  "Language",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Language name (e.g., English, Vietnamese, Japanese)",
    },
    proficiencyLevel: {
      type: DataTypes.ENUM(
        "Beginner",
        "Intermediate",
        "Advanced",
        "Native",
        "Professional"
      ),
      allowNull: false,
      defaultValue: "Intermediate",
      comment: "Proficiency level of the language",
    },
    canSpeak: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Can speak this language",
    },
    canWrite: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Can write in this language",
    },
    canRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Can read this language",
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Years of experience with this language",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Is this language skill still active",
    },
  },
  {
    tableName: "languages",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["name"],
      },
    ],
  }
);

export default Language;
