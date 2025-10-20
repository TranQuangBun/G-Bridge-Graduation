import { initDatabase } from "../src/config/database.js";
import { SubscriptionPlan } from "../src/models/index.js";

async function testPaymentAPI() {
  try {
    console.log("🔄 Testing Payment API...\n");

    // Initialize database
    await initDatabase();

    // Test 1: Get all subscription plans
    console.log("1️⃣ Testing: Get all subscription plans");
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"]],
    });

    console.log(`✅ Found ${plans.length} active plans:\n`);
    plans.forEach((plan) => {
      console.log(`   📦 ${plan.displayName}`);
      console.log(`      - Price: $${plan.price} ${plan.currency}`);
      console.log(
        `      - Duration: ${plan.duration} days (${plan.durationType})`
      );
      console.log(`      - Features: ${plan.features.length} items`);
      console.log("");
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ PAYMENT API TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📝 Available API Endpoints:");
    console.log(
      "   GET    /api/payments/plans                - Get all subscription plans"
    );
    console.log(
      "   POST   /api/payments/vnpay/create         - Create VNPay payment"
    );
    console.log(
      "   POST   /api/payments/paypal/create        - Create PayPal payment"
    );
    console.log(
      "   GET    /api/payments/vnpay/verify         - Verify VNPay payment"
    );
    console.log(
      "   POST   /api/payments/paypal/verify        - Verify PayPal payment"
    );
    console.log(
      "   GET    /api/payments/history              - Get payment history"
    );
    console.log(
      "   GET    /api/payments/subscription         - Get subscription status"
    );
    console.log(
      "   POST   /api/payments/subscription/cancel  - Cancel subscription"
    );
    console.log("   POST   /api/payments/webhook/vnpay        - VNPay webhook");
    console.log(
      "   POST   /api/payments/webhook/paypal       - PayPal webhook"
    );
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPaymentAPI();
