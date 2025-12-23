import React from "react";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import styles from "./TermsOfServicePage.module.css";

const TermsOfServicePage = () => {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t("termsOfService.title") || "Terms of Service"}
          </h1>
          <p className={styles.lastUpdated}>
            {t("termsOfService.lastUpdated") || "Last Updated: January 2025"}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.acceptance.title") || "1. Acceptance of Terms"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.acceptance.content") ||
                "By accessing and using G-Bridge, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.description.title") || "2. Platform Description"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.description.content") ||
                "G-Bridge is an online platform that connects professional interpreters with clients seeking interpretation services. We facilitate job postings, applications, bookings, and communication between users."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.userAccounts.title") || "3. User Accounts"}
            </h2>
            <h3 className={styles.subsectionTitle}>
              {t("termsOfService.userAccounts.registration") || "Registration"}
            </h3>
            <ul className={styles.list}>
              <li>
                {t("termsOfService.userAccounts.reg1") ||
                  "You must provide accurate, current, and complete information during registration"}
              </li>
              <li>
                {t("termsOfService.userAccounts.reg2") ||
                  "You are responsible for maintaining the confidentiality of your account credentials"}
              </li>
              <li>
                {t("termsOfService.userAccounts.reg3") ||
                  "You must be at least 18 years old to create an account"}
              </li>
              <li>
                {t("termsOfService.userAccounts.reg4") ||
                  "You agree to notify us immediately of any unauthorized use of your account"}
              </li>
            </ul>
            <h3 className={styles.subsectionTitle}>
              {t("termsOfService.userAccounts.responsibilities") || "User Responsibilities"}
            </h3>
            <ul className={styles.list}>
              <li>
                {t("termsOfService.userAccounts.resp1") ||
                  "Provide accurate professional credentials and qualifications"}
              </li>
              <li>
                {t("termsOfService.userAccounts.resp2") ||
                  "Conduct yourself professionally in all interactions"}
              </li>
              <li>
                {t("termsOfService.userAccounts.resp3") ||
                  "Comply with all applicable laws and regulations"}
              </li>
              <li>
                {t("termsOfService.userAccounts.resp4") ||
                  "Respect the intellectual property rights of others"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.prohibited.title") || "4. Prohibited Activities"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.prohibited.content") ||
                "You agree not to:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("termsOfService.prohibited.pro1") ||
                  "Post false, misleading, or fraudulent information"}
              </li>
              <li>
                {t("termsOfService.prohibited.pro2") ||
                  "Harass, abuse, or harm other users"}
              </li>
              <li>
                {t("termsOfService.prohibited.pro3") ||
                  "Circumvent payment systems or engage in fee avoidance"}
              </li>
              <li>
                {t("termsOfService.prohibited.pro4") ||
                  "Use the platform for illegal purposes"}
              </li>
              <li>
                {t("termsOfService.prohibited.pro5") ||
                  "Interfere with or disrupt the platform's operation"}
              </li>
              <li>
                {t("termsOfService.prohibited.pro6") ||
                  "Attempt to gain unauthorized access to the platform"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.payments.title") || "5. Payments and Fees"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.payments.content") ||
                "G-Bridge may charge fees for certain services, including but not limited to:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("termsOfService.payments.fee1") ||
                  "Premium subscription plans for enhanced features"}
              </li>
              <li>
                {t("termsOfService.payments.fee2") ||
                  "Transaction fees for job bookings and payments"}
              </li>
              <li>
                {t("termsOfService.payments.fee3") ||
                  "Featured job listings and promotional services"}
              </li>
            </ul>
            <p className={styles.paragraph}>
              {t("termsOfService.payments.refund") ||
                "All fees are non-refundable unless otherwise stated. Refund requests will be evaluated on a case-by-case basis."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.intellectualProperty.title") || "6. Intellectual Property"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.intellectualProperty.content") ||
                "All content on G-Bridge, including text, graphics, logos, and software, is the property of G-Bridge or its licensors and is protected by copyright and other intellectual property laws."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.disclaimers.title") || "7. Disclaimers"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.disclaimers.content") ||
                'G-Bridge provides the platform "as is" without warranties of any kind. We do not guarantee:'}
            </p>
            <ul className={styles.list}>
              <li>
                {t("termsOfService.disclaimers.dis1") ||
                  "Uninterrupted or error-free service"}
              </li>
              <li>
                {t("termsOfService.disclaimers.dis2") ||
                  "The accuracy or completeness of user-provided information"}
              </li>
              <li>
                {t("termsOfService.disclaimers.dis3") ||
                  "The quality or outcome of services provided by users"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.limitation.title") || "8. Limitation of Liability"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.limitation.content") ||
                "To the maximum extent permitted by law, G-Bridge shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.termination.title") || "9. Account Termination"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.termination.content") ||
                "We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service or for any other reason we deem necessary."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.changes.title") || "10. Changes to Terms"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.changes.content") ||
                "We may modify these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the modified terms."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("termsOfService.contact.title") || "11. Contact Information"}
            </h2>
            <p className={styles.paragraph}>
              {t("termsOfService.contact.content") ||
                "For questions about these Terms of Service, please contact us at:"}
            </p>
            <p className={styles.contactInfo}>
              <strong>Email:</strong> legal@g-bridge.com<br />
              <strong>Address:</strong> 123 ABC Street, XYZ District, Ho Chi Minh City, Vietnam
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfServicePage;

