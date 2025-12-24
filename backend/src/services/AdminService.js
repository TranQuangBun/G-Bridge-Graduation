import { CertificationRepository } from "../repositories/CertificationRepository.js";
import { OrganizationRepository } from "../repositories/OrganizationRepository.js";
import { NotificationService } from "./NotificationService.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { CertificationStatus } from "../entities/Certification.js";
import { OrganizationStatus } from "../entities/Organization.js";
import { NotificationType } from "../entities/Notification.js";
import { PaymentStatus } from "../entities/PaymentConstants.js";
import { NotFoundError } from "../utils/Errors.js";

export class AdminService {
  constructor() {
    this.certificationRepository = new CertificationRepository();
    this.organizationRepository = new OrganizationRepository();
    this.notificationService = new NotificationService();
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
    this.paymentRepository = new PaymentRepository();
    this.userRepo = AppDataSource.getRepository(User);
  }

  // Certificate Approval Methods
  async getPendingCertifications(filters = {}) {
    const { page = 1, limit = 20, search = "", status } = filters;

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

    queryBuilder
      .orderBy("certification.createdAt", "DESC")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [certifications, count] = await queryBuilder.getManyAndCount();

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
    const certification = await this.certificationRepository.repository.findOne(
      {
        where: { id: parseInt(certificationId) },
        relations: ["user"],
      }
    );

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    certification.verificationStatus = CertificationStatus.APPROVED;
    certification.isVerified = true;
    const updated = await this.certificationRepository.repository.save(
      certification
    );

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
    const certification = await this.certificationRepository.repository.findOne(
      {
        where: { id: parseInt(certificationId) },
        relations: ["user"],
      }
    );

    if (!certification) {
      throw new NotFoundError("Certification");
    }

    certification.verificationStatus = CertificationStatus.REJECTED;
    certification.isVerified = false;
    const updated = await this.certificationRepository.repository.save(
      certification
    );

    // Send notification to user
    await this.notificationService.createNotification({
      recipientId: certification.userId,
      actorId: adminId,
      type: NotificationType.GENERIC,
      title: "Chứng chỉ bị từ chối",
      message: `Chứng chỉ "${certification.name}" của bạn đã bị từ chối.${
        reason ? ` Lý do: ${reason}` : ""
      }`,
      metadata: {
        certificationId: certification.id,
        type: "certification_rejected",
        reason,
      },
    });

    return updated;
  }

