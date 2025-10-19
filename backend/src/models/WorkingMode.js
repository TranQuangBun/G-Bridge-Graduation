import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class WorkingMode extends Model {}

WorkingMode.init(
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
      comment: "Working mode name (e.g., On-site, Remote, Hybrid)",
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
    modelName: "WorkingMode",
    tableName: "working_modes",
    timestamps: true,
  }
);

export default WorkingMode;
