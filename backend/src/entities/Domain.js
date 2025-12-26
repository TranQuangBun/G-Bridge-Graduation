import { EntitySchema } from "typeorm";
import { JobDomain } from "./JobDomain.js";

export class Domain {
  id;
  name;
  nameVi;
  description;
  createdAt;
  updatedAt;
  jobs;
}

export const DomainSchema = new EntitySchema({
  name: "Domain",
  tableName: "domains",
  target: Domain,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    nameVi: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    description: {
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
      name: "IDX_domains_name",
      unique: true,
      columns: ["name"],
    },
  ],
  relations: {
    jobs: {
      type: "one-to-many",
      target: () => JobDomain,
      inverseSide: "domain",
    },
  },
});
