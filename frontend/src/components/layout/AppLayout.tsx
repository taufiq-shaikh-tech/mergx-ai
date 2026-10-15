import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FolderGit2,
  ScanSearch,
  ShieldCheck,
  Zap,
  Clock3,
  FileBarChart,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  GitBranch,
} from "lucide-react";
import { supabase } from "../../services/supabase";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userName, setUserName] = useState("Developer");
  const [userEmail, setUserEmail] = useState("");

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
  }

  // Load Supabase user profile
  useEffect(() => {
    let isMounted = true;
    async function getUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && isMounted) {
          const fullName = data.user.user_metadata?.full_name;
          const email = data.user.email ?? "";
          setUserEmail(email);
          if (fullName) {
            setUserName(fullName);
          } else if (email) {
            setUserName(email.split("@")[0]);
          }
        }
      } catch {
        // Fallback to defaults
      }
    }
    getUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch {
      window.alert("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const navGroups = [
    {
      group: "WORKSPACE",
      items: [
        { label: "Overview", path: "/app", icon: LayoutDashboard },
        { label: "My Projects", path: "/app/projects", icon: FolderGit2 },
        { label: "New Analysis", path: "/app/analysis/new", icon: ScanSearch },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        { label: "Integration", path: "/app/integration", icon: GitBranch },
        { label: "Security", path: "/app/security", icon: ShieldCheck },
        { label: "Dependencies", path: "/app/dependencies", icon: Zap },
      ],
    },
    {
      group: "MONITORING",
      items: [
        { label: "Scan History", path: "/app/history", icon: Clock3 },
        { label: "Reports", path: "/app/reports", icon: FileBarChart },
        { label: "Notifications", path: "/app/notifications", icon: Bell },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Settings", path: "/app/settings", icon: Settings },
      ],
    },
  ];

  // Helper for active link checking
  const isPathActive = (itemPath: string) => {
    if (itemPath === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/overview";
    }
    return location.pathname.startsWith(itemPath);
  };

  // Generate breadcrumb title
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/app" || path === "/app/overview") return "Overview";
    if (path.startsWith("/app/projects/new") || path.startsWith("/app/projects/upload"))
      return "Projects / Upload";
    if (path.startsWith("/app/projects/")) return "Projects / Details";
    if (path === "/app/projects") return "Projects";
    if (path.startsWith("/app/analysis/new")) return "Analysis / New Run";
    if (path.includes("/results")) return "Analysis / Results";
    if (path.startsWith("/app/analysis/")) return "Analysis / Progress";
    if (path.startsWith("/app/integration")) return "Inspection / Integration";
    if (path.startsWith("/app/security")) return "Inspection / Security";
    if (path.startsWith("/app/dependencies")) return "Inspection / Dependencies";
    if (path.startsWith("/app/history")) return "Monitoring / History";
    if (path.startsWith("/app/reports")) return "Monitoring / Reports";
    if (path.startsWith("/app/notifications")) return "Notifications";
    if (path.startsWith("/app/profile")) return "Account / Profile";
    if (path.startsWith("/app/settings")) return "Account / Settings";
    return "Workspace";
  };

  return (
    <div className="mx-dashboard">
      {/* SIDEBAR */}
      <aside className={`mx-sidebar ${mobileMenuOpen ? "mx-sidebar-open" : ""}`}>
        <Link to="/app" className="mx-brand" aria-label="MergeX AI Home">
          <img src="/mergex-mark.png" alt="MergeX AI" />
        </Link>

        {/* WORKSPACE CARD */}
        <div className="mx-workspace-label">WORKSPACE</div>
        <button
          className="mx-workspace"
          onClick={() => navigate("/app/profile")}
          title="Manage Account Profile"
        >
          <span className="mx-workspace-avatar">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="mx-workspace-info">
            <strong>{userName}</strong>
            <small>{userEmail || "Personal workspace"}</small>
          </span>
          <ArrowUpRight size={15} />
        </button>

        {/* NAVIGATION GROUPS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflowY: "auto",
            paddingRight: 4,
            marginBottom: 16,
          }}
        >
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className="mx-nav-label">{group.group}</div>
              <nav className="mx-navigation">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`mx-nav-item ${active ? "mx-nav-active" : ""}`}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                      {item.label === "Security" && (
                        <span
                          className="mx-nav-dot"
                          style={{
                            background: "var(--accent)",
                            boxShadow: "0 0 6px rgba(196, 247, 91, 0.4)",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* BOTTOM AREA */}
        <div className="mx-sidebar-bottom">
          <div className="mx-upgrade-card">
            <div className="mx-upgrade-icon">
              <Zap size={16} />
            </div>
            <strong>Continuous Validation</strong>
            <p>Inspect AI-generated code across layers with evidence.</p>
            <button
              onClick={() => navigate("/app/analysis/new")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Start scan <ArrowUpRight size={13} />
            </button>
          </div>

          <button
            className="mx-nav-item mx-signout"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
          >
            <LogOut size={17} />
            <span>{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>

          <div className="mx-sidebar-footer">
            <span className="mx-online-dot" />
            <span>Analysis engine ready</span>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          className="mx-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="mx-main">
        {/* TOPBAR */}
        <header className="mx-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mx-mobile-menu-button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="mx-breadcrumb">
              <span>MergeX</span>
              <span className="mx-breadcrumb-slash">/</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {getBreadcrumb()}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              onClick={() => navigate("/app/analysis/new")}
              className="mx-btn mx-btn-primary"
              style={{
                padding: "7px 14px",
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={15} />
              <span>New Analysis</span>
            </button>

            <Link
              to="/app/notifications"
              className="mx-btn mx-btn-ghost"
              style={{
                padding: 8,
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
              title="Notifications"
            >
              <Bell size={18} />
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            </Link>

            <Link
              to="/app/profile"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 12,
                color: "var(--accent)",
              }}
              title={`Logged in as ${userName}`}
            >
              {userName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main
          className="mx-content"
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            width: "100%",
            padding: "32px 36px 48px",
            boxSizing: "border-box",
            minHeight: "calc(100vh - 69px)",
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
