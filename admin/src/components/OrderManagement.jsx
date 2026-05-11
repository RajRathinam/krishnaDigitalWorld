import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Eye, MapPin, Phone, Mail, Package, Truck,
  XCircle, CheckCircle, MoreVertical, Download, Clock, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, CreditCard, Tag, Ticket,
  BadgePercent, Receipt, ShoppingCart, X, User, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import api from "@/lib/api";

const PAGE_SIZE_OPTIONS = [15, 30, 45, 100];

/* ── helpers ── */
const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount || 0);

const fmtDate = (d) => {
  if (!d) return "N/A";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return "N/A"; }
};

const countItems = (orderItems) => {
  let items = orderItems;
  if (!items) return 0;
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { return 0; } }
  if (!Array.isArray(items)) return 0;
  return items.reduce((t, i) => t + (i.quantity || 0), 0);
};

const getCustomerName  = (o) => o.customerName  || o.user?.name  || o.shippingAddress?.name  || "Unknown Customer";
const getCustomerPhone = (o) => o.customerPhone || o.user?.phone || o.shippingAddress?.phone || "N/A";
const getCustomerEmail = (o) => o.customerEmail || o.user?.email || "N/A";

/* ── badges ── */
const STATUS_STYLES = {
  pending:     { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200"  },
  processing:  { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  shipped:     { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  delivered:   { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
  cancelled:   { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
  provided:    { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
  notprovided: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
};
const PAYMENT_STYLES = {
  paid:     { bg: "bg-green-100",  text: "text-green-800"  },
  pending:  { bg: "bg-yellow-100", text: "text-yellow-800" },
  failed:   { bg: "bg-red-100",    text: "text-red-800"    },
  refunded: { bg: "bg-blue-100",   text: "text-blue-800"   },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
  return (
    <Badge variant="outline" className={`${s.bg} ${s.text} ${s.border} font-medium capitalize`}>
      {status}
    </Badge>
  );
};
const PaymentBadge = ({ status }) => {
  const s = PAYMENT_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  return <Badge variant="secondary" className={`${s.bg} ${s.text} text-xs font-medium capitalize`}>{status}</Badge>;
};

/* ── image resolver ── */
const resolveItemImage = (item) => {
  if (item.image) return getImageUrl(item.image);
  if (item.product?.colorsAndImages && item.colorName) {
    const colorImgs = item.product.colorsAndImages[item.colorName];
    if (Array.isArray(colorImgs) && colorImgs.length > 0) {
      const main = colorImgs.find((i) => i.type === "main");
      const url  = main?.url || colorImgs[0]?.url || null;
      if (url) return getImageUrl(url);
    }
  }
  if (item.product?.images?.length) {
    const first = item.product.images[0];
    const url = typeof first === "string" ? first : first?.url || null;
    if (url) return getImageUrl(url);
  }
  return null;
};

/* ══════════════════════════════════════════════════════
   CANCEL CONFIRM DIALOG
══════════════════════════════════════════════════════ */
function CancelConfirmDialog({ order, onConfirm, onClose, isLoading }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const orderNumber  = order?.orderNumber || "";
  const customerName = getCustomerName(order || {});
  const finalAmt     = parseFloat(order?.finalAmount || order?.totalPrice || 0);
  const isMatch      = inputValue.trim() === orderNumber;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Cancel Order?</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Order Number</span>
              <span className="text-xs font-mono font-bold text-foreground">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Customer</span>
              <span className="text-xs font-medium text-foreground">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Amount</span>
              <span className="text-xs font-bold text-foreground">{fmt(finalAmt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <StatusBadge status={order?.orderStatus || "pending"} />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              Cancelling this order will restore stock and may trigger a refund for online payments.
              This action is permanent and cannot be reversed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-order-id" className="text-sm font-medium">
              Type the order number to confirm
            </Label>
            <p className="text-xs text-muted-foreground">
              Enter{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-foreground">
                {orderNumber}
              </code>{" "}
              below to proceed
            </p>
            <Input
              id="confirm-order-id"
              ref={inputRef}
              placeholder={orderNumber}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && isMatch && !isLoading) onConfirm(); }}
              className={`font-mono transition-colors ${
                inputValue.length > 0
                  ? isMatch
                    ? "border-green-400 focus-visible:ring-green-300 bg-green-50/50"
                    : "border-red-300 focus-visible:ring-red-200"
                  : ""
              }`}
            />
            {inputValue.length > 0 && (
              <p className={`text-xs flex items-center gap-1 ${isMatch ? "text-green-600" : "text-red-500"}`}>
                {isMatch
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Order number matches — you can proceed</>
                  : <><XCircle className="w-3.5 h-3.5" /> Order number does not match</>
                }
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Keep Order</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!isMatch || isLoading} className="min-w-[130px]">
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling…</>
              : <><XCircle className="w-4 h-4 mr-2" /> Cancel Order</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════
   ORDER DETAIL MODAL
══════════════════════════════════════════════════════ */
function OrderDetailModal({ orderId, onClose, onUpdateStatus, onRequestCancel }) {
  const [order,   setOrder  ] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast }             = useToast();

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setOrder(null);
      try {
        const res = await api.get(`/admin/orders/${orderId}`);
        if (!cancelled && res.data?.success) setOrder(res.data.data);
        else if (!cancelled) toast({ title: "Error", description: "Failed to load order details", variant: "destructive" });
      } catch (e) {
        if (!cancelled) toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  const parseAddr = (addr) => {
    if (!addr) return null;
    if (typeof addr === "string") { try { return JSON.parse(addr); } catch { return null; } }
    return typeof addr === "object" ? addr : null;
  };

  const addr         = order ? parseAddr(order.shippingAddress) : null;
  const totalPrice   = parseFloat(order?.totalPrice    || 0);
  const shippingCost = parseFloat(order?.shippingCost  || 0);
  const taxAmount    = parseFloat(order?.taxAmount     || 0);
  const discount     = parseFloat(order?.discountAmount|| 0);
  const finalAmt     = parseFloat(order?.finalAmount   || totalPrice + shippingCost + taxAmount - discount);
  const coupon       = order?.coupon || null;
  const hasCoupon    = discount > 0 || !!coupon;
  const isCod        = order?.paymentMethod === "cod";

  let items = order?.orderItems || [];
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { items = []; } }

  const orderStatus   = order?.orderStatus   || "pending";
  const paymentStatus = order?.paymentStatus || "pending";
  const payMethodLabel =
    isCod                             ? "Cash on Delivery"
    : order?.paymentMethod === "upi"  ? "UPI / PhonePe"
    : order?.paymentMethod === "card" ? "Card"
    : (order?.paymentMethod || "—").toUpperCase();

  const ModalSkeleton = () => (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16 rounded-lg"/>)}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Order Details
            {order && <StatusBadge status={orderStatus} />}
          </DialogTitle>
          <DialogDescription>
            {order?.orderNumber && `Order ID: ${order.orderNumber}`}
            {order?.trackingId  && ` • Tracking: ${order.trackingId}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? <ModalSkeleton /> : order && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Order Date",     value: fmtDate(order.createdAt || order.created_at) },
                { label: "Payment Method", value: payMethodLabel },
                { label: "Payment Status", value: <PaymentBadge status={paymentStatus} /> },
                { label: "Total Amount",   value: <span className="font-bold text-primary">{fmt(finalAmt)}</span> },
              ].map((item, i) => (
                <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/60">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <div className="font-medium text-sm text-foreground">{item.value}</div>
                </div>
              ))}
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="items">Items ({countItems(items)})</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" /> Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div>
                        <p className="text-sm font-semibold">{payMethodLabel}</p>
                        <p className="text-xs text-muted-foreground">Payment method</p>
                      </div>
                      <PaymentBadge status={paymentStatus} />
                    </div>
                    {(order.merchantOrderId || order.phonePeTransactionId) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {order.merchantOrderId && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Merchant Order ID</p>
                            <code className="text-xs bg-muted w-fit px-2 py-1 rounded block font-mono break-all">{order.merchantOrderId}</code>
                          </div>
                        )}
                        {order.phonePeTransactionId && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">PhonePe Transaction ID</p>
                            <code className="text-xs bg-muted w-fit px-2 py-1 rounded block font-mono break-all">{order.phonePeTransactionId}</code>
                          </div>
                        )}
                      </div>
                    )}
                    {order.trackingId && (
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Tracking ID:</span>
                        <span className="font-mono font-medium">{order.trackingId}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1">Order Notes</p>
                        <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 border border-border/40">{order.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addr ? (
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-0.5">
                        {addr.name   && <p className="font-semibold text-sm">{addr.name}</p>}
                        {addr.phone  && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{addr.phone}</p>}
                        {addr.street && <p className="text-sm text-muted-foreground">{addr.street}</p>}
                        <p className="text-sm text-muted-foreground">
                          {[addr.city, addr.state].filter(Boolean).join(", ")}
                          {(addr.pincode || addr.zipCode) ? ` — ${addr.pincode || addr.zipCode}` : ""}
                        </p>
                        {addr.country && <p className="text-sm text-muted-foreground">{addr.country}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No address provided</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-muted-foreground" /> Price Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({countItems(items)} items)</span>
                      <span className="font-medium">{fmt(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                      {shippingCost > 0
                        ? <span className="font-medium">{fmt(shippingCost)}</span>
                        : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">FREE</Badge>
                      }
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax / GST</span>
                        <span className="font-medium">{fmt(taxAmount)}</span>
                      </div>
                    )}
                    {hasCoupon && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <BadgePercent className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-violet-700 font-medium flex items-center gap-1.5">
                            Coupon Discount
                            {coupon?.code && (
                              <span className="font-mono text-xs px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded text-violet-600">
                                {coupon.code}
                              </span>
                            )}
                            {coupon?.discountType && (
                              <span className="text-[11px] text-violet-500">
                                ({coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}% off`
                                  : coupon.discountType === "fixed"
                                  ? `₹${coupon.discountValue} flat off`
                                  : coupon.discountType})
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="font-semibold text-violet-700">− {fmt(discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-base">Total Paid</span>
                      <span className="font-bold text-lg text-primary">{fmt(finalAmt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Loyalty Coupon</span>
                      <span className="text-xs text-muted-foreground">(admin-issued after delivery)</span>
                    </div>
                    <StatusBadge status={order.isCouponProvided ? "provided" : "notprovided"} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customer */}
              <TabsContent value="customer" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Customer Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        {getCustomerName(order).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{getCustomerName(order)}</p>
                        <p className="text-sm text-muted-foreground">Customer ID: {order.userId || order.user?.id || "N/A"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span>{getCustomerPhone(order)}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" /><span className="break-all">{getCustomerEmail(order)}</span></div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Delivery Address</p>
                      {addr ? (
                        <div className="text-sm text-muted-foreground space-y-0.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                          {addr.name   && <p className="font-semibold text-foreground">{addr.name}</p>}
                          {addr.street && <p>{addr.street}</p>}
                          <p>{[addr.city, addr.state].filter(Boolean).join(", ")}{(addr.pincode || addr.zipCode) ? ` — ${addr.pincode || addr.zipCode}` : ""}</p>
                          {addr.country && <p>{addr.country}</p>}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">No address provided</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Items */}
              <TabsContent value="items" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Order Items ({countItems(items)} items · {items.length} product{items.length !== 1 ? "s" : ""})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const imgSrc    = resolveItemImage(item);
                        const itemPrice = parseFloat(item.price || 0);
                        const itemQty   = item.quantity || 1;
                        const itemTotal = parseFloat(item.totalPrice || item.total || itemPrice * itemQty || 0);
                        return (
                          <div key={index} className="flex items-start justify-between p-4 border border-border rounded-lg gap-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/40">
                                {imgSrc
                                  ? <img src={imgSrc} alt={item.name || "Product"} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                                  : <Package className="h-6 w-6 text-muted-foreground" />
                                }
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm leading-snug">{item.name || item.productName || `Product #${item.productId}`}</h4>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  {item.code      && <div className="flex items-center gap-1"><Tag className="h-3 w-3" /> Code: {item.code}</div>}
                                  {item.colorName && <div>Color: {item.colorName}</div>}
                                  {item.variant   && <div>Variant: {item.variant}</div>}
                                  <div>Quantity: {itemQty}</div>
                                  <div>Price: {fmt(itemPrice)} each</div>
                                  {item.tax && <div>Tax: {item.tax}%</div>}
                                  {item.product?.sku && <div className="font-mono">SKU: {item.product.sku}</div>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm">{fmt(itemTotal)}</p>
                              <p className="text-xs text-muted-foreground mt-1">{itemQty} × {fmt(itemPrice)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{fmt(totalPrice)}</span></div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          {shippingCost > 0 ? <span>{fmt(shippingCost)}</span> : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">FREE</Badge>}
                        </div>
                        {taxAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax / GST</span><span>{fmt(taxAmount)}</span></div>}
                        {hasCoupon && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <BadgePercent className="w-3.5 h-3.5 text-violet-600" />
                              <span className="text-violet-700 font-medium">Coupon{coupon?.code && ` (${coupon.code})`}</span>
                            </span>
                            <span className="text-violet-700 font-semibold">− {fmt(discount)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center pt-1">
                          <span className="font-bold">Total Paid</span>
                          <span className="font-bold text-lg text-primary">{fmt(finalAmt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Close</Button>
              {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => onRequestCancel(order)}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                </Button>
              )}
              <Button onClick={() => onUpdateStatus(order)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Update Status
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export const OrderManagement = () => {
  const navigate = useNavigate();

  const [orders, setOrders]                           = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [searchTerm, setSearchTerm]                   = useState("");
  const [filterStatus, setFilterStatus]               = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [selectedOrderId, setSelectedOrderId]         = useState(null);
  const [orderToUpdate, setOrderToUpdate]             = useState(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen]   = useState(false);
  const [updateStatus, setUpdateStatus]               = useState("");
  const [trackingId, setTrackingId]                   = useState("");
  const [notes, setNotes]                             = useState("");
  const [pageSize, setPageSize]                       = useState(15);
  const [pagination, setPagination]                   = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [stats, setStats]                             = useState({
    total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0,
    revenue: 0, monthlyRevenue: 0, weeklyRevenue: 0,
    // ── NEW: track cancelled amounts separately ──
    cancelledRevenue: 0, cancelledMonthlyRevenue: 0, cancelledWeeklyRevenue: 0,
  });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  /* ── fetch orders ── */
  const fetchOrders = async (page = 1, limit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(), limit: limit.toString(),
        sortBy: "created_at", sortOrder: "desc",
      });
      if (filterStatus !== "all")        params.append("status",        filterStatus);
      if (filterPaymentMethod !== "all") params.append("paymentMethod", filterPaymentMethod);
      if (searchTerm)                    params.append("search",        searchTerm);

      const response = await api.get(`/admin/orders?${params}`);
      if (!response.data.success) throw new Error(response.data.data?.message || "Failed to fetch orders");

      const ordersData     = response.data.data.orders     || [];
      const paginationData = response.data.data.pagination || { page, limit, total: 0, totalPages: 1 };
      const serverCounts   = response.data.data.statusCounts || {};
      const serverRevenue          = response.data.data.totalRevenue          ?? 0; // non-cancelled paid only (after backend fix)
      const serverCancelledRevenue = response.data.data.cancelledRevenue      ?? null; // null = backend not yet updated

      setOrders(ordersData);
      setPagination(paginationData);

      /* ── Revenue calculations — CLIENT SIDE (current page only)
         Split into paid-non-cancelled vs cancelled buckets ── */
      const now          = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek  = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      let activeRev            = 0;
      let monthlyRev           = 0;
      let weeklyRev            = 0;
      let cancelledRev         = 0;
      let cancelledMonthlyRev  = 0;
      let cancelledWeeklyRev   = 0;

      ordersData.forEach((o) => {
        const amt              = parseFloat(o.finalAmount || 0);
        const d                = new Date(o.createdAt || o.created_at);
        const isCancelledOrder = o.orderStatus === "cancelled";

        if (isCancelledOrder) {
          cancelledRev += amt;
          if (d >= startOfMonth) cancelledMonthlyRev += amt;
          if (d >= startOfWeek)  cancelledWeeklyRev  += amt;
        } else if (o.paymentStatus === "paid") {
          activeRev  += amt;
          if (d >= startOfMonth) monthlyRev += amt;
          if (d >= startOfWeek)  weeklyRev  += amt;
        }
      });

      // If backend sends cancelledRevenue it means it already excludes cancelled from totalRevenue.
      // Otherwise fall back to client-side activeRev (current page only, but correctly filtered).
      const resolvedTotalRevenue = serverCancelledRevenue !== null
        ? serverRevenue
        : activeRev;

      setStats({
        total:      paginationData.total,
        pending:    serverCounts.pending    || 0,
        processing: serverCounts.processing || 0,
        shipped:    serverCounts.shipped    || 0,
        delivered:  serverCounts.delivered  || 0,
        cancelled:  serverCounts.cancelled  || 0,
        revenue:         resolvedTotalRevenue,
        monthlyRevenue:  monthlyRev,
        weeklyRevenue:   weeklyRev,
        cancelledRevenue:        serverCancelledRevenue ?? cancelledRev,
        cancelledMonthlyRevenue: cancelledMonthlyRev,
        cancelledWeeklyRevenue:  cancelledWeeklyRev,
      });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to fetch orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1, pageSize); }, [filterStatus, filterPaymentMethod, searchTerm]);

  const handlePageSizeChange = (newSize) => { setPageSize(newSize); fetchOrders(1, newSize); };

  const updateOrderStatusApi = async (orderId, statusData) => {
    const response = await api.put(`/admin/orders/${orderId}/status`, statusData);
    if (response.data.success) return { success: true, data: response.data.data };
    throw new Error(response.data.message || "Failed to update order status");
  };

  /* ── recalcStats also excludes cancelled from revenue ── */
  const recalcStats = (list, total) => {
    // Only sum non-cancelled orders for revenue
    const revenue = list
      .filter(o => o.orderStatus !== "cancelled")
      .reduce((s, o) => s + parseFloat(o.finalAmount || o.totalPrice || 0), 0);

    const cancelledRevenue = list
      .filter(o => o.orderStatus === "cancelled")
      .reduce((s, o) => s + parseFloat(o.finalAmount || o.totalPrice || 0), 0);

    setStats(prev => ({
      ...prev,
      total:      total ?? list.length,
      pending:    list.filter(o => o.orderStatus === "pending").length,
      processing: list.filter(o => o.orderStatus === "processing").length,
      shipped:    list.filter(o => o.orderStatus === "shipped").length,
      delivered:  list.filter(o => o.orderStatus === "delivered").length,
      cancelled:  list.filter(o => o.orderStatus === "cancelled").length,
      revenue,
      cancelledRevenue,
    }));
  };

  const requestCancel = (order) => {
    setSelectedOrderId(null);
    setCancelTarget(order);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      const result = await updateOrderStatusApi(cancelTarget.id, { status: "cancelled" });
      if (result.success) {
        const updated = orders.map(o => o.id === cancelTarget.id ? { ...o, orderStatus: "cancelled" } : o);
        setOrders(updated);
        recalcStats(updated, pagination.total);
        toast({ title: "Order Cancelled", description: `${cancelTarget.orderNumber} has been cancelled.` });
        setCancelTarget(null);
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to cancel", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!orderToUpdate || !updateStatus) return;
    try {
      const result = await updateOrderStatusApi(orderToUpdate.id, {
        status: updateStatus,
        trackingId: trackingId || undefined,
        notes: notes || undefined,
      });
      if (result.success) {
        toast({ title: "Success", description: "Order status updated successfully" });
        const updated = orders.map(o =>
          o.id === orderToUpdate.id
            ? { ...o, orderStatus: updateStatus, trackingId: trackingId || o.trackingId }
            : o
        );
        setOrders(updated);
        recalcStats(updated, pagination.total);
        setIsUpdateDialogOpen(false);
        setUpdateStatus(""); setTrackingId(""); setNotes("");
        setOrderToUpdate(null);
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    }
  };

  const updateCodPaymentStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/payment`, { status: newStatus });
      if (res.data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o));
        toast({ title: "Success", description: `Payment marked as ${newStatus}` });
        await fetchOrders(pagination.page, pageSize);
      } else throw new Error(res.data.message);
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to update payment", variant: "destructive" });
    }
  };

  const handleExportOrders = () => {
    if (!orders.length) { toast({ title: "No orders to export", variant: "destructive" }); return; }
    const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s; };
    const headers = ["Order Number","Customer","Phone","Email","Date","Status","Amount","Payment Method","Payment Status","Items","Tracking ID"].join(",");
    const rows = orders.map(o => [
      o.orderNumber, getCustomerName(o), getCustomerPhone(o), getCustomerEmail(o),
      fmtDate(o.createdAt), o.orderStatus, o.finalAmount || o.totalPrice || 0,
      o.paymentMethod || "COD", o.paymentStatus || "pending",
      countItems(o.orderItems), o.trackingId || "",
    ].map(esc).join(","));
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `orders_${new Date().toISOString().slice(0,10)}.csv`,
    });
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Exported", description: `${orders.length} orders exported` });
  };

  /* ── stat card config with optional "cancelled sub-line" ── */
  const statCards = loading ? [] : [
    {
      label: "Total Revenue",
      value: fmt(stats.revenue),
      icon: CreditCard, color: "text-green-600", bg: "bg-green-100",
      // show cancelled amount below only if there's any
      cancelledAmt: stats.cancelledRevenue,
    },
    {
      label: "Monthly Revenue",
      value: fmt(stats.monthlyRevenue),
      icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100",
      cancelledAmt: stats.cancelledMonthlyRevenue,
    },
    {
      label: "Weekly Revenue",
      value: fmt(stats.weeklyRevenue),
      icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100",
      cancelledAmt: stats.cancelledWeeklyRevenue,
    },
    { label: "Total Orders",  value: pagination.total,   icon: Package,     color: "text-primary",     bg: "bg-primary/10"  },
    { label: "Pending",       value: stats.pending,      icon: Clock,       color: "text-yellow-600",  bg: "bg-yellow-100"  },
    { label: "Processing",    value: stats.processing,   icon: RefreshCw,   color: "text-indigo-600",  bg: "bg-indigo-100"  },
    { label: "Shipped",       value: stats.shipped,      icon: Truck,       color: "text-orange-600",  bg: "bg-orange-100"  },
    { label: "Delivered",     value: stats.delivered,    icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  /* ── render ── */
  return (
    <div className="space-y-6">

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">Manage and track all customer orders</p>
      </div>
      <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportOrders} disabled={loading || !orders.length}>
            <Download className="h-4 w-4 mr-2" /> Export
        </Button>
          <Button variant="outline" onClick={() => fetchOrders(pagination.page, pageSize)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
    </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({length:8}).map((_,i) => (
              <Card key={i}><CardContent className="p-4">
        <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-3 w-20"/><Skeleton className="h-6 w-16"/></div>
          </div>
              </CardContent></Card>
            ))
          : statCards.map((s, i) => (
              <Card key={i}><CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold">{s.value}</p>
                    {/* ── Cancelled sub-line — only on revenue cards ── */}
                    {s.cancelledAmt > 0 && (
                      <p className="text-[10px] text-red-400 flex items-center gap-0.5 mt-0.5 leading-tight">
                        <XCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {fmt(s.cancelledAmt)} cancelled
                      </p>
                    )}
          </div>
        </div>
              </CardContent></Card>
            ))
        }
</div>

      {/* Filters */}
    <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[{key:"all",label:"All Orders"},{key:"cod",label:"COD"},{key:"online",label:"Online"}].map(tab => (
              <button key={tab.key} onClick={() => setFilterPaymentMethod(tab.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all ${
                  filterPaymentMethod === tab.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search order ID, customer, phone..." className="pl-9"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchOrders(1, pageSize)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchOrders(1, pageSize)} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{loading ? "Loading..." : "Search"}</span>
            </Button>
          </div>
      </CardContent>
    </Card>

      {/* Table */}
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
        <CardTitle>Orders</CardTitle>
            <CardDescription>Showing {orders.length} of {pagination.total} orders</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={pageSize.toString()} onValueChange={v => handlePageSizeChange(parseInt(v))} disabled={loading}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZE_OPTIONS.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
      </CardHeader>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rowCount={10} columnCount={9} /> : orders.length === 0 ? (
            <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || filterStatus !== "all" ? "Try adjusting your search or filter" : "No orders yet"}
              </p>
              {(searchTerm || filterStatus !== "all") && (
                <Button variant="outline" className="mt-4"
                  onClick={() => { setSearchTerm(""); setFilterStatus("all"); fetchOrders(1, pageSize); }}>
            Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[1100px]">
              <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[170px] text-xs font-semibold">Order ID</TableHead>
                      <TableHead className="w-[180px] text-xs font-semibold">Customer</TableHead>
                      <TableHead className="w-[80px]  text-xs font-semibold">Items</TableHead>
                      <TableHead className="w-[120px] text-xs font-semibold">Amount</TableHead>
                      <TableHead className="w-[160px] text-xs font-semibold">Date</TableHead>
                      <TableHead className="w-[110px] text-xs font-semibold">Delivery</TableHead>
                      <TableHead className="w-[140px] text-xs font-semibold">Payment</TableHead>
                      <TableHead className="w-[110px] text-xs font-semibold">Coupon</TableHead>
                      <TableHead className="w-[80px]  text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {orders.map((order) => {
                      const isCod = order.paymentMethod === "cod";
                      const disc  = parseFloat(order.discountAmount || 0);
                      return (
                        <TableRow key={order.id} className={`text-sm ${order.orderStatus === "cancelled" ? "bg-red-50/30" : ""}`}>
                          <TableCell className="align-middle py-3">
                            <p className="font-mono text-xs font-semibold truncate max-w-[150px]" title={order.orderNumber}>{order.orderNumber}</p>
                            {order.trackingId && (
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                <Truck className="h-2.5 w-2.5" /><span className="truncate max-w-[130px]">{order.trackingId}</span>
                              </p>
                            )}
                  </TableCell>
                          <TableCell className="align-middle py-3">
                            <p className="font-medium truncate max-w-[160px] text-sm">{getCustomerName(order)}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-2.5 w-2.5" />{getCustomerPhone(order)}</p>
                  </TableCell>
                          <TableCell className="align-middle py-3">
                            <span className="font-semibold">{countItems(order.orderItems)}</span>
                            <span className="text-muted-foreground text-[11px]"> items</span>
                  </TableCell>
                          <TableCell className="align-middle py-3">
                            <p className={`font-semibold text-sm ${order.orderStatus === "cancelled" ? "line-through text-muted-foreground" : ""}`}>
                              {fmt(order.finalAmount || order.totalPrice || 0)}
                            </p>
                            {order.orderStatus === "cancelled" && (
                              <p className="text-[10px] text-red-400 flex items-center gap-0.5 mt-0.5">
                                <XCircle className="w-2.5 h-2.5" /> cancelled
                              </p>
                            )}
                            {order.orderStatus !== "cancelled" && disc > 0 && (
                              <p className="text-[10px] text-violet-600 flex items-center gap-0.5 mt-0.5">
                                <BadgePercent className="w-2.5 h-2.5" />−{fmt(disc)}
                              </p>
                            )}
                  </TableCell>
                          <TableCell className="align-middle py-3">
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(order.createdAt)}</p>
                  </TableCell>
                          <TableCell className="align-middle py-3"><StatusBadge status={order.orderStatus} /></TableCell>
                          <TableCell className="align-middle py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isCod ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                  {isCod ? "COD" : (order.paymentMethod || "").toUpperCase()}
                      </span>
                                <PaymentBadge status={order.paymentStatus} />
                              </div>
                              {(order.phonePeTransactionId || order.merchantOrderId) && (
                                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                  {order.phonePeTransactionId || order.merchantOrderId}
                                </p>
                              )}
                    </div>
                  </TableCell>
                          <TableCell className="align-middle py-3">
                            <StatusBadge status={order.isCouponProvided ? "provided" : "notprovided"} />
                          </TableCell>
                          <TableCell className="text-right align-middle py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedOrderId(order.id)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                                  setOrderToUpdate(order);
                            setUpdateStatus(order.orderStatus);
                            setTrackingId(order.trackingId || "");
                            setIsUpdateDialogOpen(true);
                          }}>
                                  <RefreshCw className="h-4 w-4 mr-2" /> Update Delivery Status
                          </DropdownMenuItem>
                                {order.paymentMethod === "cod" && (
                                  order.paymentStatus !== "paid" ? (
                                    <DropdownMenuItem onClick={() => updateCodPaymentStatus(order.id, "paid")} className="text-green-600 focus:text-green-700">
                                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Payment as Paid
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => updateCodPaymentStatus(order.id, "pending")} className="text-yellow-600 focus:text-yellow-700">
                                      <Clock className="h-4 w-4 mr-2" /> Mark Payment as Unpaid
                                    </DropdownMenuItem>
                                  )
                                )}
                                {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                                  <DropdownMenuItem onClick={() => requestCancel(order)} className="text-destructive focus:text-destructive">
                                    <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                                  </DropdownMenuItem>
                                )}
                                {!order.isCouponProvided && order.paymentStatus === "paid" && (
                                  <DropdownMenuItem onClick={() => navigate(`/user-coupons?userId=${order.userId}&orderId=${order.id}`)}>
                                    <Ticket className="h-4 w-4 mr-2" /> Provide Coupon
                                  </DropdownMenuItem>
                                )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-6 pb-6">
            <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page-1)*pagination.limit+1} to{" "}
                    {Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => fetchOrders(pagination.page-1, pageSize)} disabled={pagination.page===1||loading}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                      {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                        let p;
                        if      (pagination.totalPages <= 5)                 p = i + 1;
                        else if (pagination.page <= 3)                       p = i + 1;
                        else if (pagination.page >= pagination.totalPages-2) p = pagination.totalPages-4+i;
                        else                                                 p = pagination.page-2+i;
                        return (
                          <Button key={p} variant={pagination.page===p?"default":"outline"} size="sm"
                            className="h-8 w-8" onClick={() => fetchOrders(p, pageSize)} disabled={loading}>{p}</Button>
                        );
                })}
              </div>
                    <Button variant="outline" size="sm" onClick={() => fetchOrders(pagination.page+1, pageSize)} disabled={pagination.page===pagination.totalPages||loading}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
                    </div>
              )}
            </>
          )}
                </CardContent>
              </Card>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRequestCancel={(order) => requestCancel(order)}
          onUpdateStatus={(order) => {
            setOrderToUpdate(order);
            setUpdateStatus(order.orderStatus);
            setTrackingId(order.trackingId || "");
            setSelectedOrderId(null);
              setIsUpdateDialogOpen(true);
          }}
        />
      )}

      {cancelTarget && (
        <CancelConfirmDialog
          order={cancelTarget}
          isLoading={isCancelling}
          onConfirm={confirmCancel}
          onClose={() => { if (!isCancelling) setCancelTarget(null); }}
        />
      )}

    <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
              Update status for: <span className="font-mono font-semibold">{orderToUpdate?.orderNumber}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
              <Label>Order Status *</Label>
            <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
            {updateStatus === "shipped" && (
              <div className="space-y-2">
            <Label htmlFor="trackingId">Tracking ID</Label>
                <Input id="trackingId" placeholder="Enter tracking ID" value={trackingId} onChange={e => setTrackingId(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
              </div>
            )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Add notes about this status update..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => { setIsUpdateDialogOpen(false); setUpdateStatus(""); setTrackingId(""); setNotes(""); }}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={!updateStatus}>Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
};

export default OrderManagement;