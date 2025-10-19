import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class SavedJob extends Model {}

SavedJob.init(
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    jobId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "jobs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    savedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Date when job was saved",
    },
  },
  {
    sequelize,
    modelName: "SavedJob",
    tableName: "saved_jobs",
    timestamps: false,
    indexes: [
      { fields: ["userId"] },
      { fields: ["jobId"] },
      { fields: ["savedDate"] },
    ],
  }
);

export default SavedJob;
