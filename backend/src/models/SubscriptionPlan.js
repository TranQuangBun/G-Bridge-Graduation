import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class SubscriptionPlan extends Model {}

SubscriptionPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Plan name: Basic, Pro, Enterprise",
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Display name in UI",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Plan description",
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Price in USD",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
      comment: "Currency code: USD, VND",
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Duration in days (30, 365)",
    },
    durationType: {
      type: DataTypes.ENUM("monthly", "yearly", "lifetime"),
      defaultValue: "monthly",
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of features included in this plan",
    },
    maxInterpreterViews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Max interpreter profiles can view per month",
    },
    maxJobPosts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Max job posts per month",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Is this plan available for purchase",
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Display order in pricing page",
    },
  },
  {
    sequelize,
    modelName: "SubscriptionPlan",
    tableName: "subscription_plans",
    timestamps: true,
    indexes: [
      { fields: ["isActive"] },
      { fields: ["sortOrder"] },
      { fields: ["name"], unique: true },
    ],
  }
);

export default SubscriptionPlan;
