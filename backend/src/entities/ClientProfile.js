import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { VerificationStatus } from "./InterpreterProfile.js";

export const CompanyType = {
  STARTUP: "startup",
  CORPORATION: "corporation",
  NONPROFIT: "nonprofit",
  GOVERNMENT: "government",
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  OTHER: "other",
};

export const CompanySize = {
  SIZE_1_10: "size_1_10",
  SIZE_11_50: "size_11_50",
  SIZE_51_200: "size_51_200",
  SIZE_201_500: "size_201_500",
  SIZE_501_1000: "size_501_1000",
  SIZE_1000_PLUS: "size_1000_plus",
};

export const PaymentMethod = {
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  PAYPAL: "paypal",
  INVOICE: "invoice",
};

export const AccountStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  PENDING_APPROVAL: "pending_approval",
};

export const SubscriptionPlanType = {
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

export class ClientProfile {
  id;
  userId;
  companyName;
  companyType;
  companySize;
  website;
  industry;
  description;
  logo;
  headquarters;
  foundedYear;
  licenseNumber;
  taxId;
  businessLicense;
  licenseVerificationStatus;
  billingAddress;
  paymentMethod;
  preferredLanguages;
  budget;
  rating;
  totalReviews;
  totalJobsPosted;
  totalJobsCompleted;
  verificationStatus;
  accountStatus;
  subscriptionPlan;
  subscriptionExpiry;
  user;
}

export const ClientProfileSchema = new EntitySchema({
  name: "ClientProfile",
  tableName: "client_profiles",
  target: ClientProfile,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    userId: {
      type: "int",
      unsigned: true,
      unique: true,
    },
    companyName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    companyType: {
      type: "enum",
      enum: Object.values(CompanyType),
    },
    companySize: {
      type: "enum",
      enum: Object.values(CompanySize),
      nullable: true,
    },
    website: {
      type: "text",
      nullable: true,
    },
    industry: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    description: {
      type: "text",
      nullable: true,
    },
    logo: {
      type: "text",
      nullable: true,
    },
    headquarters: {
      type: "text",
      nullable: true,
    },
    foundedYear: {
      type: "int",
      nullable: true,
    },
    licenseNumber: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    taxId: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    businessLicense: {
      type: "text",
      nullable: true,
    },
    licenseVerificationStatus: {
      type: "enum",
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    billingAddress: {
      type: "text",
      nullable: true,
    },
    paymentMethod: {
      type: "enum",
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CREDIT_CARD,
    },
    preferredLanguages: {
      type: "json",
      nullable: true,
    },
    budget: {
      type: "json",
      nullable: true,
    },
    rating: {
      type: "decimal",
      precision: 2,
      scale: 1,
      default: 0.0,
    },
    totalReviews: {
      type: "int",
      default: 0,
    },
    totalJobsPosted: {
      type: "int",
      default: 0,
    },
    totalJobsCompleted: {
      type: "int",
      default: 0,
    },
    verificationStatus: {
      type: "enum",
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    accountStatus: {
      type: "enum",
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING_APPROVAL,
    },
    subscriptionPlan: {
      type: "enum",
      enum: Object.values(SubscriptionPlanType),
      default: SubscriptionPlanType.BASIC,
    },
    subscriptionExpiry: {
      type: "datetime",
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_client_profiles_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_client_profiles_companyName",
      columns: ["companyName"],
    },
    {
      name: "IDX_client_profiles_companyType",
      columns: ["companyType"],
    },
    {
      name: "IDX_client_profiles_verificationStatus",
      columns: ["verificationStatus"],
    },
    {
      name: "IDX_client_profiles_accountStatus",
      columns: ["accountStatus"],
    },
  ],
  relations: {
    user: {
      type: "one-to-one",
      target: () => User,
      inverseSide: "clientProfile",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
  },
});
