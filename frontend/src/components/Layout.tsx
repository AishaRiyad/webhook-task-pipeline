import { NavLink } from "react-router-dom";
import { Bell, BarChart3, Boxes, GitBranch, Home, LogOut, Radio, ShieldCheck, Users, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { getUnreadNotificationsCount } from "../api/client";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const email = localStorage.getItem("frontend_user_email") || "Guest";

  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await getUnreadNotificationsCount();
        setNotificationCount(res.unread_count);
      } catch {}
    }

    loadCount();
  }, []);

  function logout() {
    localStorage.removeItem("frontend_access_token");
    localStorage.removeItem("frontend_user_email");
    window.location.href = "/";
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-icon">
            <Workflow size={22} />
          </div>
          <div>
            <h2>Sweet Pipeline</h2>
            <p>Webhook Dashboard</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className="nav-link">
            <Home size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/pipelines" className="nav-link">
            <Boxes size={18} />
            <span>Pipelines</span>
          </NavLink>

          <NavLink to="/jobs" className="nav-link">
            <ShieldCheck size={18} />
            <span>Jobs</span>
          </NavLink>

          <NavLink to="/chaining" className="nav-link">
            <GitBranch size={18} />
            <span>Chaining</span>
          </NavLink>

          <NavLink to="/subscribers" className="nav-link">
            <Users size={18} />
            <span>Subscribers</span>
          </NavLink>

          <NavLink to="/webhook-tester" className="nav-link">
            <Radio size={18} />
            <span>Webhook Tester</span>
          </NavLink>

          <NavLink to="/metrics" className="nav-link">
            <BarChart3 size={18} />
            <span>Metrics</span>
          </NavLink>

          <NavLink to="/notifications" className="nav-link notification-link">
            <Bell size={18} />
            <span>Notifications</span>

            {notificationCount > 0 && (
              <span className="notification-badge">
                {notificationCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="user-box">
          <p className="user-label">Logged in as</p>
          <p className="user-email">{email}</p>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}