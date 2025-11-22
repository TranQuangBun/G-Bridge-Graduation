// Animation Control Panel for Developers
// Thêm vào App.js hoặc HomePage.jsx để kiểm soát animations

import React, { useState } from "react";

const AnimationControlPanel = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [customSpeed, setCustomSpeed] = useState(0.8);
  const [customDistance, setCustomDistance] = useState(50);

  // Apply settings to CSS variables
  React.useEffect(() => {
    const root = document.documentElement;

    // Control animation state
    if (!animationsEnabled) {
      document.body.classList.add("animations-disabled");
    } else {
      document.body.classList.remove("animations-disabled");
    }

    if (reducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }

    // Update CSS variables
    root.style.setProperty("--scroll-duration", `${customSpeed}s`);
    root.style.setProperty("--scroll-fade-distance", `${customDistance}px`);
  }, [animationsEnabled, reducedMotion, customSpeed, customDistance]);

  const controlPanelStyle = {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
    minWidth: "250px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
  };

  const controlGroupStyle = {
    marginBottom: "15px",
    paddingBottom: "15px",
    borderBottom: "1px solid #e5e7eb",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
    color: "#374151",
  };

  const inputStyle = {
    width: "100%",
    padding: "5px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const checkboxStyle = {
    marginRight: "8px",
  };

  return (
    <div style={controlPanelStyle}>
      <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
        🎬 Animation Controls
      </h3>

      <div style={controlGroupStyle}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={animationsEnabled}
            onChange={(e) => setAnimationsEnabled(e.target.checked)}
            style={checkboxStyle}
          />
          Enable Animations
        </label>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            style={checkboxStyle}
          />
          Reduced Motion (Accessibility)
        </label>
      </div>

      <div style={controlGroupStyle}>
        <label style={labelStyle}>Animation Speed: {customSpeed}s</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={customSpeed}
          onChange={(e) => setCustomSpeed(parseFloat(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div style={controlGroupStyle}>
        <label style={labelStyle}>Fade Distance: {customDistance}px</label>
        <input
          type="range"
          min="10"
          max="100"
          step="10"
          value={customDistance}
          onChange={(e) => setCustomDistance(parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
        💡 Thay đổi các settings để xem hiệu ứng animation
      </div>
    </div>
  );
};

export default AnimationControlPanel;

/*
HƯỚNG DẪN SỬ DỤNG:

1. Thêm component này vào HomePage.jsx:
   import AnimationControlPanel from './AnimationControlPanel';
   
2. Render trong return statement:
   {process.env.NODE_ENV === 'development' && <AnimationControlPanel />}

3. Hoặc tạo toggle button để hiện/ẩn:
   const [showControls, setShowControls] = useState(false);
   
4. Keyboard shortcuts (thêm vào useEffect):
   useEffect(() => {
     const handleKeyPress = (e) => {
       if (e.ctrlKey && e.key === 'a') {
         setShowControls(!showControls);
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, [showControls]);

CUSTOM CSS VARIABLES CÓ THỂ ĐIỀU CHỈNH:
- --scroll-fade-distance: Khoảng cách animation fade
- --scroll-duration: Thời gian animation
- --scroll-delay-increment: Delay giữa các phần tử stagger
- --hover-lift-distance: Khoảng cách lift khi hover
- --pulse-scale: Mức scale khi hover
- --parallax-speed: Tốc độ parallax

ANIMATION CLASSES CÓ SẴN:
- animate-on-scroll: Fade in khi scroll
- animate-stagger: Animation theo thứ tự
- hover-lift: Nâng lên khi hover
- magnetic-hover: Thu hút về phía mouse
- tilt-effect: Hiệu ứng nghiêng 3D
- float-animation: Hiệu ứng nổi
- breathing-effect: Hiệu ứng thở
- animated-gradient-text: Text gradient động
- ripple-effect: Hiệu ứng sóng khi click
- slide-in-left/right: Trượt vào từ bên
*/
