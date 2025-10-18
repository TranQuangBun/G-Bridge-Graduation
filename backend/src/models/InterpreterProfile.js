import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class InterpreterProfile extends Model {}

InterpreterProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "Array of languages with proficiency levels",
    },
    specializations: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of specialization areas",
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Years of experience",
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },
    availability: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Weekly availability schedule",
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of certifications",
    },
    portfolio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Portfolio description",
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 5.0,
      },
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    completedJobs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM("pending", "verified", "rejected"),
      defaultValue: "pending",
    },
    profileCompleteness: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Profile completion percentage",
    },
  },
  {
    sequelize,
    modelName: "InterpreterProfile",
    tableName: "interpreter_profiles",
    indexes: [
      { fields: ["userId"] },
      { fields: ["rating"] },
      { fields: ["hourlyRate"] },
      { fields: ["isAvailable"] },
    ],
  }
);

export default InterpreterProfile;
