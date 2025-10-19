import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class JobHasDomain extends Model {}

JobHasDomain.init(
  {
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
    domainId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "domains",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "JobHasDomain",
    tableName: "job_has_domains",
    timestamps: false,
    indexes: [{ fields: ["jobId"] }, { fields: ["domainId"] }],
  }
);

export default JobHasDomain;
