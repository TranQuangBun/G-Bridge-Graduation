import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const SavedInterpreter = sequelize.define(
  "SavedInterpreter",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    interpreterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // Interpreters are users with role 'interpreter'
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "saved_interpreters",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "interpreterId"],
      },
    ],
  }
);

export default SavedInterpreter;
