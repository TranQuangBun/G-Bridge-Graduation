import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { JobApplication } from "./JobApplication.js";

export class Review {
  id;
  jobApplicationId;
  reviewerId; // User who wrote the review
  revieweeId; // User being reviewed
  rating; // 1-5
  comment;
  createdAt;
  updatedAt;
  reviewer;
  reviewee;
  jobApplication;
}

export const ReviewSchema = new EntitySchema({
  name: "Review",
  tableName: "reviews",
  target: Review,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    jobApplicationId: {
      type: "int",
      unsigned: true,
      nullable: true, // Allow nullable for reviews not tied to a specific job
    },
    reviewerId: {
      type: "int",
      unsigned: true,
    },
    revieweeId: {
      type: "int",
      unsigned: true,
    },
    rating: {
      type: "int",
      unsigned: true,
    },
    comment: {
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
  indices: [
    {
      name: "IDX_reviews_reviewerId",
      columns: ["reviewerId"],
    },
    {
      name: "IDX_reviews_revieweeId",
      columns: ["revieweeId"],
    },
    {
      name: "IDX_reviews_jobApplicationId",
      columns: ["jobApplicationId"],
    },
    {
      name: "UQ_reviews_jobApplicationId_reviewerId",
      unique: true,
      columns: ["jobApplicationId", "reviewerId"],
    },
  ],
  relations: {
    reviewer: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "reviewerId",
      },
      onDelete: "CASCADE",
    },
    reviewee: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "revieweeId",
      },
      onDelete: "CASCADE",
    },
    jobApplication: {
      type: "many-to-one",
      target: () => JobApplication,
      joinColumn: {
        name: "jobApplicationId",
      },
      onDelete: "CASCADE",
    },
  },
});

