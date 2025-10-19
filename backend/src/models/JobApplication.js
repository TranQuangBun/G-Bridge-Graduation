import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class JobApplication extends Model {}

JobApplication.init(
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
    interpreterId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "withdrawn"),
      allowNull: false,
      defaultValue: "pending",
      comment: "Application status",
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Cover letter content",
    },
    resumeUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Resume file URL",
    },
    resumeType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Resume file type (pdf, docx, etc.)",
    },
    applicationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Date of application submission",
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date when application was reviewed",
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notes from reviewer",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "JobApplication",
    tableName: "job_applications",
    timestamps: true,
    indexes: [
      { fields: ["jobId"] },
      { fields: ["interpreterId"] },
      { fields: ["status"] },
      { fields: ["applicationDate"] },
      { unique: true, fields: ["jobId", "interpreterId"] },
    ],
  }
);

export default JobApplication;
