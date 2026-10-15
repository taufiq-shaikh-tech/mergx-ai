import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { NotificationItem } from "../types";

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    for (const n of notifications.filter((item) => !item.read)) {
      await api.markNotificationRead(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <PageHeader
        eyebrow="SYSTEM EVENTS"
        title="Notifications"
        description="Live operational alerts from automated scan runs, security audits, and workspace updates."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Check size={14} />}
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {/* ERROR */}
      {error && (
        <div
          className="mx-card"
          style={{
            padding: 16,
            marginBottom: 20,
            borderColor: "var(--danger)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={loadNotifications}>
            Retry
          </Button>
        </div>
      )}

      {/* FILTER BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: filter === "all" ? 600 : 500,
              cursor: "pointer",
              background: filter === "all" ? "var(--accent-subtle)" : "none",
              color: filter === "all" ? "var(--accent-lime)" : "var(--text-muted)",
              border: `1px solid ${filter === "all" ? "var(--accent-border)" : "var(--border)"}`,
            }}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: filter === "unread" ? 600 : 500,
              cursor: "pointer",
              background: filter === "unread" ? "var(--accent-subtle)" : "none",
              color: filter === "unread" ? "var(--accent-lime)" : "var(--text-muted)",
              border: `1px solid ${filter === "unread" ? "var(--accent-border)" : "var(--border)"}`,
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
          onClick={loadNotifications}
        >
          Refresh
        </Button>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Checking for events...</div>
        </div>
      )}

      {/* EMPTY STATES */}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          title="No notifications"
          description="You are completely caught up! Background analysis and security alerts will appear here."
        />
      )}

      {!loading && !error && notifications.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="No unread notifications"
          description="All system alerts and scan completion notifications have been read."
          actionText="View All Notifications"
          onAction={() => setFilter("all")}
        />
      )}

      {/* LIST */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="mx-card"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                background: item.read ? "var(--bg-card)" : "rgba(196, 247, 91, 0.03)",
                border: item.read ? "1px solid var(--border)" : "1px solid var(--accent-border)",
              }}
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-elevated)",
                    display: "grid",
                    placeItems: "center",
                    color: !item.read ? "var(--accent-lime)" : "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: item.read ? 500 : 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.title}
                    </h3>
                    {!item.read && <Badge variant="accent">New</Badge>}
                  </div>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              </div>

              {!item.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: "none",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}