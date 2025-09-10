import React from "react";
import { MainLayout } from "../../layouts";
import "./AboutPage.css";

const AboutPage = () => {
  return (
    <MainLayout>
      <div className="about-page">
        <h1>Giới thiệu</h1>
        <p>Thông tin về hệ thống G-Bridge</p>
        <div className="about-content">
          <div className="about-section">
            <h2>Về chúng tôi</h2>
            <p>
              G-Bridge là hệ thống quản lý hiện đại, được phát triển với công
              nghệ React tiên tiến.
            </p>
          </div>
          <div className="about-section">
            <h2>Tầm nhìn</h2>
            <p>
              Chúng tôi hướng tới việc tạo ra những giải pháp công nghệ tốt nhất
              cho người dùng.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AboutPage;
