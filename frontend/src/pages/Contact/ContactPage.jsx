import React from "react";
import { MainLayout } from "../../layouts";
import "./ContactPage.css";

const ContactPage = () => {
  return (
    <MainLayout>
      <div className="contact-page">
        <h1>Liên hệ</h1>
        <p>Thông tin liên hệ với chúng tôi</p>
        <div className="contact-content">
          <div className="contact-info">
            <h2>Thông tin liên hệ</h2>
            <div className="contact-item">
              <strong>Email:</strong> contact@g-bridge.com
            </div>
            <div className="contact-item">
              <strong>Điện thoại:</strong> +84 123 456 789
            </div>
            <div className="contact-item">
              <strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
            </div>
          </div>
          <div className="contact-form">
            <h2>Gửi tin nhắn</h2>
            <form>
              <input type="text" placeholder="Họ và tên" />
              <input type="email" placeholder="Email" />
              <textarea placeholder="Tin nhắn" rows="5"></textarea>
              <button type="submit">Gửi tin nhắn</button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ContactPage;
