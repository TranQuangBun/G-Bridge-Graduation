import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class Level extends Model {}

Level.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Level name (e.g., A1, A2, B1, B2, C1, C2, Native)",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Order for sorting levels",
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
    modelName: "Level",
    tableName: "levels",
    timestamps: true,
    indexes: [{ unique: true, fields: ["name"] }, { fields: ["order"] }],
  }
);

export default Level;