  // Organization Approval Methods
  async getOrganizations(filters = {}) {
    const { page = 1, limit = 20, search = "", status = "" } = filters;

    const queryBuilder = this.organizationRepository.repository
      .createQueryBuilder("organization")
      .leftJoinAndSelect("organization.owner", "owner")
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
        "organization.businessLicense",
        "organization.licenseVerificationStatus",
        "organization.isActive",
        "organization.approvalStatus",
        "organization.rejectionReason",
        "organization.createdAt",
        "owner.id",
        "owner.fullName",
        "owner.email",
      ]);

    // Filter by status if provided
    if (status) {
      queryBuilder.where("organization.approvalStatus = :status", { status });
    }

    if (search) {
      const condition = status ? "andWhere" : "where";
      queryBuilder[condition](
        "(organization.name LIKE :search OR organization.email LIKE :search OR organization.description LIKE :search OR owner.fullName LIKE :search OR owner.email LIKE :search)",
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy("organization.createdAt", "DESC")
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

  async getPendingOrganizations(filters = {}) {
    const { page = 1, limit = 20, search = "" } = filters;

    const queryBuilder = this.organizationRepository.repository
      .createQueryBuilder("organization")
      .leftJoinAndSelect("organization.owner", "owner")
      .where("organization.approvalStatus = :status", {
        status: OrganizationStatus.PENDING,
      })
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
        "organization.businessLicense",
        "organization.licenseVerificationStatus",
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

    queryBuilder
      .orderBy("organization.createdAt", "DESC")
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
    const updated = await this.organizationRepository.repository.save(
      organization
    );

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
    const updated = await this.organizationRepository.repository.save(
      organization
    );

    // Send notification to owner if exists
    if (organization.ownerUserId) {
      await this.notificationService.createNotification({
        recipientId: organization.ownerUserId,
        actorId: adminId,
        type: NotificationType.GENERIC,
        title: "Tổ chức bị từ chối",
        message: `Tổ chức "${organization.name}" của bạn đã bị từ chối.${
          reason ? ` Lý do: ${reason}` : ""
        }`,
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
  async createSystemNotification({
    title,
    message,
    recipientEmails = null,
    recipientIds = null,
    metadata = null,
  }) {
    if (!title || !message) {
      throw new Error("Title and message are required");
    }

    // Create a common timestamp for the entire batch
    // This ensures all notifications in the same batch have the same createdAt
    const batchTimestamp = new Date();

    let notifications = [];
    let recipientUserIds = [];

    if (recipientEmails && recipientEmails.length > 0) {
      // Collect user IDs from emails
      for (const email of recipientEmails) {
        const user = await this.userRepository.findByEmail(email.trim());
        if (!user) {
          throw new Error(`User with email ${email.trim()} not found`);
        }
        if (!user.isActive) {
          continue; // Skip inactive users
        }
        recipientUserIds.push(user.id);
      }
    } else if (recipientIds && recipientIds.length > 0) {
      // Use provided IDs (backward compatibility)
      recipientUserIds = recipientIds;
    } else {
      // Send to all active users
      const users = await this.userRepo.find({
        where: { isActive: true },
        select: ["id"],
      });
      recipientUserIds = users.map((user) => user.id);
    }

    // Create all notifications with the same timestamp
    for (const recipientId of recipientUserIds) {
      const notification = await this.notificationService.createNotification({
        recipientId,
        actorId: null, // System notification
        type: NotificationType.SYSTEM_NOTIFICATION,
        title,
        message,
        metadata,
        createdAt: batchTimestamp, // Use the same timestamp for all notifications in batch
      });
      notifications.push(notification);
    }

    return {
      count: notifications.length,
      notifications,
    };
  }

  async getSystemNotifications(filters = {}) {
    const { page = 1, limit = 20, search = "" } = filters;

    // First, get ALL system notifications (no pagination yet)
    const queryBuilder = this.notificationRepository.repository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.recipient", "recipient")
      .where("notification.type = :type", { type: NotificationType.SYSTEM_NOTIFICATION });

    if (search) {
      queryBuilder.andWhere(
        "(notification.title LIKE :search OR notification.message LIKE :search OR recipient.fullName LIKE :search OR recipient.email LIKE :search)",
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy("notification.createdAt", "DESC");

    // Get all notifications first
    const allNotifications = await queryBuilder.getMany();

    // Group notifications by title and createdAt to show unique notifications
    // Since all notifications in a batch now have the same createdAt, we can group by exact match
    const groupedMap = new Map();
    
    allNotifications.forEach((notif) => {
      // Use full ISO string for exact matching (all notifications in batch have same timestamp)
      const createdAtKey = notif.createdAt ? new Date(notif.createdAt).toISOString() : '';
      // Key includes both title and exact time to distinguish different notifications
      const key = `${notif.title}_${createdAtKey}`;
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
          recipientCount: 0,
          recipients: [],
        });
      }
      const group = groupedMap.get(key);
      group.recipientCount++;
      if (notif.recipient) {
        group.recipients.push({
          id: notif.recipient.id,
          name: notif.recipient.fullName,
          email: notif.recipient.email,
        });
      }
    });

    // Convert to array and sort by createdAt DESC
    const groupedNotifications = Array.from(groupedMap.values()).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Now apply pagination on grouped results
    const total = groupedNotifications.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const paginatedNotifications = groupedNotifications.slice(skip, skip + limitNum);

    return {
      notifications: paginatedNotifications,
      pagination: {
        total: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
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
      certRepo.count({
        where: { verificationStatus: CertificationStatus.PENDING },
      }),
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

  // User Management Methods
  async getAllUsers(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      isActive = "",
      isVerified = "",
    } = filters;

    const [users, total] = await this.userRepository.searchUsers(
      search,
      role,
      isActive,
      isVerified,
      parseInt(page),
      parseInt(limit)
    );

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getUserById(id) {
    const user = await this.userRepository.findByIdWithProfiles(parseInt(id));
    if (!user) {
      throw new NotFoundError("User");
    }
    return user;
  }

  async updateUser(id, userData) {
    const { passwordHash, ...data } = userData;

    const user = await this.userRepository.findById(parseInt(id));
    if (!user) {
      throw new NotFoundError("User");
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new Error("Email already exists");
      }
    }

    const updatePayload = { ...data };
    if (passwordHash) {
      updatePayload.passwordHash = passwordHash;
    }

    const updated = await this.userRepository.update(
      parseInt(id),
      updatePayload
    );
    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return userResponse;
  }

  async deleteUser(id, adminId, reason = "") {
    const user = await this.userRepository.findById(parseInt(id));
    if (!user) {
      throw new NotFoundError("User");
    }

    // Send notification to user before deletion
    try {
      await this.notificationService.createNotification({
        recipientId: parseInt(id),
        actorId: parseInt(adminId),
        type: NotificationType.GENERIC,
        title: "Tài khoản đã bị xóa",
        message: reason
          ? `Tài khoản của bạn đã bị xóa. Lý do: ${reason}`
          : "Tài khoản của bạn đã bị xóa bởi quản trị viên.",
        metadata: {
          type: "account_deleted",
          reason: reason,
        },
      });
    } catch (notifyError) {
      // Log but don't fail the deletion
      console.error("Error sending deletion notification:", notifyError);
    }

    await this.userRepository.delete(parseInt(id));
    return true;
  }

  async toggleUserStatus(id, adminId, reason = "") {
    const user = await this.userRepository.findById(parseInt(id));
    if (!user) {
      throw new NotFoundError("User");
    }

    const wasActive = user.isActive;
    user.isActive = !user.isActive;
    const updated = await this.userRepository.repository.save(user);
    const userResponse = { ...updated };
    delete userResponse.passwordHash;

    // Send notification to user
    try {
      const action = user.isActive ? "kích hoạt" : "vô hiệu hóa";
      await this.notificationService.createNotification({
        recipientId: parseInt(id),
        actorId: parseInt(adminId),
        type: NotificationType.GENERIC,
        title: `Tài khoản đã được ${action}`,
        message: reason
          ? `Tài khoản của bạn đã được ${action}. Lý do: ${reason}`
          : `Tài khoản của bạn đã được ${action} bởi quản trị viên.`,
        metadata: {
          type: "account_status_changed",
          isActive: user.isActive,
          reason: reason,
        },
      });
    } catch (notifyError) {
      // Log but don't fail the status update
      console.error("Error sending status change notification:", notifyError);
    }

    return userResponse;
  }

  // Revenue Management Methods
  async getRevenueStats(filters = {}) {
    const { startDate, endDate } = filters;

    const paymentRepo = this.paymentRepository.repository;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total revenue (completed payments only)
    const totalRevenueQuery = paymentRepo
      .createQueryBuilder("payment")
      .select("SUM(payment.amount)", "total")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED });

    if (startDate) {
      totalRevenueQuery.andWhere("payment.createdAt >= :startDate", {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      totalRevenueQuery.andWhere("payment.createdAt <= :endDate", {
        endDate: new Date(endDate),
      });
    }

    const totalRevenueResult = await totalRevenueQuery.getRawOne();
    const totalRevenue = parseFloat(totalRevenueResult?.total || 0);

    // Get revenue by payment gateway
    const revenueByGatewayQuery = paymentRepo
      .createQueryBuilder("payment")
      .select("payment.paymentGateway", "gateway")
      .addSelect("SUM(payment.amount)", "total")
      .addSelect("COUNT(payment.id)", "count")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED });

    if (startDate) {
      revenueByGatewayQuery.andWhere("payment.createdAt >= :startDate", {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      revenueByGatewayQuery.andWhere("payment.createdAt <= :endDate", {
        endDate: new Date(endDate),
      });
    }

    revenueByGatewayQuery
      .groupBy("payment.paymentGateway")
      .orderBy("total", "DESC");

    const revenueByGateway = await revenueByGatewayQuery.getRawMany();

    // Get revenue by month (last 12 months)
    const revenueByMonthQuery = paymentRepo
      .createQueryBuilder("payment")
      .select("DATE_FORMAT(payment.createdAt, '%Y-%m')", "month")
      .addSelect("SUM(payment.amount)", "total")
      .addSelect("COUNT(payment.id)", "count")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED })
      .andWhere("payment.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)")
      .groupBy("month")
      .orderBy("month", "ASC");

    const revenueByMonth = await revenueByMonthQuery.getRawMany();

    // Get payment statistics
    const [totalPayments, completedPayments, pendingPayments, failedPayments] =
      await Promise.all([
        paymentRepo.count(),
        paymentRepo.count({ where: { status: PaymentStatus.COMPLETED } }),
        paymentRepo.count({ where: { status: PaymentStatus.PENDING } }),
        paymentRepo.count({ where: { status: PaymentStatus.FAILED } }),
      ]);

    return {
      totalRevenue,
      revenueByGateway: revenueByGateway.map((item) => ({
        gateway: item.gateway,
        total: parseFloat(item.total || 0),
        count: parseInt(item.count || 0),
      })),
      revenueByMonth: revenueByMonth.map((item) => ({
        month: item.month,
        total: parseFloat(item.total || 0),
        count: parseInt(item.count || 0),
      })),
      statistics: {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        successRate:
          totalPayments > 0
            ? ((completedPayments / totalPayments) * 100).toFixed(2)
            : 0,
      },
    };
  }

  async getAllPayments(filters = {}) {
    const {
      page = 1,
      limit = 20,
      userId = "",
      planId = "",
      status = "",
      paymentGateway = "",
      orderId = "",
      startDate = "",
      endDate = "",
    } = filters;

    const queryBuilder = this.paymentRepository.repository
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.user", "user")
      .leftJoinAndSelect("payment.plan", "plan")
      .orderBy("payment.createdAt", "DESC");

    // Apply filters
    if (userId) {
      queryBuilder.andWhere("payment.userId = :userId", {
        userId: parseInt(userId),
      });
    }
    if (planId) {
      queryBuilder.andWhere("payment.planId = :planId", {
        planId: parseInt(planId),
      });
    }
    if (status) {
      queryBuilder.andWhere("payment.status = :status", { status });
    }
    if (paymentGateway) {
      queryBuilder.andWhere("payment.paymentGateway = :paymentGateway", {
        paymentGateway,
      });
    }
    if (orderId) {
      queryBuilder.andWhere("payment.orderId LIKE :orderId", {
        orderId: `%${orderId}%`,
      });
    }
    if (startDate) {
      queryBuilder.andWhere("payment.createdAt >= :startDate", {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      queryBuilder.andWhere("payment.createdAt <= :endDate", {
        endDate: new Date(endDate),
      });
    }

    queryBuilder
      .skip((parseInt(page) - 1) * parseInt(limit))
      .take(parseInt(limit));

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }
}
