import { useEffect, useState } from "react";
import { Bell, Truck, PackageCheck, PackageSearch, Ticket } from "lucide-react";
import { notificationApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const ICONS = {
  order_shipped: { icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
  order_delivered: { icon: PackageCheck, color: "text-green-600", bg: "bg-green-50" },
  order_status: { icon: PackageSearch, color: "text-amber-600", bg: "bg-amber-50" },
  coupon: { icon: Ticket, color: "text-pink-600", bg: "bg-pink-50" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function AccountNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.success ? res.data || [] : []);
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    }
  };

  const handleItemClick = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationApi.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch {
      // non-critical, ignore
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
        Loading your notifications...
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="bg-card rounded-lg border border-border p-10 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
        <p className="text-sm text-muted-foreground">
          Order updates and coupon alerts will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-accent text-primary px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-accent hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const meta = ICONS[n.type] || ICONS.order_status;
          const Icon = meta.icon;
          return (
            <button
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`w-full flex items-start gap-3 bg-card border rounded-xl p-3 text-left transition-colors ${
                n.isRead ? "border-border" : "border-accent/40 bg-accent/5"
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  {formatDate(n.createdAt || n.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
