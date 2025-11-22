import { OrganizationRepository } from "../repositories/OrganizationRepository.js";

export class OrganizationService {
  constructor() {
    this.organizationRepository = new OrganizationRepository();
  }

  async getAllOrganizations(query) {
    const {
      page = 1,
      limit = 20,
      search = "",
      province = "",
      isActive = "",
      ownerUserId = "",
    } = query;

    const [organizations, total] =
      await this.organizationRepository.searchOrganizations(
        search,
        province,
        isActive,
        parseInt(page),
        parseInt(limit),
        ownerUserId
      );

    return {
      organizations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getOrganizationById(id) {
    const organization = await this.organizationRepository.findById(
      parseInt(id)
    );
    if (!organization) {
      throw new Error("Organization not found");
    }
    return organization;
  }

  async createOrganization(data) {
    const payload = { ...data };
    if (payload.ownerUserId) {
      payload.ownerUserId = parseInt(payload.ownerUserId);
    }
    const organization = await this.organizationRepository.create(payload);
    return organization;
  }

  async updateOrganization(id, data) {
    const organization = await this.organizationRepository.findById(
      parseInt(id)
    );
    if (!organization) {
      throw new Error("Organization not found");
    }

    await this.organizationRepository.update(parseInt(id), data);
    return await this.organizationRepository.findById(parseInt(id));
  }

  async deleteOrganization(id) {
    const deleted = await this.organizationRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Organization not found");
    }
    return true;
  }
}

