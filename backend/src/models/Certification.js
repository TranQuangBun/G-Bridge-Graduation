import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Certification = sequelize.define(
  "Certification",
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
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Certification name (e.g., IELTS, TOEFL, JLPT N1)",
    },
    issuingOrganization: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Organization that issued the certification",
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Date when certification was issued",
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Expiry date of certification (if applicable)",
    },
    credentialId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Credential ID or certificate number",
    },
    credentialUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "URL to verify the certification",
    },
    score: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Score or grade achieved (e.g., 8.5, A+, Pass)",
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "URL to certification image/document",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional details about the certification",
    },
    verificationStatus: {
      type: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
      defaultValue: "draft",
      allowNull: false,
      comment:
        "Verification status: draft (no image), pending (awaiting admin), approved, rejected",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment:
        "Whether this certification has been verified by admin (deprecated, use verificationStatus)",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether this certification is currently active",
    },
  },
  {
    tableName: "certifications",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["name"],
      },
      {
        fields: ["isVerified"],
      },
    ],
  }
);

export default Certification;
