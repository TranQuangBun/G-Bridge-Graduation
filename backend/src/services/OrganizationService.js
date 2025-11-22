import { OrganizationRepository } from "../repositories/OrganizationRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";

export class OrganizationService {
  constructor() {
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
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
    
    // Validate and verify ownerUserId
    if (payload.ownerUserId) {
      const ownerUserId = parseInt(payload.ownerUserId);
      
      // Check if ownerUserId is a valid integer
      if (!Number.isInteger(ownerUserId) || isNaN(ownerUserId) || ownerUserId <= 0) {
        console.warn(`Invalid ownerUserId: ${payload.ownerUserId}, setting to null`);
        payload.ownerUserId = null;
      } else {
        // Verify user exists in database
        const user = await this.userRepository.findById(ownerUserId);
        if (!user) {
          console.warn(`User with ID ${ownerUserId} not found, setting ownerUserId to null`);
          payload.ownerUserId = null;
        } else {
          payload.ownerUserId = ownerUserId;
        }
      }
    } else {
      payload.ownerUserId = null;
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

    const payload = { ...data };
    
    // Validate and verify ownerUserId if provided
    if (payload.ownerUserId !== undefined) {
      if (payload.ownerUserId === null || payload.ownerUserId === "") {
        payload.ownerUserId = null;
      } else {
        const ownerUserId = parseInt(payload.ownerUserId);
        
        // Check if ownerUserId is a valid integer
        if (!Number.isInteger(ownerUserId) || isNaN(ownerUserId) || ownerUserId <= 0) {
          console.warn(`Invalid ownerUserId: ${payload.ownerUserId}, setting to null`);
          payload.ownerUserId = null;
        } else {
          // Verify user exists in database
          const user = await this.userRepository.findById(ownerUserId);
          if (!user) {
            console.warn(`User with ID ${ownerUserId} not found, setting ownerUserId to null`);
            payload.ownerUserId = null;
          } else {
            payload.ownerUserId = ownerUserId;
          }
        }
      }
    }

    await this.organizationRepository.update(parseInt(id), payload);
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

