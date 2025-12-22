/**
 * Subscription Plans Seeding Script
 * 
 * This script seeds subscription plans data:
 * - Free Plan
 * - Pro Plan
 * - Team Plan
 * - Enterprise Plan
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
  {
    id: 1,
    name: "free",
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
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "pro",
    displayName: "Pro",
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
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "team",
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
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 4,
    name: "enterprise",
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
    isActive: true,
    sortOrder: 4,
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
      // Check if plan already exists
      const existingPlan = await subscriptionPlanRepository.findOne({
        where: { id: planData.id }
      });

      if (existingPlan) {
        // Update existing plan
        Object.assign(existingPlan, planData);
        await subscriptionPlanRepository.save(existingPlan);
        updatedCount++;
        console.log(`  ✓ Updated plan: ${planData.displayName} (ID: ${planData.id})`);
      } else {
        // Create new plan
        const newPlan = subscriptionPlanRepository.create(planData);
        await subscriptionPlanRepository.save(newPlan);
        createdCount++;
        console.log(`  ✓ Created plan: ${planData.displayName} (ID: ${planData.id})`);
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

