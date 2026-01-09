/**
 * Subscription Plans Seeding Script
 * 
 * This script seeds subscription plans data for both Client and Interpreter roles:
 * - Free Plan (for both roles)
 * - Pro Plan (for both roles)
 * - Team Plan (for both roles)
 * - Enterprise Plan (for both roles)
 * 
 * IMPORTANT: This script can be run multiple times safely (it checks for existing plans)
 * 
 * Usage: npm run seed:subscriptions
 */

import dotenv from "dotenv";
import { AppDataSource } from "../src/config/DataSource.js";
import { SubscriptionPlan, DurationType } from "../src/entities/SubscriptionPlan.js";

// Load environment variables
dotenv.config();

const subscriptionPlans = [
  // Interpreter Plans
  {
    id: 1,
    name: "free-interpreter",
    displayName: "Free",
    description: "Perfect for getting started with basic features",
    price: 0.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Create interpreter profile",
      "Apply to 1 job per month",
      "Basic email notifications",
      "Community access"
    ],
    maxInterpreterViews: 5,
    maxJobPosts: 1,
    allowedRoles: ["interpreter"],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "pro-interpreter",
    displayName: "Professional",
    description: "Most popular plan for professional interpreters",
    price: 10.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Unlimited job applications",
      "AI-powered job matching",
      "Advanced search filters",
      "Priority customer support",
      "Export capabilities"
    ],
    maxInterpreterViews: -1, // -1 means unlimited
    maxJobPosts: -1,
    allowedRoles: ["interpreter"],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "team-interpreter",
    displayName: "Team",
    description: "Great for growing interpreter teams",
    price: 15.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Up to 5 team members",
      "Analytics dashboard",
      "Shared interpreter pool",
      "Bulk job posting",
      "Team roles & permissions",
      "Priority in search results"
    ],
    maxInterpreterViews: -1,
    maxJobPosts: -1,
    allowedRoles: ["interpreter"],
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 4,
    name: "enterprise-interpreter",
    displayName: "Enterprise",
    description: "Custom solution for large organizations",
    price: 21.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Unlimited team members",
      "Dedicated success manager",
      "Custom integrations",
      "Advanced security & compliance",
      "SLA guarantee",
      "Early access to new features"
    ],
    maxInterpreterViews: -1,
    maxJobPosts: -1,
    allowedRoles: ["interpreter"],
    isActive: true,
    sortOrder: 4,
  },
  // Client Plans
  {
    id: 5,
    name: "free-client",
    displayName: "Free",
    description: "Perfect to start with basic features",
    price: 0.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Create organization profile",
      "Post 1 job per month",
      "View 5 interpreter profiles per month",
      "Basic email notifications"
    ],
    maxInterpreterViews: 5,
    maxJobPosts: 1,
    allowedRoles: ["client"],
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 6,
    name: "pro-client",
    displayName: "Professional",
    description: "Most popular service package for businesses",
    price: 10.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Unlimited job posts",
      "Unlimited profile views",
      "AI-powered job matching",
      "Advanced search filters",
      "Priority customer support"
    ],
    maxInterpreterViews: -1,
    maxJobPosts: -1,
    allowedRoles: ["client"],
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 7,
    name: "team-client",
    displayName: "Team",
    description: "Great for developing recruitment teams",
    price: 15.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Up to 5 team members",
      "Analytics dashboard",
      "Bulk job posting",
      "Team roles & permissions",
      "Priority in search results"
    ],
    maxInterpreterViews: -1,
    maxJobPosts: -1,
    allowedRoles: ["client"],
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 8,
    name: "enterprise-client",
    displayName: "Enterprise",
    description: "Custom solution for large organizations",
    price: 21.00,
    currency: "USD",
    duration: 1,
    durationType: DurationType.MONTHLY,
    features: [
      "Unlimited team members",
      "Dedicated success manager",
      "Custom integrations",
      "Advanced security & compliance",
      "SLA guarantee",
      "Early access to new features"
    ],
    maxInterpreterViews: -1,
    maxJobPosts: -1,
    allowedRoles: ["client"],
    isActive: true,
    sortOrder: 8,
  },
];

async function seedSubscriptionPlans() {
  try {
    console.log("🌱 Starting to seed subscription plans...\n");

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("✓ Database connected\n");

    const subscriptionPlanRepository = AppDataSource.getRepository(SubscriptionPlan);

    console.log("📋 Seeding Subscription Plans...");
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const planData of subscriptionPlans) {
      // First, try to find by name (new format with suffix)
      let existingPlan = await subscriptionPlanRepository.findOne({
        where: { name: planData.name }
      });

      // If not found, try to find by ID (for old plans)
      if (!existingPlan && planData.id) {
        existingPlan = await subscriptionPlanRepository.findOne({
          where: { id: planData.id }
        });
      }

      // If still not found, try to find by old name pattern (without suffix)
      if (!existingPlan) {
        const oldName = planData.name.split("-")[0]; // e.g., "free-interpreter" -> "free"
        existingPlan = await subscriptionPlanRepository.findOne({
          where: { name: oldName }
        });
      }

      if (existingPlan) {
        // Update existing plan with all new data
        // Ensure allowedRoles is properly set (TypeORM will serialize array to JSON)
        existingPlan.name = planData.name;
        existingPlan.displayName = planData.displayName;
        existingPlan.description = planData.description;
        existingPlan.price = planData.price;
        existingPlan.currency = planData.currency;
        existingPlan.duration = planData.duration;
        existingPlan.durationType = planData.durationType;
        existingPlan.features = planData.features;
        existingPlan.maxInterpreterViews = planData.maxInterpreterViews;
        existingPlan.maxJobPosts = planData.maxJobPosts;
        existingPlan.allowedRoles = planData.allowedRoles; // Array will be serialized to JSON
        existingPlan.isActive = planData.isActive;
        existingPlan.sortOrder = planData.sortOrder;
        
        await subscriptionPlanRepository.save(existingPlan);
        updatedCount++;
        console.log(`  ✓ Updated plan: ${planData.displayName} (${planData.name}) - Roles: ${planData.allowedRoles?.join(", ") || "all"}`);
      } else {
        // Create new plan
        const newPlan = subscriptionPlanRepository.create(planData);
        await subscriptionPlanRepository.save(newPlan);
        createdCount++;
        console.log(`  ✓ Created plan: ${planData.displayName} (${planData.name}) - Roles: ${planData.allowedRoles?.join(", ") || "all"}`);
      }
    }

    console.log(`\n✅ Seeding completed!`);
    console.log(`   Created: ${createdCount} plans`);
    console.log(`   Updated: ${updatedCount} plans`);
    console.log(`   Skipped: ${skippedCount} plans\n`);

    // Verify by listing all plans
    const allPlans = await subscriptionPlanRepository.find({
      order: { sortOrder: "ASC" }
    });
    console.log(`📊 Total subscription plans in database: ${allPlans.length}`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.displayName} (${plan.name}): $${plan.price}/${plan.durationType}`);
    });

  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("\n✓ Database connection closed");
    }
  }
}

// Run the seed function
seedSubscriptionPlans()
  .then(() => {
    console.log("\n🎉 Subscription plans seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Subscription plans seeding failed:", error);
    process.exit(1);
  });

