import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./OverviewPage.module.css";
import {
  FaBriefcase,
  FaClipboardList,
  FaFileAlt,
  FaHeart,
  FaBell,
  FaChartLine,
} from "react-icons/fa";
import jobService from "../../../services/jobService";

export default function OverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appliedJobs: 0,
    favoriteJobs: 0,
    jobAlerts: 0,
    postedJobs: 0,
    receivedApplications: 0,
    activeJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (user?.role === "client") {
          const jobsData = await jobService.getClientJobs();
          const jobs = jobsData.data || [];
          const activeJobs = jobs.filter(
            (job) => job.status === "active"
          ).length;

          setStats({
            postedJobs: jobs.length,
            activeJobs: activeJobs,
            receivedApplications: jobs.reduce(
              (sum, job) => sum + (job.applicationCount || 0),
              0
            ),
          });
        } else {
          const applicationsData = await jobService.getMyApplications();
          const favoritesData = await jobService.getSavedJobs();

          setStats({
            appliedJobs: applicationsData.data?.length || 0,
            favoriteJobs: favoritesData.data?.length || 0,
            jobAlerts: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const clientStats = [
    {
      icon: FaBriefcase,
      label: t("dashboard.stats.postedJobs"),
      value: stats.postedJobs,
      color: "blue",
    },
    {
      icon: FaClipboardList,
      label: t("dashboard.stats.receivedApplications"),
      value: stats.receivedApplications,
      color: "green",
    },
    {
      icon: FaFileAlt,
      label: t("dashboard.stats.activeJobs"),
      value: stats.activeJobs,
      color: "purple",
    },
  ];

  const interpreterStats = [
    {
      icon: FaFileAlt,
      label: t("dashboard.stats.appliedJobs"),
      value: stats.appliedJobs,
      color: "blue",
    },
    {
      icon: FaHeart,
      label: t("dashboard.stats.favoriteJobs"),
      value: stats.favoriteJobs,
      color: "pink",
    },
    {
      icon: FaBell,
      label: t("dashboard.stats.jobAlerts"),
      value: stats.jobAlerts,
      color: "orange",
    },
  ];

  const displayStats = user?.role === "client" ? clientStats : interpreterStats;

  return (
    <DashboardLayout
      title={`${t("common.welcome")}, ${user?.fullName || user?.email}!`}
      subtitle={t("dashboard.overview.subtitle")}
    >
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${styles.statCard} ${styles[`stat${stat.color}`]}`}
            >
              <div className={styles.statIcon}>
                <Icon />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>
                  {loading ? "..." : stat.value}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart Placeholder */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaChartLine /> {t("dashboard.overview.activityChart")}
          </h2>
        </div>
        <div className={styles.chartCard}>
          <p className={styles.chartPlaceholder}>
            {t("dashboard.overview.chartComingSoon")}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
