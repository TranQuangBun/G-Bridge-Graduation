import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class JobRequiredCertificate extends Model {}

JobRequiredCertificate.init(
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
    certificateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "certifications",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    minAchievementDetail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Minimum achievement required (e.g., IELTS 7.0+)",
    },
  },
  {
    sequelize,
    modelName: "JobRequiredCertificate",
    tableName: "job_required_certificates",
    timestamps: false,
    indexes: [
      { fields: ["jobId"] },
      { fields: ["certificateId"] },
      { unique: true, fields: ["jobId", "certificateId"] },
    ],
  }
);

export default JobRequiredCertificate;
