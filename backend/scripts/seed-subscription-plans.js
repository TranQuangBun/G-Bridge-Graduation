import { AppDataSource } from "../src/config/DataSource.js";

async function seedSubscriptionPlans() {
  try {
    console.log("🌱 Starting to seed subscription plans...");

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("✓ Database connected");

    // Check if table exists and has data
    try {
      const result = await AppDataSource.query(
        "SELECT COUNT(*) as count FROM subscription_plans"
      );

      if (result[0].count > 0) {
        console.log(
          `✓ Found ${result[0].count} existing subscription plans - skipping seed`
        );
        const plans = await AppDataSource.query(
          "SELECT * FROM subscription_plans ORDER BY sortOrder"
        );
        console.log("\n📋 Existing Subscription Plans:");
        plans.forEach((plan) => {
          console.log(
            `  - ${plan.displayName} (ID: ${plan.id}): $${plan.price}/${plan.duration} month(s)`
          );
        });
        await AppDataSource.destroy();
        process.exit(0);
      }
    } catch (error) {
      console.log("📋 No existing plans found, creating new ones...");
    }

    // Create subscription plans using raw SQL
    const plans = [
      {
        name: "free",
        displayName: "Free",
        description: "Perfect for getting started with basic features",
        price: 0.0,
        currency: "USD",
        duration: 1,
        durationType: "monthly",
        features: JSON.stringify([
          "Create interpreter profile",
          "Apply to 1 job per month",
          "Basic email notifications",
          "Community access",
        ]),
        maxInterpreterViews: 5,
        maxJobPosts: 1,
        isActive: 1,
        sortOrder: 1,
      },
      {
        name: "pro",
        displayName: "Pro",
        description: "Most popular plan for professional interpreters",
        price: 10.0,
        currency: "USD",
        duration: 1,
        durationType: "monthly",
        features: JSON.stringify([
          "Unlimited job applications",
          "AI-powered job matching",
          "Advanced search filters",
          "Priority customer support",
          "Export capabilities",
        ]),
        maxInterpreterViews: -1,
        maxJobPosts: -1,
        isActive: 1,
        sortOrder: 2,
      },
      {
        name: "team",
        displayName: "Team",
        description: "Great for growing interpreter teams",
        price: 15.0,
        currency: "USD",
        duration: 1,
        durationType: "monthly",
        features: JSON.stringify([
          "Up to 5 team members",
          "Analytics dashboard",
          "Shared interpreter pool",
          "Bulk job posting",
          "Team roles & permissions",
          "Priority in search results",
        ]),
        maxInterpreterViews: -1,
        maxJobPosts: -1,
        isActive: 1,
        sortOrder: 3,
      },
      {
        name: "enterprise",
        displayName: "Enterprise",
        description: "Custom solution for large organizations",
        price: 21.0,
        currency: "USD",
        duration: 1,
        durationType: "monthly",
        features: JSON.stringify([
          "Unlimited team members",
          "Dedicated success manager",
          "Custom integrations",
          "Advanced security & compliance",
          "SLA guarantee",
          "Early access to new features",
        ]),
        maxInterpreterViews: -1,
        maxJobPosts: -1,
        isActive: 1,
        sortOrder: 4,
      },
    ];

    for (const plan of plans) {
      await AppDataSource.query(
        `INSERT INTO subscription_plans 
        (name, displayName, description, price, currency, duration, durationType, features, maxInterpreterViews, maxJobPosts, isActive, sortOrder, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          plan.name,
          plan.displayName,
          plan.description,
          plan.price,
          plan.currency,
          plan.duration,
          plan.durationType,
          plan.features,
          plan.maxInterpreterViews,
          plan.maxJobPosts,
          plan.isActive,
          plan.sortOrder,
        ]
      );
    }

    console.log(`✓ Created ${plans.length} subscription plans`);

    const createdPlans = await AppDataSource.query(
      "SELECT * FROM subscription_plans ORDER BY sortOrder"
    );

    console.log("\n📋 Subscription Plans:");
    createdPlans.forEach((plan) => {
      console.log(
        `  - ${plan.displayName} (ID: ${plan.id}): $${plan.price}/${plan.duration} month(s)`
      );
    });

    console.log("\n✅ Seeding completed successfully!");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
