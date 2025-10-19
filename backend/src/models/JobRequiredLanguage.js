import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class JobRequiredLanguage extends Model {}

JobRequiredLanguage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    languageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "languages",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    levelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "levels",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    isSourceLanguage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether this is the source language",
    },
  },
  {
    sequelize,
    modelName: "JobRequiredLanguage",
    tableName: "job_required_languages",
    timestamps: false,
    indexes: [
      { fields: ["jobId"] },
      { fields: ["languageId"] },
      { fields: ["levelId"] },
      { unique: true, fields: ["jobId", "languageId"] },
    ],
  }
);

export default JobRequiredLanguage;
