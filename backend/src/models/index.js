// Import all models
import User from "./User.js";
import InterpreterProfile from "./InterpreterProfile.js";
import ClientProfile from "./ClientProfile.js";
import Language from "./Language.js";
import Certification from "./Certification.js";

// Import Job-related models
import Organization from "./Organization.js";
import WorkingMode from "./WorkingMode.js";
import Domain from "./Domain.js";
import Level from "./Level.js";
import Job from "./Job.js";
import JobHasDomain from "./JobHasDomain.js";
import JobRequiredLanguage from "./JobRequiredLanguage.js";
import JobRequiredCertificate from "./JobRequiredCertificate.js";
import JobApplication from "./JobApplication.js";
import SavedJob from "./SavedJob.js";
import SavedInterpreter from "./SavedInterpreter.js";

// Import Booking-related models
import BookingRequest from "./BookingRequest.js";

// Import Notification model
import Notification from "./Notification.js";

// Import Payment-related models
import SubscriptionPlan from "./SubscriptionPlan.js";
import Payment from "./Payment.js";
import UserSubscription from "./UserSubscription.js";
import PaymentWebhook from "./PaymentWebhook.js";
import PaymentRefund from "./PaymentRefund.js";

// Define all associations here
User.hasOne(InterpreterProfile, {
  foreignKey: "userId",
  as: "interpreterProfile",
  onDelete: "CASCADE",
});
InterpreterProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasOne(ClientProfile, {
  foreignKey: "userId",
  as: "clientProfile",
  onDelete: "CASCADE",
});
ClientProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User has many Languages
User.hasMany(Language, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "languages",
});
Language.belongsTo(User, {
  foreignKey: "userId",
});

// User has many Certifications
User.hasMany(Certification, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "certifications",
});
Certification.belongsTo(User, {
  foreignKey: "userId",
});

// ==================== JOB RELATIONSHIPS ====================

// Organization has many Jobs
Organization.hasMany(Job, {
  foreignKey: "organizationId",
  as: "jobs",
  onDelete: "CASCADE",
});
Job.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

// WorkingMode has many Jobs
WorkingMode.hasMany(Job, {
  foreignKey: "workingModeId",
  as: "jobs",
  onDelete: "RESTRICT",
});
Job.belongsTo(WorkingMode, {
  foreignKey: "workingModeId",
  as: "workingMode",
});

// Job and Domain (Many-to-Many through JobHasDomain)
Job.belongsToMany(Domain, {
  through: JobHasDomain,
  foreignKey: "jobId",
  otherKey: "domainId",
  as: "domains",
});
Domain.belongsToMany(Job, {
  through: JobHasDomain,
  foreignKey: "domainId",
  otherKey: "jobId",
  as: "jobs",
});

// Job has many JobRequiredLanguages
Job.hasMany(JobRequiredLanguage, {
  foreignKey: "jobId",
  as: "requiredLanguages",
  onDelete: "CASCADE",
});
JobRequiredLanguage.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// Language has many JobRequiredLanguages
Language.hasMany(JobRequiredLanguage, {
  foreignKey: "languageId",
  as: "jobRequirements",
  onDelete: "CASCADE",
});
JobRequiredLanguage.belongsTo(Language, {
  foreignKey: "languageId",
  as: "language",
});

// Level has many JobRequiredLanguages
Level.hasMany(JobRequiredLanguage, {
  foreignKey: "levelId",
  as: "jobRequirements",
  onDelete: "RESTRICT",
});
JobRequiredLanguage.belongsTo(Level, {
  foreignKey: "levelId",
  as: "level",
});

// Job has many JobRequiredCertificates
Job.hasMany(JobRequiredCertificate, {
  foreignKey: "jobId",
  as: "requiredCertificates",
  onDelete: "CASCADE",
});
JobRequiredCertificate.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// Certification has many JobRequiredCertificates
Certification.hasMany(JobRequiredCertificate, {
  foreignKey: "certificateId",
  as: "jobRequirements",
  onDelete: "CASCADE",
});
JobRequiredCertificate.belongsTo(Certification, {
  foreignKey: "certificateId",
  as: "certificate",
});

// Job has many JobApplications
Job.hasMany(JobApplication, {
  foreignKey: "jobId",
  as: "applications",
  onDelete: "CASCADE",
});
JobApplication.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});

// User (Interpreter) has many JobApplications
User.hasMany(JobApplication, {
  foreignKey: "interpreterId",
  as: "jobApplications",
  onDelete: "CASCADE",
});
JobApplication.belongsTo(User, {
  foreignKey: "interpreterId",
  as: "interpreter",
});

// User and Job (Many-to-Many through SavedJob)
User.belongsToMany(Job, {
  through: SavedJob,
  foreignKey: "userId",
  otherKey: "jobId",
  as: "savedJobs",
});
Job.belongsToMany(User, {
  through: SavedJob,
  foreignKey: "jobId",
  otherKey: "userId",
  as: "savedByUsers",
});

// SavedJob direct associations (for querying saved jobs with job details)
SavedJob.belongsTo(Job, {
  foreignKey: "jobId",
  as: "job",
});
Job.hasMany(SavedJob, {
  foreignKey: "jobId",
  as: "savedBy",
});

SavedJob.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
User.hasMany(SavedJob, {
  foreignKey: "userId",
  as: "savedJobRecords",
});

// ==================== SAVED INTERPRETER RELATIONSHIPS ====================

// User and Interpreter (Many-to-Many through SavedInterpreter)
// Company/Client saves Interpreters
User.belongsToMany(User, {
  through: SavedInterpreter,
  foreignKey: "userId",
  otherKey: "interpreterId",
  as: "savedInterpreters",
});
User.belongsToMany(User, {
  through: SavedInterpreter,
  foreignKey: "interpreterId",
  otherKey: "userId",
  as: "savedByUsers",
});

