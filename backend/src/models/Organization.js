import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Organization name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Organization description",
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Organization logo URL",
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Organization website",
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: "Organization",
    tableName: "organizations",
    timestamps: true,
  }
);

export default Organization;
