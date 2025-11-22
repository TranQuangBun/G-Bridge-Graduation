import { WorkingModeRepository } from "../repositories/WorkingModeRepository.js";

export class WorkingModeService {
  constructor() {
    this.workingModeRepository = new WorkingModeRepository();
  }

  async getAllWorkingModes(query) {
    const { page = 1, limit = 20, isActive = "" } = query;

    if (isActive === "true" || isActive === true) {
      const workingModes = await this.workingModeRepository.findActive();
      return {
        workingModes,
        pagination: {
          total: workingModes.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(workingModes.length / parseInt(limit)),
        },
      };
    }

    const [workingModes, total] = await this.workingModeRepository.findAndCount({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      order: { name: "ASC" },
    });

    return {
      workingModes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getWorkingModeById(id) {
    const workingMode = await this.workingModeRepository.findById(parseInt(id));
    if (!workingMode) {
      throw new Error("Working mode not found");
    }
    return workingMode;
  }

  async createWorkingMode(data) {
    const workingMode = await this.workingModeRepository.create(data);
    return workingMode;
  }

  async updateWorkingMode(id, data) {
    const workingMode = await this.workingModeRepository.findById(parseInt(id));
    if (!workingMode) {
      throw new Error("Working mode not found");
    }

    await this.workingModeRepository.update(parseInt(id), data);
    return await this.workingModeRepository.findById(parseInt(id));
  }

  async deleteWorkingMode(id) {
    const deleted = await this.workingModeRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Working mode not found");
    }
    return true;
  }
}

