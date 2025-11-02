import React, { useState } from "react";
import { BookingModal } from "../../components";
import styles from "./InterpreterDetailDemo.module.css";

// Demo component - Replace this with your actual interpreter detail page
const InterpreterDetailDemo = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Mock interpreter data
  const mockInterpreter = {
    id: 1,
    name: "Nguyễn Văn A",
    avatar: "https://via.placeholder.com/150",
    languages: ["Vietnamese", "English", "Japanese"],
    specializations: ["Medical", "Business", "Legal"],
    rating: 4.8,
    hourlyRate: 500000,
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.interpreterCard}>
          <img
            src={mockInterpreter.avatar}
            alt={mockInterpreter.name}
            className={styles.avatar}
          />
          <h1>{mockInterpreter.name}</h1>
          <p className={styles.languages}>
            {mockInterpreter.languages.join(" • ")}
          </p>
          <p className={styles.specializations}>
            Chuyên môn: {mockInterpreter.specializations.join(", ")}
          </p>
          <p className={styles.rating}>⭐ {mockInterpreter.rating}/5.0</p>
          <p className={styles.rate}>
            {mockInterpreter.hourlyRate.toLocaleString("vi-VN")} VNĐ/giờ
          </p>

          <button
            className={styles.bookButton}
            onClick={() => setIsBookingModalOpen(true)}
          >
            📅 Đặt Lịch Ngay
          </button>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        interpreter={mockInterpreter}
      />
    </div>
  );
};

export default InterpreterDetailDemo;
