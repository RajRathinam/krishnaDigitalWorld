import {
  Users, Package, ShoppingCart, Gift, TrendingUp, TrendingDown,
  IndianRupee, Eye, ArrowRight, Calendar, Cake, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export const AdminOverview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading,        setLoading       ] = useState(true);
  const [stats,          setStats         ] = useState(null);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [sendingWishes,  setSendingWishes ] = useState([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await api.get("/admin/stats");
      if (statsResponse.data.success && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      } else {
        toast({ title: "Error", description: statsResponse.data.message || "Failed to load dashboard stats", variant: "destructive" });
      }
      const birthdaysResponse = await api.get("/birthdays/today");
      if (birthdaysResponse.data.success && birthdaysResponse.data.data) {
        setTodayBirthdays(birthdaysResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "Error", description: error.message || "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBirthdayWish = async (userId) => {
    try {
      setSendingWishes((prev) => [...prev, userId]);
      const response = await api.post(`/birthdays/${userId}/wish`);
      if (response.data.success) {
        toast({ title: "Success", description: "Birthday wish sent successfully" });
        setTodayBirthdays((prev) => prev.map((u) => u.id === userId ? { ...u, giftReceived: true } : u));
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to send birthday wish", variant: "destructive" });
    } finally {
      setSendingWishes((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSendAllBirthdayWishes = async () => {
    try {
      const response = await api.post("/admin/send-birthday-wishes");
      if (response.data.success) {
        toast({ title: "Success", description: `${response.data.data?.count || 0} birthday wishes sent` });
        const r = await api.get("/birthdays/today");
        if (r.data.success && r.data.data) setTodayBirthdays(r.data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to send birthday wishes", variant: "destructive" });
    }
  };

  const fmt = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount || 0);

  const fmtDate = (d) => {
    if (!d) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
    } catch { return "N/A"; }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-4 w-20" />
            </CardContent></Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent>{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}</CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <h3 className="text-lg font-semibold">No Data Available</h3>
        <p className="text-muted-foreground">Unable to load dashboard statistics</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  /* ── Revenue values — backend sends totalRevenue (excl. cancelled) and
        cancelledOrdersRevenue separately. Fall back gracefully if old. ── */
  const totalRevenue       = stats.counts.totalRevenue       || 0;
  const monthlyRevenue     = stats.counts.monthlyRevenue     || 0;
  const cancelledRevenue   = stats.counts.cancelledRevenue   || 0; // new field from updated backend
  const cancelledCount     = stats.counts.cancelledOrders    || 0; // new field from updated backend

  const statCards = [
    {
      title:   "Total Revenue",
      value:   fmt(totalRevenue),
      note:    "Cancelled & Pending orders excluded",
      noteIcon: XCircle,
      noteColor:"text-red-400",
      icon:    IndianRupee,
      color:   "text-green-600",
      bg:      "bg-green-100",
    },
    {
      title: "Total Products",
      value: stats.counts.totalProducts?.toLocaleString() || "0",
      sub:   "Active products",
      icon:  Package,
      color: "text-blue-600",
      bg:    "bg-blue-100",
    },
    {
      title: "Total Orders",
      value: stats.counts.totalOrders?.toLocaleString() || "0",
      sub:   `+${stats.counts.newOrdersThisMonth || 0} this month`,
      icon:  ShoppingCart,
      color: "text-purple-600",
      bg:    "bg-purple-100",
    },
    {
      title: "Total Customers",
      value: stats.counts.totalUsers?.toLocaleString() || "0",
      sub:   `+${stats.counts.newUsersThisMonth || 0} this month`,
      icon:  Users,
      color: "text-orange-600",
      bg:    "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold leading-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                  {/* Revenue-specific: show "cancelled excluded" hint */}
                  {stat.note && (
                    <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${stat.noteColor}`}>
                      <stat.noteIcon className="w-3 h-3" />
                      {stat.note}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Cancelled revenue callout (only if backend sends the data) ── */}
      {cancelledRevenue > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            <span className="font-semibold">{fmt(cancelledRevenue)}</span> from{" "}
            <span className="font-semibold">{cancelledCount}</span> cancelled order{cancelledCount !== 1 ? "s" : ""} is
            not included in total revenue.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Recent Orders ── */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground">Latest transactions from store</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/orders")} className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders?.length ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 hidden sm:table-cell">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 hidden md:table-cell">Payment</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.recentOrders.map((order) => {
                      const isCancelled = order.orderStatus === "cancelled";
                      return (
                        <tr key={order.id}
                          className={`hover:bg-muted/50 transition-colors cursor-pointer ${isCancelled ? "bg-red-50/40" : ""}`}
                          onClick={() => navigate("/orders")}>
                          <td className="p-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user?.name || "Guest"}</span>
                              <span className="text-xs text-muted-foreground hidden sm:inline-block">{order.user?.email}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {fmtDate(order.createdAt || order.created_at)}
                          </td>
                          <td className="p-3">
                            <p className={`font-semibold ${isCancelled ? "line-through text-muted-foreground text-xs" : ""}`}>
                              {fmt(order.finalAmount)}
                            </p>
                            {isCancelled && (
                              <p className="text-[10px] text-red-400 flex items-center gap-0.5">
                                <XCircle className="w-2.5 h-2.5" /> cancelled
                              </p>
                            )}
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                              order.paymentMethod === "cod" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {order.paymentMethod === "cod" ? "COD" : (order.paymentMethod?.toUpperCase() || "UPI")}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              order.orderStatus === "delivered"  ? "bg-emerald-100 text-emerald-800" :
                              order.orderStatus === "shipped"    ? "bg-blue-100   text-blue-800"     :
                              order.orderStatus === "processing" ? "bg-amber-100  text-amber-800"    :
                              order.orderStatus === "cancelled"  ? "bg-red-100    text-red-800"      :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {order.orderStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
                <p>No recent orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Actions + Birthdays ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Product", icon: Package,  color: "text-primary",     path: "/products"  },
                { label: "View Orders", icon: Eye,      color: "text-blue-600",    path: "/orders"    },
                { label: "Customers",   icon: Users,    color: "text-purple-600",  path: "/analytics" },
                { label: "Birthdays",   icon: Calendar, color: "text-pink-600",    path: "/birthdays" },
              ].map((a) => (
                <Button key={a.label} variant="outline"
                  className="h-20 flex flex-col gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => navigate(a.path)}>
                  <a.icon className={`h-6 w-6 ${a.color}`} />
                  <span className="text-xs font-medium">{a.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" /> Today's Birthdays
              </CardTitle>
              {todayBirthdays.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs hidden"
                  onClick={handleSendAllBirthdayWishes} disabled={sendingWishes.length > 0}>
                  Send All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {todayBirthdays.length > 0 ? (
                <div className="space-y-3">
                  {todayBirthdays.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {/* <Button size="sm"
                        variant={user.giftReceived ? "secondary" : "default"}
                        className={user.giftReceived ? "text-green-600 bg-green-50 hover:bg-green-100" : "bg-pink-600 hover:bg-pink-700"}
                        onClick={() => handleSendBirthdayWish(user.id)}
                        disabled={sendingWishes.includes(user.id) || user.giftReceived}>
                        {sendingWishes.includes(user.id) ? "..." : user.giftReceived ? "Sent" : "Wish"}
                      </Button> */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Cake className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No birthdays today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Popular Products ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-orange-500" /> Popular Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.popularProducts?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.popularProducts.slice(0, 5).map((product) => {
                const getImg = (p) => {
                  if (p.images) {
                    if (Array.isArray(p.images) && p.images.length > 0)
                      return typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url;
                    return typeof p.images === "string" ? p.images : p.images?.url;
                  }
                  if (p.colorsAndImages) {
                    try {
                      const cni = typeof p.colorsAndImages === "string" ? JSON.parse(p.colorsAndImages) : p.colorsAndImages;
                      if (cni && typeof cni === "object") {
                        const first = Object.values(cni)[0];
                        if (Array.isArray(first) && first.length > 0) return first[0]?.url;
                      }
                    } catch { return null; }
                  }
                  if (p.image) return typeof p.image === "string" ? p.image : p.image?.url;
                  return null;
                };
                const imgUrl = getImg(product);
                const fullUrl = imgUrl ? getImageUrl(imgUrl) : null;

                return (
                  <div key={product.id}
                    className="group relative border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-card">
                    <div className="aspect-video w-full bg-white overflow-hidden relative">
                      {fullUrl ? (
                        <img src={fullUrl} alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=No+Image"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                          <Package className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {product.totalReviews || 0} Reviews
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{fmt(product.price)}</span>
                        <div className="flex items-center text-xs text-amber-500 font-medium">
                          <span className="mr-1">★</span>{(Number(product.rating) || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">No popular products data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};