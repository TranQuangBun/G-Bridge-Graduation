import React, { useState, useMemo, useEffect } from "react";
import styles from "./PricingPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import paymentService from "../../services/paymentService";
import subscriptionPlanService from "../../services/subscriptionPlanService";
import toastService from "../../services/toastService";

// Plans are now loaded from database via seed-subscription-plans.js
// No hardcoded plans needed

export default function PricingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billing, setBilling] = useState("monthly");
  const [openPlan, setOpenPlan] = useState(null); // plan key for payment modal
  const [purchased, setPurchased] = useState({}); // { planKey: true }
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null); // 'paypal', 'vnpay', or 'momo'
  const [processing, setProcessing] = useState(false);
  const [, setError] = useState("");
  const [plansFromDB, setPlansFromDB] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const YEARLY_DISCOUNT = 10; // percent

  // Get user role, default to 'interpreter' if not authenticated
  const userRole = user?.role || "interpreter";

  // Load plans from database
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        // subscriptionPlanService.getActivePlans() returns response.data (server JSON response)
        // Server format: { success: true, data: [...], message: "..." }
        // Or if paginated: { success: true, data: [...], pagination: {...} }
        const serverResponse = await subscriptionPlanService.getActivePlans();
        let plansData = [];
        
        if (serverResponse && serverResponse.success && serverResponse.data) {
          // Check if data is array or object with plans property
          if (Array.isArray(serverResponse.data)) {
            plansData = serverResponse.data;
          } else if (serverResponse.data.plans && Array.isArray(serverResponse.data.plans)) {
            plansData = serverResponse.data.plans;
          }
        }
        
        console.log("Loaded plans from DB:", plansData);
        
        // Sort by sortOrder
        const sortedPlans = plansData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setPlansFromDB(sortedPlans);
      } catch (error) {
        console.error("Failed to load plans from database:", error);
        toastService.error(t("pricingPage.pay.errors.loadFailed"));
        // Fallback to empty array
        setPlansFromDB([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [t]);

  // Map database plans to frontend format
  const mapPlanFromDB = (dbPlan, t) => {
    // Extract key from plan name (e.g., "free-interpreter" -> "free", "free-client" -> "free")
    // Also handle old plans without suffix (e.g., "free" -> "free")
    const key = dbPlan.name.includes("-") 
      ? dbPlan.name.split("-")[0] 
      : dbPlan.name;

    // Parse features from JSON string or array
    let features = [];
    if (typeof dbPlan.features === "string") {
      try {
        features = JSON.parse(dbPlan.features);
      } catch (e) {
        features = [];
      }
    } else if (Array.isArray(dbPlan.features)) {
      features = dbPlan.features;
    }

    // Parse allowedRoles from JSON string or array
    let allowedRoles = [];
    console.log(`Plan ${dbPlan.name} - raw allowedRoles:`, dbPlan.allowedRoles, typeof dbPlan.allowedRoles);
    
    if (dbPlan.allowedRoles !== null && dbPlan.allowedRoles !== undefined) {
      if (typeof dbPlan.allowedRoles === "string") {
        try {
          allowedRoles = JSON.parse(dbPlan.allowedRoles);
          console.log(`Plan ${dbPlan.name} - parsed allowedRoles from string:`, allowedRoles);
        } catch (e) {
          console.warn(`Failed to parse allowedRoles for plan ${dbPlan.name}:`, e);
          allowedRoles = [];
        }
      } else if (Array.isArray(dbPlan.allowedRoles)) {
        allowedRoles = dbPlan.allowedRoles;
        console.log(`Plan ${dbPlan.name} - allowedRoles is array:`, allowedRoles);
      }
    } else {
      console.log(`Plan ${dbPlan.name} - allowedRoles is null/undefined`);
    }

    // Map tags based on plan key
    const tagMap = {
      free: t("pricingPage.plan.freeTag"),
      pro: t("pricingPage.plan.popularTag"),
      team: t("pricingPage.plan.growthTag"),
      enterprise: t("pricingPage.plan.customTag"),
    };

    return {
      id: dbPlan.id,
      key,
      name: dbPlan.displayName || dbPlan.name,
      tag: tagMap[key] || "",
      monthly: parseFloat(dbPlan.price) || 0,
      desc: dbPlan.description || "",
      features: features,
      popular: key === "pro",
      outline: key === "free",
      allowedRoles: allowedRoles.length > 0 ? allowedRoles : [],
    };
  };

  // Use database plans filtered by user role
  const basePlans = useMemo(() => {
    if (plansFromDB.length > 0) {
      const mappedPlans = plansFromDB.map((plan) => mapPlanFromDB(plan, t));
      console.log("Mapped plans:", mappedPlans);
      console.log("User role:", userRole);
      
      // Filter plans based on user role
      const filteredPlans = mappedPlans.filter((plan) => {
        // If plan has allowedRoles, check if user role is included
        if (plan.allowedRoles && plan.allowedRoles.length > 0) {
          const isAllowed = plan.allowedRoles.includes(userRole);
          console.log(`Plan ${plan.name} (${plan.key}): allowedRoles=${JSON.stringify(plan.allowedRoles)}, userRole=${userRole}, isAllowed=${isAllowed}`);
          return isAllowed;
        }
        // If no allowedRoles specified, infer from plan name
        // Plans with name ending in "-client" are for clients, "-interpreter" for interpreters
        const planName = plan.key || plan.name || "";
        if (planName.includes("client")) {
          const isClientPlan = userRole === "client";
          console.log(`Plan ${plan.name} (${plan.key}): No allowedRoles, inferred from name (contains "client"), userRole=${userRole}, isAllowed=${isClientPlan}`);
          return isClientPlan;
        } else if (planName.includes("interpreter")) {
          const isInterpreterPlan = userRole === "interpreter";
          console.log(`Plan ${plan.name} (${plan.key}): No allowedRoles, inferred from name (contains "interpreter"), userRole=${userRole}, isAllowed=${isInterpreterPlan}`);
          return isInterpreterPlan;
        }
        // If no allowedRoles and can't infer from name, don't show (safety measure)
        console.log(`Plan ${plan.name} (${plan.key}): No allowedRoles and can't infer from name, skipping`);
        return false;
      });
      
      console.log("Filtered plans:", filteredPlans);
      return filteredPlans;
    }
    
    // If no plans from DB, return empty array (will show loading or empty state)
    console.log("No plans from DB");
    return [];
  }, [plansFromDB, t, userRole]);
  const plans = useMemo(
    () =>
      basePlans.map((p) => {
        if (billing === "monthly") {
          return {
            ...p,
            displayPrice: p.monthly,
            priceSuffix: "mo",
            discountPercent: 0,
          };
        }
        // yearly total = monthly * 12 with discount
        const fullYear = p.monthly * 12;
        const discounted = Math.round(fullYear * (1 - YEARLY_DISCOUNT / 100));
        return {
          ...p,
          displayPrice: discounted,
          fullYear,
          monthlyEquivalent: p.monthly,
          priceSuffix: "yr",
          discountPercent: p.monthly > 0 ? YEARLY_DISCOUNT : 0,
        };
      }),
    [billing, basePlans]
  );

  function openCheckout(planKey) {
    if (purchased[planKey]) return; // already bought

    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    if (!token || !isAuthenticated) {
      toastService.error(t("pricingPage.pay.errors.loginRequired"));
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    // Get the plan
    const plan = plans.find((p) => p.key === planKey);
    if (!plan) {
      toastService.error("Plan not found");
      return;
    }

    // Validate role compatibility
    if (plan.allowedRoles && plan.allowedRoles.length > 0) {
      if (!plan.allowedRoles.includes(userRole)) {
        toastService.error(
          userRole === "client"
            ? "This plan is only available for interpreters. Please select a plan suitable for clients."
            : "This plan is only available for clients. Please select a plan suitable for interpreters."
        );
        return;
      }
    }

    // Free plan cannot be paid via payment gateway
    if (plan.displayPrice === 0 || plan.monthly === 0) {
      toastService.error(
        "Free plan cannot be purchased via payment gateway. Please contact support to activate free plan."
      );
      return;
    }

    setOpenPlan(planKey);
    setShowMethodModal(true);
    setSelectedMethod(null);
    setError("");
  }

  async function selectPaymentMethod(method) {
    setSelectedMethod(method);
    setShowMethodModal(false);
    setProcessing(true);

    // Immediately process payment after selecting method
    await processPayment(method);
  }

  function closePayment() {
    setOpenPlan(null);
    setShowMethodModal(false);
    setSelectedMethod(null);
    setError("");
  }

  async function processPayment(method = null) {
    const paymentMethod = method || selectedMethod;
    if (!currentPlan || !paymentMethod) return;

    setError("");

    try {
      // Get plan ID from current plan (from database) or fallback to key-based mapping
      let planId = currentPlan.id;
      
      // Fallback: if no ID, use key-based mapping
      if (!planId) {
        const planIdMap = {
          free: 1,
          pro: 2,
          team: 3,
          enterprise: 4,
        };
        planId = planIdMap[currentPlan.key];
      }

      if (!planId) {
        throw new Error("Invalid plan selected");
      }

      if (paymentMethod === "vnpay") {
        const response = await paymentService.createVNPayPayment(planId);
        if (response.success && response.data?.paymentUrl) {
          // Redirect to VNPay payment page
          window.location.href = response.data.paymentUrl;
        } else {
          throw new Error("Failed to create VNPay payment URL");
        }
      } else if (paymentMethod === "momo") {
        const response = await paymentService.createMoMoPayment(planId);
        if (response.success && response.data?.paymentUrl) {
          // Redirect to MoMo payment page
          window.location.href = response.data.paymentUrl;
        } else {
          throw new Error("Failed to create MoMo payment URL");
        }
      } else if (paymentMethod === "paypal") {
        const response = await paymentService.createPayPalPayment(planId);
        if (response.success && response.data) {
          // For PayPal, you would typically integrate PayPal SDK here
          // For now, show success message
          toastService.success("PayPal payment created. Redirecting...");
          setTimeout(() => {
            setPurchased((prev) => ({ ...prev, [currentPlan.key]: true }));
            closePayment();
          }, 1500);
        } else {
          throw new Error("Failed to create PayPal payment");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
      toastService.error(error.message || t("pricingPage.pay.errors.paymentFailed"));
    } finally {
      setProcessing(false);
    }
  }

  const currentPlan = plans.find((p) => p.key === openPlan);

  return (
    <MainLayout>
      <div className={styles.pricingPageRoot}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.badge}>{t("pricingPage.heroBadge")}</div>
            <h1 className={styles.title}>{t("pricingPage.heroTitle")}</h1>
            <p className={styles.subtitle}>{t("pricingPage.heroSubtitle")}</p>
            <div className={styles.toggleRow}>
              <div className={styles.billingToggle}>
                <button
                  className={billing === "monthly" ? styles.active : ""}
                  onClick={() => setBilling("monthly")}
                >
                  {t("pricingPage.monthly")}
                </button>
                <button
                  className={billing === "yearly" ? styles.active : ""}
                  onClick={() => setBilling("yearly")}
                >
                  {t("pricingPage.yearly")}
                </button>
              </div>
              {billing === "yearly" && (
                <span className={styles.saveBadge}>
                  {t("pricingPage.save")}
                </span>
              )}
            </div>
          </div>

          {loadingPlans ? (
            <div className={styles.loadingContainer}>
              <p>Đang tải danh sách gói dịch vụ...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className={styles.loadingContainer}>
              <p>Không có gói dịch vụ nào phù hợp với vai trò của bạn. Vui lòng liên hệ quản trị viên.</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.5rem" }}>
                (Debug: plansFromDB.length = {plansFromDB.length}, userRole = {userRole})
              </p>
            </div>
          ) : (
            <div className={styles.plansGrid}>
              {plans.map((plan) => {
              const isBought = purchased[plan.key];
              return (
                <div
                  key={plan.key}
                  className={
                    plan.popular
                      ? `${styles.planCard} ${styles.popular}`
                      : styles.planCard
                  }
                >
                  <div className={styles.planHeader}>
                    <span className={styles.planTag}>{plan.tag}</span>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.priceWrap}>
                      <span className={styles.price}>
                        {plan.displayPrice === 0
                          ? "Free"
                          : `$${plan.displayPrice}`}
                      </span>
                      {plan.displayPrice !== 0 && (
                        <span className={styles.per}>/ {plan.priceSuffix}</span>
                      )}
                      {billing === "yearly" && plan.discountPercent > 0 && (
                        <span className={styles.discountNote}>
                          - {plan.discountPercent}%
                        </span>
                      )}
                    </div>
                    <p className={styles.desc}>{plan.desc}</p>
                  </div>
                  <ul className={styles.featureList}>
                    {plan.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <i></i>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isBought}
                    onClick={() => openCheckout(plan.key)}
                    className={
                      plan.outline
                        ? `${styles.ctaBtn} ${styles.outline}`
                        : styles.ctaBtn
                    }
                    style={
                      isBought
                        ? { opacity: 0.55, cursor: "default" }
                        : undefined
                    }
                  >
                    {isBought
                      ? t("pricingPage.plan.ctaPurchased")
                      : t("pricingPage.plan.ctaGetStarted")}
                  </button>
                </div>
              );
            })}
            </div>
          )}

          <div className={styles.comparison}>
            <h2 className={styles.comparisonTitle}>
              {t("pricingPage.whyTitle")}
            </h2>
            <div className={styles.comparisonGrid}>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.match.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.match.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.match.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.team.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.team.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.team.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.scale.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.scale.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.scale.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.trust.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.trust.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.trust.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection Modal */}
        {openPlan && showMethodModal && currentPlan && (
          <div
            className={styles.paymentOverlay}
            onClick={() => !processing && closePayment()}
          >
            <div
              className={styles.methodModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.methodHeader}>
                <h3>Chọn phương thức thanh toán</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => closePayment()}
                >
                  ×
                </button>
              </div>
              <div className={styles.methodBody}>
                <p className={styles.methodDesc}>
                  Thanh toán cho gói: <strong>{currentPlan.name}</strong> -
                  {currentPlan.displayPrice === 0
                    ? " Free"
                    : ` $${currentPlan.displayPrice}`}
                </p>
                <div className={styles.methodOptions}>
                  <button
                    className={styles.methodCard}
                    onClick={() => selectPaymentMethod("paypal")}
                  >
                    <div className={styles.methodIcon}>
                      <svg viewBox="0 0 124 33" fill="none">
                        <path
                          d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"
                          fill="#253b80"
                        />
                        <path
                          d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.938-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.561.482z"
                          fill="#179bd7"
                        />
                        <path
                          d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"
                          fill="#253b80"
                        />
                        <path
                          d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z"
                          fill="#179bd7"
                        />
                        <path
                          d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z"
                          fill="#222d65"
                        />
                        <path
                          d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z"
                          fill="#253b80"
                        />
                      </svg>
                    </div>
                    <div className={styles.methodInfo}>
                      <h4>PayPal</h4>
                      <p>Thanh toán quốc tế an toàn</p>
                    </div>
                  </button>

                  <button
                    className={styles.methodCard}
                    onClick={() => selectPaymentMethod("vnpay")}
                  >
                    <div className={styles.methodIcon}>
                      <svg viewBox="0 0 200 80" fill="none">
                        <rect width="200" height="80" rx="8" fill="#0066CC" />
                        <text
                          x="100"
                          y="35"
                          fontSize="24"
                          fontWeight="bold"
                          fill="white"
                          textAnchor="middle"
                        >
                          VNPAY
                        </text>
                        <text
                          x="100"
                          y="55"
                          fontSize="12"
                          fill="white"
                          textAnchor="middle"
                          opacity="0.9"
                        >
                          Ví điện tử Việt Nam
                        </text>
                      </svg>
                    </div>
                    <div className={styles.methodInfo}>
                      <h4>VNPay</h4>
                      <p>Ví điện tử, ATM, QR Code</p>
                    </div>
                  </button>

                  <button
                    className={styles.methodCard}
                    onClick={() => selectPaymentMethod("momo")}
                  >
                    <div className={styles.methodIcon}>
                      <svg viewBox="0 0 200 80" fill="none">
                        <rect width="200" height="80" rx="8" fill="#A50064" />
                        <text
                          x="100"
                          y="35"
                          fontSize="24"
                          fontWeight="bold"
                          fill="white"
                          textAnchor="middle"
                        >
                          MOMO
                        </text>
                        <text
                          x="100"
                          y="55"
                          fontSize="12"
                          fill="white"
                          textAnchor="middle"
                          opacity="0.9"
                        >
                          Ví điện tử MoMo
                        </text>
                      </svg>
                    </div>
                    <div className={styles.methodInfo}>
                      <h4>MoMo</h4>
                      <p>Ví điện tử MoMo, QR Code</p>
                    </div>
                  </button>
                </div>
                {processing && (
                  <div className={styles.processingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Đang chuyển hướng đến trang thanh toán...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
