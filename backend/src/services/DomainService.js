import { DomainRepository } from "../repositories/DomainRepository.js";

export class DomainService {
  constructor() {
    this.domainRepository = new DomainRepository();
  }

  async getAllDomains(query) {
    const { page = 1, limit = 20, isActive = "" } = query;

    if (isActive === "true" || isActive === true) {
      const domains = await this.domainRepository.findActive();
      return {
        domains,
        pagination: {
          total: domains.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(domains.length / parseInt(limit)),
        },
      };
    }

    const [domains, total] = await this.domainRepository.findAndCount({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      order: { name: "ASC" },
    });

    return {
      domains,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getDomainById(id) {
    const domain = await this.domainRepository.findById(parseInt(id));
    if (!domain) {
      throw new Error("Domain not found");
    }
    return domain;
  }

  async createDomain(data) {
    const domain = await this.domainRepository.create(data);
    return domain;
  }

  async updateDomain(id, data) {
    const domain = await this.domainRepository.findById(parseInt(id));
    if (!domain) {
      throw new Error("Domain not found");
    }

    await this.domainRepository.update(parseInt(id), data);
    return await this.domainRepository.findById(parseInt(id));
  }

  async deleteDomain(id) {
    const deleted = await this.domainRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Domain not found");
    }
    return true;
  }
}

