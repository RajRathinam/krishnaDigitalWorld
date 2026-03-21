import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, ShoppingBag,
  Package, Tag, Clock, Eye, Truck, Loader2, CreditCard,
  CalendarDays, UserCheck, UserX, Home, Award, Hash,
  XCircle, CheckCircle, BadgePercent, Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount || 0);

const fmtDate = (d, includeTime = true) => {
  if (!d) return "N/A";
  try {
    const date = new Date(d);
    const opts = { year: "numeric", month: "short", day: "numeric" };
    if (includeTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
    return new Intl.DateTimeFormat("en-IN", opts).format(date);
  } catch { return "N/A"; }
};

const ORDER_STATUS_STYLES = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const OrderStatusBadge = ({ status }) => (
  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ORDER_STATUS_STYLES[status] || "bg-gray-100 text-gray-800"}`}>
    {status}
  </span>
);

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export const CustomerDetails = () => {
  const params     = useParams();
  const navigate   = useNavigate();
  const { toast }  = useToast();
  const customerId = params.id;

  const [customer,  setCustomer ] = useState(null);
  const [loading,   setLoading  ] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { if (customerId) fetchCustomerDetails(); }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${customerId}`);
      if (response.data.success && response.data.data) {
        const d = response.data.data;

        // Compute derived stats from orders
        const orders           = d.orders || [];
        const activeOrders     = orders.filter(o => o.orderStatus !== "cancelled");
        const cancelledOrders  = orders.filter(o => o.orderStatus === "cancelled");
        const activeTotal      = activeOrders.reduce((s, o) => s + parseFloat(o.totalValue || o.finalAmount || o.totalPrice || 0), 0);
        const cancelledCount   = cancelledOrders.length;

        setCustomer({
          id:                  d.id?.toString() || customerId,
          customerCode:        d.customerCode || `CUST${d.id || customerId}`,
          name:                d.name          || "Unknown Customer",
          email:               d.email         || "",
          phone:               d.phone         || "",
          role:                d.role          || "customer",
          dateOfBirth:         d.dateOfBirth,
          isVerified:          d.isVerified    || false,
          isActive:            d.isActive      !== undefined ? d.isActive : true,
          giftReceived:        d.giftReceived  || false,
          createdAt:           d.created_at    || d.createdAt || new Date().toISOString(),
          updatedAt:           d.updated_at    || d.updatedAt || new Date().toISOString(),
          address:             d.address,
          additionalAddresses: d.additionalAddresses || [],
          orders,
          reviews:             d.reviews       || [],
          stats: {
            orderCount:      d.stats?.orderCount    ?? orders.length,
            totalSpent:      activeTotal,            // non-cancelled only
            cancelledCount,
          },
        });
      } else {
        toast({ title: "Error", description: response.data.message || "Failed to load customer details", variant: "destructive" });
        navigate("/analytics");
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to load customer details", variant: "destructive" });
      navigate("/analytics");
    } finally {
      setLoading(false);
    }
  };

  /* ── Birthday helpers ── */
  const isTodayBirthday = () => {
    if (!customer?.dateOfBirth) return false;
    const today = new Date();
    const b     = new Date(customer.dateOfBirth);
    return today.getMonth() === b.getMonth() && today.getDate() === b.getDate();
  };
  const calculateAge = () => {
    if (!customer?.dateOfBirth) return null;
    const b = new Date(customer.dateOfBirth);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
    return age;
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Customer not found</h3>
        <p className="mt-2 text-muted-foreground">The customer you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/analytics")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </div>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="space-y-6 animate-in fade-in-50">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/analytics")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> {customer.customerCode}
              </span>
              <Badge variant={customer.isActive ? "default" : "destructive"}
                className={customer.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border border-green-200" : ""}>
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
              {customer.isVerified && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              {isTodayBirthday() && (
                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border border-pink-200">
                  <Award className="h-3 w-3 mr-1" /> Birthday Today!
                </Badge>
              )}
              {customer.giftReceived && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Award className="h-3 w-3 mr-1" /> Gift Received
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards — 4 cols ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Total Orders */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{customer.stats.orderCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent — non-cancelled only */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold leading-tight">{fmt(customer.stats.totalSpent)}</p>
                <p className="text-[11px] text-muted-foreground">excl. cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Orders */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancelled Orders</p>
                <p className="text-2xl font-bold">{customer.stats.cancelledCount}</p>
                {customer.stats.cancelledCount > 0 && (
                  <p className="text-[11px] text-red-500">
                    {Math.round((customer.stats.cancelledCount / customer.stats.orderCount) * 100)}% of total
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-2xl font-bold">{new Date(customer.createdAt).getFullYear()}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDate(customer.createdAt, false)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({customer.orders.length})</TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses ({1 + (customer.additionalAddresses?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({customer.reviews.length})</TabsTrigger>
        </TabsList>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-muted-foreground" /> Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Email</span>
                    <span className="text-muted-foreground truncate">{customer.email || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Phone</span>
                    <span className="text-muted-foreground">{customer.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Birthday</span>
                    <span className="text-muted-foreground">
                      {customer.dateOfBirth
                        ? `${fmtDate(customer.dateOfBirth, false)}${calculateAge() ? ` (${calculateAge()} yrs)` : ""}`
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Role</span>
                    <Badge variant="outline" className="capitalize text-xs">{customer.role}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Joined</span>
                    <span className="text-muted-foreground">{fmtDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground min-w-[80px]">Updated</span>
                    <span className="text-muted-foreground">{fmtDate(customer.updatedAt)}</span>
                  </div>
                </div>

                {/* Mini spend breakdown */}
                <Separator />
                <div className="rounded-lg bg-muted/30 border border-border/60 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spend Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Active orders
                    </span>
                    <span className="font-semibold text-green-700">{fmt(customer.stats.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-400" /> Cancelled
                    </span>
                    <span className="font-medium text-red-600">{customer.stats.cancelledCount} order{customer.stats.cancelledCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Primary Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.address ? (
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-0.5 text-sm">
                    {customer.address.name   && <p className="font-semibold text-foreground">{customer.address.name}</p>}
                    {customer.address.phone  && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />{customer.address.phone}
                      </p>
                    )}
                    {customer.address.street && <p className="text-muted-foreground">{customer.address.street}</p>}
                    <p className="text-muted-foreground">
                      {[customer.address.city, customer.address.state].filter(Boolean).join(", ")}
                      {customer.address.pincode ? ` — ${customer.address.pincode}` : ""}
                    </p>
                    {customer.address.country && <p className="text-muted-foreground">{customer.address.country}</p>}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No address provided</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" /> Recent Orders
                </span>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                  View All ({customer.orders.length})
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">Order ID</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Items</TableHead>
                        <TableHead className="text-xs font-semibold">Total</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id} className={`text-sm ${order.orderStatus === "cancelled" ? "bg-red-50/30" : ""}`}>
                          <TableCell className="font-mono text-xs font-semibold py-3">
                            {order.orderNumber || `ORD-${order.id}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-3">
                            {fmtDate(order.createdAt || order.created_at, false)}
                          </TableCell>
                          <TableCell className="py-3">{order.products?.length || 0}</TableCell>
                          <TableCell className="py-3 font-semibold">
                            {fmt(order.totalValue || order.finalAmount || order.totalPrice || 0)}
                          </TableCell>
                          <TableCell className="py-3">
                            <OrderStatusBadge status={order.orderStatus || "pending"} />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── All Orders ─── */}
        <TabsContent value="orders" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" />
                All Orders ({customer.orders.length})
              </CardTitle>
              {customer.stats.cancelledCount > 0 && (
                <CardDescription className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  {customer.stats.cancelledCount} cancelled order{customer.stats.cancelledCount !== 1 ? "s" : ""} excluded from spend total
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {customer.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">Order ID</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Items</TableHead>
                        <TableHead className="text-xs font-semibold">Products</TableHead>
                        <TableHead className="text-xs font-semibold">Total</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Tracking</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders.map((order) => (
                        <TableRow key={order.id}
                          className={`text-sm ${order.orderStatus === "cancelled" ? "bg-red-50/30" : ""}`}>
                          <TableCell className="font-mono text-xs font-semibold py-3">
                            {order.orderNumber || `ORD-${order.id}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-3">
                            {fmtDate(order.createdAt || order.created_at)}
                          </TableCell>
                          <TableCell className="py-3">{order.products?.length || 0}</TableCell>
                          <TableCell className="max-w-[160px] py-3">
                            <p className="truncate text-xs text-muted-foreground">
                              {order.products?.map((p) => p.productName || p.name).join(", ") || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="py-3">
                            <p className={`font-semibold text-sm ${order.orderStatus === "cancelled" ? "line-through text-muted-foreground" : ""}`}>
                              {fmt(order.totalValue || order.finalAmount || order.totalPrice || 0)}
                            </p>
                            {order.orderStatus === "cancelled" && (
                              <p className="text-[10px] text-red-400 flex items-center gap-0.5 mt-0.5">
                                <XCircle className="w-2.5 h-2.5" /> cancelled
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <OrderStatusBadge status={order.orderStatus || "pending"} />
                          </TableCell>
                          <TableCell className="py-3">
                            {order.trackingId ? (
                              <Badge variant="outline" className="text-[11px] flex items-center gap-1 w-fit">
                                <Truck className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{order.trackingId}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {order.trackingId && (
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => window.open(`/track/${order.trackingId}`, "_blank")}>
                                  <Truck className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-base font-semibold">No Orders</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This customer hasn't placed any orders yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Addresses ─── */}
        <TabsContent value="addresses" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Primary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Primary Address
                  </span>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">Default</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.address ? (
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-2 text-sm">
                    {customer.address.name   && <p className="font-semibold text-foreground">{customer.address.name}</p>}
                    {customer.address.phone  && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />{customer.address.phone}
                      </p>
                    )}
                    {customer.address.street && <p className="text-muted-foreground">{customer.address.street}</p>}
                    <p className="text-muted-foreground">
                      {[customer.address.city, customer.address.state].filter(Boolean).join(", ")}
                      {customer.address.pincode ? ` — ${customer.address.pincode}` : ""}
                    </p>
                    {customer.address.country && <p className="text-muted-foreground">{customer.address.country}</p>}
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      {[
                        ["Street",  customer.address.street ],
                        ["City",    customer.address.city   ],
                        ["State",   customer.address.state  ],
                        ["Pincode", customer.address.pincode],
                      ].map(([lbl, val]) => (
                        <div key={lbl}>
                          <p className="font-medium text-foreground">{lbl}</p>
                          <p className="text-muted-foreground">{val || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No primary address</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Additional Addresses
                </CardTitle>
                <CardDescription>{customer.additionalAddresses?.length || 0} saved addresses</CardDescription>
              </CardHeader>
              <CardContent>
                {customer.additionalAddresses?.length > 0 ? (
                  <div className="space-y-3">
                    {customer.additionalAddresses.map((addr, i) => (
                      <div key={i} className="p-4 border border-border rounded-lg space-y-1 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{addr.type || "Address"} {i + 1}</p>
                            {addr.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                          </div>
                          {addr.createdAt && (
                            <span className="text-xs text-muted-foreground">{fmtDate(addr.createdAt, false)}</span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{addr.type || "other"}</Badge>
                          {addr.phone && <span className="text-xs text-muted-foreground">📞 {addr.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No additional addresses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Reviews ─── */}
        <TabsContent value="reviews" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Customer Reviews ({customer.reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.reviews.length > 0 ? (
                <div className="space-y-4">
                  {customer.reviews.map((review, i) => (
                    <div key={i} className="p-4 border border-border rounded-lg space-y-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">Review #{i + 1}</p>
                          {review.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {[...Array(5)].map((_, j) => (
                                <span key={j} className={`text-base ${j < review.rating ? "text-yellow-500" : "text-gray-200"}`}>★</span>
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">({review.rating}/5)</span>
                            </div>
                          )}
                        </div>
                        {review.createdAt && (
                          <span className="text-xs text-muted-foreground">{fmtDate(review.createdAt)}</span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
                      )}
                      {review.productName && (
                        <div className="p-2 bg-muted/40 rounded border border-border/50">
                          <p className="text-xs font-medium">Product: {review.productName}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">No Reviews</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This customer hasn't left any reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};