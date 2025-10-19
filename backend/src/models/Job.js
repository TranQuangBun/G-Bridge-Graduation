import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class Job extends Model {}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "organizations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    workingModeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "working_modes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Job title",
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Province/City",
    },
    commune: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "District/Commune",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Detailed address",
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Application deadline",
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: "Number of positions",
    },
    descriptions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Job description",
    },
    responsibility: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Job responsibilities",
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Benefits and perks",
    },
    minSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Minimum salary",
    },
    maxSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Maximum salary",
    },
    salaryType: {
      type: DataTypes.ENUM("GROSS", "NET", "NEGOTIABLE"),
      allowNull: false,
      defaultValue: "NEGOTIABLE",
      comment: "Salary type",
    },
    contactEmail: {
      type: DataTypes.STRING(120),
      allowNull: true,
      validate: { isEmail: true },
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    statusOpenStop: {
      type: DataTypes.ENUM("open", "closed", "expired"),
      allowNull: false,
      defaultValue: "open",
      comment: "Job status",
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    modelName: "Job",
    tableName: "jobs",
    timestamps: true,
    indexes: [
      { fields: ["organizationId"] },
      { fields: ["workingModeId"] },
      { fields: ["statusOpenStop"] },
      { fields: ["expirationDate"] },
      { fields: ["createdDate"] },
      { fields: ["province"] },
    ],
  }
);

export default Job;
