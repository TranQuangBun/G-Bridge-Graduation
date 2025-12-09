import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { User } from "./User.js";

export const OrganizationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export class Organization {
  id;
  ownerUserId;
  name;
  description;
  logo;
  website;
  email;
  phone;
  address;
  province;
  isActive;
  approvalStatus;
  rejectionReason;
  createdAt;
  updatedAt;
  jobs;
  owner;
}

export const OrganizationSchema = new EntitySchema({
  name: "Organization",
  tableName: "organizations",
  target: Organization,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    ownerUserId: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    name: {
      type: "varchar",
      length: 200,
    },
    description: {
      type: "text",
      nullable: true,
    },
    logo: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    website: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    email: {
      type: "varchar",
      length: 120,
      nullable: true,
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    address: {
      type: "text",
      nullable: true,
    },
    province: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    approvalStatus: {
      type: "enum",
      enum: Object.values(OrganizationStatus),
      default: OrganizationStatus.PENDING,
    },
    rejectionReason: {
      type: "text",
      nullable: true,
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
  relations: {
    owner: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "organizations",
      joinColumn: {
        name: "ownerUserId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    jobs: {
      type: "one-to-many",
      target: () => Job,
      inverseSide: "organization",
      cascade: true,
    },
  },
});
