import React from "react";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import styles from "./CookiePolicyPage.module.css";

const CookiePolicyPage = () => {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t("cookiePolicy.title") || "Cookie Policy"}
          </h1>
          <p className={styles.lastUpdated}>
            {t("cookiePolicy.lastUpdated") || "Last Updated: January 2025"}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.introduction.title") || "1. What Are Cookies?"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.introduction.content") ||
                "Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.howWeUse.title") || "2. How We Use Cookies"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.howWeUse.content") ||
                "G-Bridge uses cookies and similar tracking technologies to:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("cookiePolicy.howWeUse.use1") ||
                  "Remember your preferences and settings"}
              </li>
              <li>
                {t("cookiePolicy.howWeUse.use2") ||
                  "Keep you logged in to your account"}
              </li>
              <li>
                {t("cookiePolicy.howWeUse.use3") ||
                  "Analyze how you use our platform to improve our services"}
              </li>
              <li>
                {t("cookiePolicy.howWeUse.use4") ||
                  "Provide personalized content and recommendations"}
              </li>
              <li>
                {t("cookiePolicy.howWeUse.use5") ||
                  "Ensure platform security and prevent fraud"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.types.title") || "3. Types of Cookies We Use"}
            </h2>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.types.essential") || "Essential Cookies"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.types.essentialContent") ||
                "These cookies are necessary for the platform to function properly. They enable core functionality such as security, network management, and accessibility."}
            </p>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.types.functional") || "Functional Cookies"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.types.functionalContent") ||
                "These cookies allow the platform to remember choices you make (such as language preferences) and provide enhanced, personalized features."}
            </p>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.types.analytics") || "Analytics Cookies"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.types.analyticsContent") ||
                "These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously."}
            </p>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.types.marketing") || "Marketing Cookies"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.types.marketingContent") ||
                "These cookies are used to deliver relevant advertisements and track campaign effectiveness. They may be set by our advertising partners."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.thirdParty.title") || "4. Third-Party Cookies"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.thirdParty.content") ||
                "Some cookies are placed by third-party services that appear on our pages. These may include:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("cookiePolicy.thirdParty.third1") ||
                  "Payment processing services"}
              </li>
              <li>
                {t("cookiePolicy.thirdParty.third2") ||
                  "Analytics and performance monitoring tools"}
              </li>
              <li>
                {t("cookiePolicy.thirdParty.third3") ||
                  "Social media integration features"}
              </li>
              <li>
                {t("cookiePolicy.thirdParty.third4") ||
                  "Advertising and marketing platforms"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.management.title") || "5. Managing Cookies"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.management.content") ||
                "You can control and manage cookies in several ways:"}
            </p>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.management.browser") || "Browser Settings"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.management.browserContent") ||
                "Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or alert you when cookies are being sent."}
            </p>
            <h3 className={styles.subsectionTitle}>
              {t("cookiePolicy.management.platform") || "Platform Settings"}
            </h3>
            <p className={styles.paragraph}>
              {t("cookiePolicy.management.platformContent") ||
                "You can manage your cookie preferences through your account settings on G-Bridge. Note that disabling certain cookies may affect platform functionality."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.impact.title") || "6. Impact of Disabling Cookies"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.impact.content") ||
                "If you choose to disable cookies, some features of G-Bridge may not function properly. Essential cookies cannot be disabled as they are necessary for the platform to operate."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.updates.title") || "7. Updates to This Cookie Policy"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.updates.content") ||
                "We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("cookiePolicy.contact.title") || "8. Contact Us"}
            </h2>
            <p className={styles.paragraph}>
              {t("cookiePolicy.contact.content") ||
                "If you have questions about our use of cookies, please contact us at:"}
            </p>
            <p className={styles.contactInfo}>
              <strong>Email:</strong> privacy@g-bridge.com<br />
              <strong>Address:</strong> 123 ABC Street, XYZ District, Ho Chi Minh City, Vietnam
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default CookiePolicyPage;

