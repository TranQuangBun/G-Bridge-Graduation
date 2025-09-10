import React, { useState, useMemo } from "react";
import styles from "./PricingPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";

const planDefinitions = (t) => [
  {
    key: "free",
    name: t("pricingPage.plan.starterName"),
    tag: t("pricingPage.plan.freeTag"),
    monthly: 0,
    desc: t("pricingPage.plan.starterDesc"),
    features: [
      t("pricingPage.plan.feature.profile"),
      t("pricingPage.plan.feature.apply1"),
      t("pricingPage.plan.feature.basicEmailNotifications"),
      t("pricingPage.plan.feature.communityAccess"),
    ],
    outline: true,
  },
  {
    key: "pro",
    name: t("pricingPage.plan.proName"),
    tag: t("pricingPage.plan.popularTag"),
    monthly: 10,
    desc: t("pricingPage.plan.proDesc"),
    features: [
      t("pricingPage.plan.feature.unlimitedApply"),
      t("pricingPage.plan.feature.aiMatch"),
      t("pricingPage.plan.feature.advFilters"),
      t("pricingPage.plan.feature.prioritySupport"),
      t("pricingPage.plan.feature.export"),
    ],
    popular: true,
  },
  {
    key: "team",
    name: t("pricingPage.plan.teamName"),
    tag: t("pricingPage.plan.growthTag"),
    monthly: 15,
    desc: t("pricingPage.plan.teamDesc"),
    features: [
      t("pricingPage.plan.feature.teamMembers"),
      t("pricingPage.plan.feature.analytics"),
      t("pricingPage.plan.feature.sharedPool"),
      t("pricingPage.plan.feature.bulk"),
      t("pricingPage.plan.feature.roles"),
      t("pricingPage.plan.feature.prioritySearch"),
    ],
  },
  {
    key: "enterprise",
    name: t("pricingPage.plan.enterpriseName"),
    tag: t("pricingPage.plan.customTag"),
    monthly: 21,
    desc: t("pricingPage.plan.enterpriseDesc"),
    features: [
      t("pricingPage.plan.feature.unlimitedMembers"),
      t("pricingPage.plan.feature.successManager"),
      t("pricingPage.plan.feature.integrations"),
      t("pricingPage.plan.feature.securityReports"),
      t("pricingPage.plan.feature.sla"),
      t("pricingPage.plan.feature.earlyAccess"),
    ],
  },
];

export default function PricingPage() {
  const { t } = useLanguage();
  const [billing, setBilling] = useState("monthly");
  const [openPlan, setOpenPlan] = useState(null); // plan key for payment modal
  const [purchased, setPurchased] = useState({}); // { planKey: true }
  const [paymentTab, setPaymentTab] = useState("qr");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const YEARLY_DISCOUNT = 10; // percent
  const basePlans = useMemo(() => planDefinitions(t), [t]);
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
    setOpenPlan(planKey);
    setPaymentTab("qr");
    setError("");
  }

  function fakeComplete(planKey) {
    setProcessing(true);
    setError("");
    setTimeout(() => {
      setProcessing(false);
      setPurchased((prev) => ({ ...prev, [planKey]: true }));
      setOpenPlan(null);
    }, 1500);
  }

  function submitCard(e) {
    e.preventDefault();
    if (!card.number || !card.name || !card.exp || !card.cvc) {
      setError("Vui lòng nhập đầy đủ thông tin thẻ");
      return;
    }
    fakeComplete(openPlan);
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
                        <i>✓</i>
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
        {openPlan && currentPlan && (
          <div
            className={styles.paymentOverlay}
            onClick={() => !processing && setOpenPlan(null)}
          >
            <div
              className={styles.paymentModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.payHeader}>
                <h3>
                  {t("pricingPage.pay.payingFor")}: {currentPlan.name}
                </h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => !processing && setOpenPlan(null)}
                >
                  ×
                </button>
              </div>
              <div className={styles.payTabs}>
                <button
                  className={paymentTab === "qr" ? styles.tabActive : ""}
                  onClick={() => setPaymentTab("qr")}
                >
                  {t("pricingPage.pay.qrTab")}
                </button>
                <button
                  className={paymentTab === "card" ? styles.tabActive : ""}
                  onClick={() => setPaymentTab("card")}
                >
                  {t("pricingPage.pay.cardTab")}
                </button>
              </div>
              <div className={styles.payBody}>
                {paymentTab === "qr" && (
                  <div className={styles.qrSection}>
                    <div className={styles.qrBox}>
                      <div className={styles.fakeQr}></div>
                    </div>
                    <p className={styles.qrHint}>
                      {t("pricingPage.pay.qrHint")}{" "}
                      {currentPlan.displayPrice === 0
                        ? "0"
                        : `$${currentPlan.displayPrice}`}
                    </p>
                    <button
                      disabled={processing}
                      onClick={() => fakeComplete(currentPlan.key)}
                      className={styles.payConfirm}
                    >
                      {processing
                        ? t("pricingPage.pay.processing")
                        : t("pricingPage.pay.iPaid")}
                    </button>
                  </div>
                )}
                {paymentTab === "card" && (
                  <form className={styles.cardForm} onSubmit={submitCard}>
                    <label>
                      {t("pricingPage.pay.cardNumber")}
                      <input
                        value={card.number}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, number: e.target.value }))
                        }
                        placeholder="1111 2222 3333 4444"
                        maxLength={19}
                      />
                    </label>
                    <label>
                      {t("pricingPage.pay.cardName")}
                      <input
                        value={card.name}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, name: e.target.value }))
                        }
                        placeholder="NGUYEN VAN A"
                      />
                    </label>
                    <div className={styles.row2}>
                      <label>
                        {t("pricingPage.pay.cardExp")}
                        <input
                          value={card.exp}
                          onChange={(e) =>
                            setCard((c) => ({ ...c, exp: e.target.value }))
                          }
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </label>
                      <label>
                        {t("pricingPage.pay.cardCvc")}
                        <input
                          value={card.cvc}
                          onChange={(e) =>
                            setCard((c) => ({ ...c, cvc: e.target.value }))
                          }
                          placeholder="123"
                          maxLength={4}
                        />
                      </label>
                    </div>
                    {error && (
                      <div className={styles.err}>
                        {t("pricingPage.pay.needAll")}
                      </div>
                    )}
                    <button
                      disabled={processing}
                      className={styles.payConfirm}
                      type="submit"
                    >
                      {processing
                        ? t("pricingPage.pay.processing")
                        : t("pricingPage.pay.activate")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
