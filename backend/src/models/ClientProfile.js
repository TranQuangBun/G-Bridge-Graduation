import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class ClientProfile extends Model {}

ClientProfile.init(
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
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    companyType: {
      type: DataTypes.ENUM(
        "startup",
        "corporation",
        "nonprofit",
        "government",
        "healthcare",
        "education",
        "other"
      ),
      allowNull: false,
    },
    companySize: {
      type: DataTypes.ENUM(
        "under_10",
        "10-50",
        "51-100",
        "101-200",
        "201-500",
        "500+"
      ),
      allowNull: true,
      comment: "Company size (number of employees)",
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Main industry/business sector",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Company introduction/about us",
    },
    businessLicense: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "URL to business registration certificate image",
    },
    businessLicenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Business registration certificate number",
    },
    businessLicenseVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether business license has been verified by admin",
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    headquarters: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    foundedYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1800,
        max: new Date().getFullYear(),
      },
    },
    licenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    taxId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM("credit_card", "bank_transfer", "paypal", "invoice"),
      defaultValue: "credit_card",
    },
    preferredLanguages: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of frequently needed languages",
    },
    budget: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Budget range preferences",
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
    totalJobsPosted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalJobsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verificationStatus: {
      type: DataTypes.ENUM("unverified", "pending", "verified", "rejected"),
      defaultValue: "unverified",
      comment: "Document verification status by admin",
    },
    verificationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Admin notes for verification (rejection reason, etc.)",
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date when company was verified",
    },
    accountStatus: {
      type: DataTypes.ENUM("active", "suspended", "pending_approval"),
      defaultValue: "pending_approval",
    },
    subscriptionPlan: {
      type: DataTypes.ENUM("basic", "premium", "enterprise"),
      defaultValue: "basic",
    },
    subscriptionExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ClientProfile",
    tableName: "client_profiles",
    indexes: [
      { fields: ["userId"] },
      { fields: ["companyName"] },
      { fields: ["companyType"] },
      { fields: ["verificationStatus"] },
      { fields: ["accountStatus"] },
    ],
  }
);

export default ClientProfile;
