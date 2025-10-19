import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class Domain extends Model {}

Domain.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Domain name (e.g., Medical, Legal, Technical)",
    },
    nameVi: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Vietnamese name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: "Domain",
    tableName: "domains",
    timestamps: true,
  }
);

export default Domain;
