import { CertificationRepository } from "../repositories/CertificationRepository.js";
import { OrganizationRepository } from "../repositories/OrganizationRepository.js";
import { NotificationService } from "./NotificationService.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { CertificationStatus } from "../entities/Certification.js";
import { OrganizationStatus } from "../entities/Organization.js";
import { NotificationType } from "../entities/Notification.js";
import { NotFoundError } from "../utils/Errors.js";

export class AdminService {
  constructor() {
    this.certificationRepository = new CertificationRepository();
    this.organizationRepository = new OrganizationRepository();
    this.notificationService = new NotificationService();
    this.userRepository = new UserRepository();
    this.userRepo = AppDataSource.getRepository(User);
  }

  // Certificate Approval Methods
  async getPendingCertifications(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
    } = filters;

    const queryBuilder = this.certificationRepository.repository
      .createQueryBuilder("certification")
      .leftJoinAndSelect("certification.user", "user");

    // Build WHERE conditions
    const conditions = [];
    const parameters = {};

    // Filter by status if provided and not "all"
    if (status && status !== "all") {
      conditions.push("certification.verificationStatus = :status");
      parameters.status = status;
    }

    // Add search condition
    if (search) {
      conditions.push(
        "(certification.name LIKE :search OR certification.issuingOrganization LIKE :search OR COALESCE(user.fullName, '') LIKE :search)"
      );
      parameters.search = `%${search}%`;
    }

    // Apply all conditions
    if (conditions.length > 0) {
      queryBuilder.where(conditions.join(" AND "), parameters);
    }

