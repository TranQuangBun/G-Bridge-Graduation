import { BaseRepository } from "./BaseRepository.js";
import { Organization } from "../entities/Organization.js";
import { Like } from "typeorm";

export class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  async searchOrganizations(
    search,
    province,
    isActive,
    page = 1,
    limit = 20,
    ownerUserId = "",
    approvalStatus = ""
  ) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.repository.createQueryBuilder("organization");

    let hasWhere = false;

    if (search) {
      queryBuilder.where(
        "(organization.name LIKE :search OR organization.description LIKE :search)",
        { search: `%${search}%` }
      );
      hasWhere = true;
    }

    if (province) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("organization.province = :province", {
        province,
      });
      hasWhere = true;
    }

    if (isActive !== undefined && isActive !== "") {
      const isActiveValue = isActive === "true" || isActive === true;
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("organization.isActive = :isActive", {
        isActive: isActiveValue,
      });
      hasWhere = true;
    }

    // If approvalStatus is explicitly provided, filter by it
    if (approvalStatus) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("organization.approvalStatus = :approvalStatus", {
        approvalStatus,
      });
      hasWhere = true;
    }
    // If ownerUserId is provided, show all statuses for that owner
    else if (ownerUserId) {
      // Don't filter by approvalStatus - user can see all their organizations
    }
    // If neither ownerUserId nor approvalStatus is provided, only show approved (public view)
    else {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("organization.approvalStatus = :approvalStatus", {
        approvalStatus: "approved",
      });
      hasWhere = true;
    }

    if (ownerUserId) {
      const ownerId = parseInt(ownerUserId);
      if (Number.isInteger(ownerId)) {
        const condition = hasWhere ? "andWhere" : "where";
        queryBuilder[condition]("organization.ownerUserId = :ownerUserId", {
          ownerUserId: ownerId,
        });
        hasWhere = true;
      }
    }

    queryBuilder
      .orderBy("organization.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    return await queryBuilder.getManyAndCount();
  }
}
