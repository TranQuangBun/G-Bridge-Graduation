import React from "react";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import styles from "./PrivacyPolicyPage.module.css";

const PrivacyPolicyPage = () => {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t("privacyPolicy.title") || "Privacy Policy"}
          </h1>
          <p className={styles.lastUpdated}>
            {t("privacyPolicy.lastUpdated") || "Last Updated: January 2025"}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.introduction.title") || "1. Introduction"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.introduction.content") ||
                'G-Bridge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform to connect interpreters with clients.'}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.dataCollection.title") || "2. Information We Collect"}
            </h2>
            <h3 className={styles.subsectionTitle}>
              {t("privacyPolicy.dataCollection.personalInfo") || "Personal Information"}
            </h3>
            <ul className={styles.list}>
              <li>
                {t("privacyPolicy.dataCollection.personalInfo1") ||
                  "Name, email address, phone number, and contact details"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.personalInfo2") ||
                  "Professional credentials, certifications, and work experience"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.personalInfo3") ||
                  "Payment and billing information for transactions"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.personalInfo4") ||
                  "Profile photos and identification documents"}
              </li>
            </ul>
            <h3 className={styles.subsectionTitle}>
              {t("privacyPolicy.dataCollection.usageInfo") || "Usage Information"}
            </h3>
            <ul className={styles.list}>
              <li>
                {t("privacyPolicy.dataCollection.usageInfo1") ||
                  "Job applications, saved jobs, and application history"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.usageInfo2") ||
                  "Messages and communications between users"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.usageInfo3") ||
                  "Search history and preferences"}
              </li>
              <li>
                {t("privacyPolicy.dataCollection.usageInfo4") ||
                  "Device information, IP address, and browser type"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.dataUse.title") || "3. How We Use Your Information"}
            </h2>
            <ul className={styles.list}>
              <li>
                {t("privacyPolicy.dataUse.use1") ||
                  "To facilitate connections between interpreters and clients"}
              </li>
              <li>
                {t("privacyPolicy.dataUse.use2") ||
                  "To process job applications and manage bookings"}
              </li>
              <li>
                {t("privacyPolicy.dataUse.use3") ||
                  "To process payments and manage subscriptions"}
              </li>
              <li>
                {t("privacyPolicy.dataUse.use4") ||
                  "To send notifications, updates, and important communications"}
              </li>
              <li>
                {t("privacyPolicy.dataUse.use5") ||
                  "To improve our services and develop new features"}
              </li>
              <li>
                {t("privacyPolicy.dataUse.use6") ||
                  "To ensure platform security and prevent fraud"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.dataSharing.title") || "4. Information Sharing and Disclosure"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.dataSharing.content") ||
                "We do not sell your personal information. We may share your information in the following circumstances:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("privacyPolicy.dataSharing.share1") ||
                  "With other users as necessary to facilitate job applications and bookings"}
              </li>
              <li>
                {t("privacyPolicy.dataSharing.share2") ||
                  "With service providers who assist in operating our platform"}
              </li>
              <li>
                {t("privacyPolicy.dataSharing.share3") ||
                  "When required by law or to protect our rights and safety"}
              </li>
              <li>
                {t("privacyPolicy.dataSharing.share4") ||
                  "In connection with a business transfer or merger"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.dataSecurity.title") || "5. Data Security"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.dataSecurity.content") ||
                "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.yourRights.title") || "6. Your Rights"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.yourRights.content") ||
                "You have the right to:"}
            </p>
            <ul className={styles.list}>
              <li>
                {t("privacyPolicy.yourRights.right1") ||
                  "Access and review your personal information"}
              </li>
              <li>
                {t("privacyPolicy.yourRights.right2") ||
                  "Request correction of inaccurate information"}
              </li>
              <li>
                {t("privacyPolicy.yourRights.right3") ||
                  "Request deletion of your personal information"}
              </li>
              <li>
                {t("privacyPolicy.yourRights.right4") ||
                  "Opt-out of marketing communications"}
              </li>
              <li>
                {t("privacyPolicy.yourRights.right5") ||
                  "Export your data in a portable format"}
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.cookies.title") || "7. Cookies and Tracking Technologies"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.cookies.content") ||
                "We use cookies and similar tracking technologies to enhance your experience. For more details, please see our Cookie Policy."}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.changes.title") || "8. Changes to This Privacy Policy"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.changes.content") ||
                'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.'}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {t("privacyPolicy.contact.title") || "9. Contact Us"}
            </h2>
            <p className={styles.paragraph}>
              {t("privacyPolicy.contact.content") ||
                "If you have questions about this Privacy Policy, please contact us at:"}
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

export default PrivacyPolicyPage;

