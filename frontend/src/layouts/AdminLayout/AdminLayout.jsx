import React from "react";
import AdminHeader from "../../components/AdminHeader/AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <main className="admin-main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;

