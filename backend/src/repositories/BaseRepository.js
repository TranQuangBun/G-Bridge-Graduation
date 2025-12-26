import { AppDataSource } from "../config/DataSource.js";

export class BaseRepository {
  constructor(entity) {
    this.entity = entity;
    this.repository = AppDataSource.getRepository(entity);
  }

  async findAll(options = {}) {
    return await this.repository.find(options);
  }

  async findById(id, options = {}) {
    if (id === undefined || id === null || isNaN(id)) {
      return null;
    }
    return await this.repository.findOne({
      where: { id },
      ...options,
    });
  }

  async findOne(where, options = {}) {
    return await this.repository.findOne({
      where,
      ...options,
    });
  }

  async findAndCount(options = {}) {
    return await this.repository.findAndCount(options);
  }

  async create(data) {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async update(id, data) {
    await this.repository.update({ id }, data);
    return await this.findById(id);
  }

  async delete(id) {
    const result = await this.repository.delete({ id });
    return result.affected > 0;
  }

  async count(where = {}) {
    return await this.repository.count({ where });
  }

  async exists(where) {
    const count = await this.repository.count({ where });
    return count > 0;
  }
}

