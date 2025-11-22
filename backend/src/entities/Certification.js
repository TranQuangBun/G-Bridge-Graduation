import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { JobRequiredCertificate } from "./JobRequiredCertificate.js";

export const CertificationStatus = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export class Certification {
  id;
  userId;
  name;
  issuingOrganization;
  issueDate;
  expiryDate;
  credentialId;
  credentialUrl;
  score;
  imageUrl;
  description;
  verificationStatus;
  isVerified;
  isActive;
  createdAt;
  updatedAt;
  user;
  jobRequirements;
}

export const CertificationSchema = new EntitySchema({
  name: "Certification",
  tableName: "certifications",
  target: Certification,
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
    },
    name: {
      type: "varchar",
      length: 200,
    },
    issuingOrganization: {
      type: "varchar",
      length: 200,
      nullable: true,
    },
    issueDate: {
      type: "date",
      nullable: true,
    },
    expiryDate: {
      type: "date",
      nullable: true,
    },
    credentialId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    credentialUrl: {
      type: "text",
      nullable: true,
    },
    score: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    imageUrl: {
      type: "text",
      nullable: true,
    },
    description: {
      type: "text",
      nullable: true,
    },
    verificationStatus: {
      type: "enum",
      enum: Object.values(CertificationStatus),
      default: CertificationStatus.DRAFT,
    },
    isVerified: {
      type: "boolean",
      default: false,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
  indices: [
    {
      name: "IDX_certifications_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_certifications_name",
      columns: ["name"],
    },
    {
      name: "IDX_certifications_isVerified",
      columns: ["isVerified"],
    },
    {
      name: "IDX_certifications_verificationStatus",
      columns: ["verificationStatus"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "certifications",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    jobRequirements: {
      type: "one-to-many",
      target: () => JobRequiredCertificate,
      inverseSide: "certificate",
    },
  },
});
