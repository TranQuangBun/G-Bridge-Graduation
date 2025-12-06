import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useLanguage } from "../../translet/LanguageContext";
import "./Footer.css";

// Import social media icons
import facebookIcon from "../../assets/images/socials/facebook.png";
import linkedinIcon from "../../assets/images/socials/linked.png";
import telegramIcon from "../../assets/images/socials/telegram.png";
import tiktokIcon from "../../assets/images/socials/tiktok.png";

const Footer = () => {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");

  // Handle newsletter form submission
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription logic here
    console.log("Newsletter subscription:", email);
    // Reset form
    setEmail("");
    // You can add API call here to subscribe user
  };

  // Language translations
  const translations = {
    vi: {
      aboutUs: "Về chúng tôi",
      description:
        "G-Bridge là nền tảng kết nối việc làm hàng đầu, giúp ứng viên tìm kiếm cơ hội nghề nghiệp phù hợp và doanh nghiệp tìm kiếm nhân tài.",
      quickLinks: "Liên kết nhanh",
      home: "Trang chủ",
      findJob: "Tìm việc",
      candidates: "Ứng viên",
      pricing: "Bảng giá",
      support: "Hỗ trợ",
      forEmployers: "Dành cho nhà tuyển dụng",
      postJob: "Đăng tin tuyển dụng",
      searchCandidates: "Tìm ứng viên",
      pricingPlans: "Gói dịch vụ",
      contactInfo: "Thông tin liên hệ",
      address: "123 Đường ABC, Quận XYZ, TP.HCM",
      phone: "+84 123 456 789",
      email: "contact@g-bridge.com",
      workingHours: "Giờ làm việc: T2-T6, 8:00-17:30",
      followUs: "Theo dõi chúng tôi",
      newsletter: "Đăng ký nhận tin",
      newsletterDesc: "Nhận thông báo về cơ hội việc làm mới nhất",
      subscribe: "Đăng ký",
      copyright: "© 2025 G-Bridge. Tất cả quyền được bảo lưu.",
      privacy: "Chính sách bảo mật",
      terms: "Điều khoản sử dụng",
      cookies: "Chính sách Cookie",
    },
    en: {
      aboutUs: "About Us",
      description:
        "G-Bridge is a leading job connection platform that helps candidates find suitable career opportunities and businesses find talent.",
      quickLinks: "Quick Links",
      home: "Home",
      findJob: "Find Job",
      candidates: "Candidates",
      pricing: "Pricing Plans",
      support: "Customer Supports",
      forEmployers: "For Employers",
      postJob: "Post a Job",
      searchCandidates: "Search Candidates",
      pricingPlans: "Pricing Plans",
      contactInfo: "Contact Info",
      address: "123 ABC Street, XYZ District, Ho Chi Minh City",
      phone: "+84 123 456 789",
      email: "contact@g-bridge.com",
      workingHours: "Working Hours: Mon-Fri, 8:00-17:30",
      followUs: "Follow Us",
      newsletter: "Newsletter",
      newsletterDesc: "Get notified about the latest job opportunities",
      subscribe: "Subscribe",
      copyright: "© 2025 G-Bridge. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
    },
  };

  const t = translations[lang];

  return (
    <footer className="modern-footer">
      {/* Footer Background Effects */}
      <div className="footer-background">
        <div className="footer-shape"></div>
        <div className="footer-glow"></div>
        <div className="footer-particles"></div>
      </div>

      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Top Row */}
          <div className="footer-top">
            {/* Company Info */}
            <div className="footer-section company-info">
              <div className="footer-logo">
                <div className="logo-icon">
                  <span className="logo-text">G</span>
                </div>
                <span className="brand-name">G-Bridge</span>
              </div>
              <p className="company-description">{t.description}</p>

              {/* Social Links */}
              <div className="social-links">
                <span className="social-title">{t.followUs}</span>
                <div className="social-icons">
                  <a
                    href="https://facebook.com/gbridge"
                    className="social-icon facebook"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={facebookIcon}
                      alt="Facebook"
                      className="social-image"
                    />
                  </a>
                  <a
                    href="https://linkedin.com/company/gbridge"
                    className="social-icon linkedin"
                    aria-label="LinkedIn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={linkedinIcon}
                      alt="LinkedIn"
                      className="social-image"
                    />
                  </a>
                  <a
                    href="https://t.me/gbridge"
                    className="social-icon telegram"
                    aria-label="Telegram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={telegramIcon}
                      alt="Telegram"
                      className="social-image"
                    />
                  </a>
                  <a
                    href="https://tiktok.com/@gbridge"
                    className="social-icon tiktok"
                    aria-label="TikTok"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={tiktokIcon}
                      alt="TikTok"
                      className="social-image"
                    />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h4 className="section-title">{t.quickLinks}</h4>
              <ul className="footer-links">
                <li>
                  <Link to={ROUTES.HOME}>{t.home}</Link>
                </li>
                <li>
                  <Link to={ROUTES.FIND_JOB}>{t.findJob}</Link>
                </li>
                <li>
                  <Link to="/candidates">{t.candidates}</Link>
                </li>
                <li>
                  <Link to="/pricing">{t.pricing}</Link>
                </li>
                <li>
                  <Link to="/pricing">{t.pricing}</Link>
                </li>
              </ul>
            </div>

            {/* For Employers */}
            <div className="footer-section">
              <h4 className="section-title">{t.forEmployers}</h4>
              <ul className="footer-links">
                <li>
                  <Link to={ROUTES.POST_JOB}>{t.postJob}</Link>
                </li>
                <li>
                  <Link to="/search-candidates">{t.searchCandidates}</Link>
                </li>
                <li>
                  <Link to="/pricing-plans">{t.pricingPlans}</Link>
                </li>
                <li>
                  <Link to="/employer-support">Support</Link>
                </li>
              </ul>
            </div>

            {/* Newsletter Section */}
            <div className="footer-section newsletter-section">
              <h4 className="section-title">{t.newsletter}</h4>
              <p className="newsletter-desc">{t.newsletterDesc}</p>
              <form
                className="newsletter-form"
                onSubmit={handleNewsletterSubmit}
              >
                <div className="input-group">
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder={
                      lang === "vi" ? "Nhập email của bạn" : "Enter your email"
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="newsletter-btn">
                    {t.subscribe}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>{t.copyright}</p>
            </div>
            <div className="footer-bottom-links">
              <Link to="/privacy">{t.privacy}</Link>
              <Link to="/terms">{t.terms}</Link>
              <Link to="/cookies">{t.cookies}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