    queryBuilder.orderBy("certification.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    // Debug: Log the query
    const sql = queryBuilder.getSql();
    console.log("Certification query:", sql);
    console.log("Query parameters:", parameters);
    console.log("Filters:", { page, limit, search, status });

    const [certifications, count] = await queryBuilder.getManyAndCount();
    
    console.log("Found certifications:", count);
    console.log("Certification statuses:", certifications.map(c => ({ id: c.id, status: c.verificationStatus })));

    return {
      certifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async approveCertification(certificationId, adminId) {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(certificationId) },
      relations: ["user"],
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    certification.verificationStatus = CertificationStatus.APPROVED;
    certification.isVerified = true;
    const updated = await this.certificationRepository.repository.save(certification);

    // Send notification to user
    await this.notificationService.createNotification({
      recipientId: certification.userId,
      actorId: adminId,
      type: NotificationType.GENERIC,
      title: "Chứng chỉ đã được duyệt",
      message: `Chứng chỉ "${certification.name}" của bạn đã được duyệt thành công.`,
      metadata: {
        certificationId: certification.id,
        type: "certification_approved",
      },
    });

    return updated;
  }

  async rejectCertification(certificationId, adminId, reason = "") {
    const certification = await this.certificationRepository.repository.findOne({
      where: { id: parseInt(certificationId) },
      relations: ["user"],
    });

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    certification.verificationStatus = CertificationStatus.REJECTED;
    certification.isVerified = false;
    const updated = await this.certificationRepository.repository.save(certification);

    // Send notification to user
    await this.notificationService.createNotification({
      recipientId: certification.userId,
      actorId: adminId,
      type: NotificationType.GENERIC,
      title: "Chứng chỉ bị từ chối",
      message: `Chứng chỉ "${certification.name}" của bạn đã bị từ chối.${reason ? ` Lý do: ${reason}` : ""}`,
      metadata: {
        certificationId: certification.id,
        type: "certification_rejected",
        reason,
      },
    });

    return updated;
  }

  // Organization Approval Methods
  async getPendingOrganizations(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
    } = filters;

    const queryBuilder = this.organizationRepository.repository
      .createQueryBuilder("organization")
      .leftJoinAndSelect("organization.owner", "owner")
      .where("organization.approvalStatus = :status", { status: OrganizationStatus.PENDING })
      .select([
        "organization.id",
        "organization.name",
        "organization.description",
        "organization.logo",
        "organization.website",
        "organization.email",
        "organization.phone",
        "organization.address",
        "organization.province",
        "organization.isActive",
        "organization.approvalStatus",
        "organization.rejectionReason",
        "organization.createdAt",
        "owner.id",
        "owner.fullName",
        "owner.email",
      ]);

    if (search) {
      queryBuilder.andWhere(
        "(organization.name LIKE :search OR organization.description LIKE :search OR owner.fullName LIKE :search)",
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy("organization.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [organizations, count] = await queryBuilder.getManyAndCount();

    return {
      organizations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    };
  }

  async approveOrganization(organizationId, adminId) {
    const organization = await this.organizationRepository.repository.findOne({
      where: { id: parseInt(organizationId) },
      relations: ["owner"],
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    organization.approvalStatus = OrganizationStatus.APPROVED;
    organization.isActive = true;
    organization.rejectionReason = null;
    const updated = await this.organizationRepository.repository.save(organization);

    // Send notification to owner if exists
    if (organization.ownerUserId) {
      await this.notificationService.createNotification({
        recipientId: organization.ownerUserId,
        actorId: adminId,
        type: NotificationType.GENERIC,
        title: "Tổ chức đã được duyệt",
        message: `Tổ chức "${organization.name}" của bạn đã được duyệt thành công.`,
        metadata: {
          organizationId: organization.id,
          type: "organization_approved",
        },
      });
    }

    return updated;
  }

  async rejectOrganization(organizationId, adminId, reason = "") {
    const organization = await this.organizationRepository.repository.findOne({
      where: { id: parseInt(organizationId) },
      relations: ["owner"],
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    organization.approvalStatus = OrganizationStatus.REJECTED;
    organization.isActive = false;
    organization.rejectionReason = reason || null;
    const updated = await this.organizationRepository.repository.save(organization);

    // Send notification to owner if exists
    if (organization.ownerUserId) {
      await this.notificationService.createNotification({
        recipientId: organization.ownerUserId,
        actorId: adminId,
        type: NotificationType.GENERIC,
        title: "Tổ chức bị từ chối",
        message: `Tổ chức "${organization.name}" của bạn đã bị từ chối.${reason ? ` Lý do: ${reason}` : ""}`,
        metadata: {
          organizationId: organization.id,
          type: "organization_rejected",
          reason,
        },
      });
    }

    return updated;
  }

  // System Notification Methods
  async createSystemNotification({ title, message, recipientIds = null, metadata = null }) {
    if (!title || !message) {
      throw new Error("Title and message are required");
    }

    let notifications = [];

    if (recipientIds && recipientIds.length > 0) {
      // Send to specific users
      for (const recipientId of recipientIds) {
        const notification = await this.notificationService.createNotification({
          recipientId,
          actorId: null, // System notification
          type: NotificationType.GENERIC,
          title,
          message,
          metadata,
        });
        notifications.push(notification);
      }
    } else {
      // Send to all active users
      const users = await this.userRepo.find({
        where: { isActive: true },
        select: ["id"],
      });

      for (const user of users) {
        const notification = await this.notificationService.createNotification({
          recipientId: user.id,
          actorId: null,
          type: NotificationType.GENERIC,
          title,
          message,
          metadata,
        });
        notifications.push(notification);
      }
    }

    return {
      count: notifications.length,
      notifications,
    };
  }

  // Admin Dashboard Stats
  async getDashboardStats() {
    const userRepo = this.userRepo;
    const certRepo = this.certificationRepository.repository;
    const orgRepo = this.organizationRepository.repository;

    const [
      totalUsers,
      totalInterpreters,
      totalClients,
      pendingCertifications,
      pendingOrganizations,
      totalCertifications,
      totalOrganizations,
    ] = await Promise.all([
      userRepo.count({ where: { isActive: true } }),
      userRepo.count({ where: { role: "interpreter", isActive: true } }),
      userRepo.count({ where: { role: "client", isActive: true } }),
      certRepo.count({ where: { verificationStatus: CertificationStatus.PENDING } }),
      orgRepo.count({ where: { approvalStatus: OrganizationStatus.PENDING } }),
      certRepo.count(),
      orgRepo.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        interpreters: totalInterpreters,
        clients: totalClients,
      },
      pendingApprovals: {
        certifications: pendingCertifications,
        organizations: pendingOrganizations,
        total: pendingCertifications + pendingOrganizations,
      },
      total: {
        certifications: totalCertifications,
        organizations: totalOrganizations,
      },
    };
  }
}