// SavedInterpreter direct associations
SavedInterpreter.belongsTo(User, {
  foreignKey: "interpreterId",
  as: "interpreter",
});
User.hasMany(SavedInterpreter, {
  foreignKey: "interpreterId",
  as: "savedByRecords",
});

SavedInterpreter.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
User.hasMany(SavedInterpreter, {
  foreignKey: "userId",
  as: "savedInterpreterRecords",
});

// ==================== BOOKING REQUEST RELATIONSHIPS ====================

// User (Client) has many BookingRequests
User.hasMany(BookingRequest, {
  foreignKey: "clientId",
  as: "sentBookingRequests",
  onDelete: "CASCADE",
});
BookingRequest.belongsTo(User, {
  foreignKey: "clientId",
  as: "client",
});

// User (Interpreter) has many BookingRequests
User.hasMany(BookingRequest, {
  foreignKey: "interpreterId",
  as: "receivedBookingRequests",
  onDelete: "CASCADE",
});
BookingRequest.belongsTo(User, {
  foreignKey: "interpreterId",
  as: "interpreter",
});

// ==================== PAYMENT RELATIONSHIPS ====================

// User has many Payments
User.hasMany(Payment, {
  foreignKey: "userId",
  as: "payments",
  onDelete: "CASCADE",
});
Payment.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// SubscriptionPlan has many Payments
SubscriptionPlan.hasMany(Payment, {
  foreignKey: "planId",
  as: "payments",
  onDelete: "RESTRICT",
});
Payment.belongsTo(SubscriptionPlan, {
  foreignKey: "planId",
  as: "plan",
});

// User has one active UserSubscription
User.hasOne(UserSubscription, {
  foreignKey: "userId",
  as: "activeSubscription",
  onDelete: "CASCADE",
});
UserSubscription.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// SubscriptionPlan has many UserSubscriptions
SubscriptionPlan.hasMany(UserSubscription, {
  foreignKey: "planId",
  as: "subscriptions",
  onDelete: "RESTRICT",
});
UserSubscription.belongsTo(SubscriptionPlan, {
  foreignKey: "planId",
  as: "plan",
});

// Payment has one UserSubscription (created by this payment)
Payment.hasOne(UserSubscription, {
  foreignKey: "paymentId",
  as: "subscription",
  onDelete: "SET NULL",
});
UserSubscription.belongsTo(Payment, {
  foreignKey: "paymentId",
  as: "initialPayment",
});

// Payment has many PaymentWebhooks
Payment.hasMany(PaymentWebhook, {
  foreignKey: "paymentId",
  as: "webhooks",
  onDelete: "SET NULL",
});
PaymentWebhook.belongsTo(Payment, {
  foreignKey: "paymentId",
  as: "payment",
});

// Payment has many PaymentRefunds
Payment.hasMany(PaymentRefund, {
  foreignKey: "paymentId",
  as: "refunds",
  onDelete: "RESTRICT",
});
PaymentRefund.belongsTo(Payment, {
  foreignKey: "paymentId",
  as: "payment",
});

// User has many PaymentRefunds (as requester)
User.hasMany(PaymentRefund, {
  foreignKey: "userId",
  as: "refundRequests",
  onDelete: "CASCADE",
});
PaymentRefund.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User processes PaymentRefunds (as admin)
User.hasMany(PaymentRefund, {
  foreignKey: "processedBy",
  as: "processedRefunds",
  onDelete: "SET NULL",
});
PaymentRefund.belongsTo(User, {
  foreignKey: "processedBy",
  as: "processor",
});

// ==================== NOTIFICATION RELATIONSHIPS ====================

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: "CASCADE",
});
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Export all models
export {
  User,
  InterpreterProfile,
  ClientProfile,
  Language,
  Certification,
  Organization,
  WorkingMode,
  Domain,
  Level,
  Job,
  JobHasDomain,
  JobRequiredLanguage,
  JobRequiredCertificate,
  JobApplication,
  SavedJob,
  SavedInterpreter,
  BookingRequest,
  Notification,
  SubscriptionPlan,
  Payment,
  UserSubscription,
  PaymentWebhook,
  PaymentRefund,
};

// Function to sync all models
export async function syncDatabase(force = false) {
  try {
    console.log("Syncing database models...");

    // Sync models in order (dependencies first)
    // Temporarily disabled alter to avoid MySQL key limit issues
    // Re-enable alter when schema changes are needed

    // Core models
    await User.sync({ force });
    await InterpreterProfile.sync({ force });
    await ClientProfile.sync({ force });
    await Language.sync({ force });
    await Certification.sync({ force });

    // Job-related lookup tables
    await Organization.sync({ force });
    await WorkingMode.sync({ force });
    await Domain.sync({ force });
    await Level.sync({ force });

    // Main Job table
    await Job.sync({ force });

    // Job relationship tables
    await JobHasDomain.sync({ force });
    await JobRequiredLanguage.sync({ force });
    await JobRequiredCertificate.sync({ force });
    await JobApplication.sync({ force });
    await SavedJob.sync({ force });
    await SavedInterpreter.sync({ force });

    // Booking requests
    await BookingRequest.sync({ force });

    // Notifications
    await Notification.sync({ force });

    // Payment models (don't force sync - tables already created by migration)
    await SubscriptionPlan.sync({ force: false });
    await Payment.sync({ force: false });
    await UserSubscription.sync({ force: false });
    await PaymentWebhook.sync({ force: false });
    await PaymentRefund.sync({ force: false });

    console.log("✓ Database models synced successfully!");
  } catch (error) {
    console.error("✗ Error syncing database models:", error);
    throw error;
  }
}
