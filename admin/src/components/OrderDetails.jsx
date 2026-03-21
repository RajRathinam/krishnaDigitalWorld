import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Package, Truck, ShoppingCart, CreditCard,
    MapPin, Phone, Mail, User, Clock, CheckCircle, XCircle,
    BadgePercent, Ticket, Receipt, Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import api from "@/lib/api";

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const fmt = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR",
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount || 0);

const fmtDate = (d) => {
    if (!d) return "N/A";
    try {
        return new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return "N/A"; }
};

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

const STATUS_STYLES = {
    pending:    "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped:    "bg-purple-100 text-purple-800 border-purple-200",
    delivered:  "bg-green-100 text-green-800 border-green-200",
    cancelled:  "bg-red-100 text-red-800 border-red-200",
};
const PAYMENT_STYLES = {
    paid:     "bg-green-100 text-green-800",
    pending:  "bg-yellow-100 text-yellow-800",
    failed:   "bg-red-100 text-red-800",
    refunded: "bg-blue-100 text-blue-800",
};

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export const OrderDetails = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { toast }    = useToast();
    const [order,   setOrder  ] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (id) fetchOrderDetails(); }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/orders/${id}`);
            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                toast({ title: "Error", description: response.data.message || "Failed to load order details", variant: "destructive" });
                navigate("/orders");
            }
        } catch (error) {
            toast({ title: "Error", description: error.message || "Failed to load order details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    /* ── Parse fields ── */
    let orderItems = order.orderItems || [];
    if (typeof orderItems === "string") { try { orderItems = JSON.parse(orderItems); } catch { orderItems = []; } }

    let shippingAddr = order.shippingAddress || {};
    if (typeof shippingAddr === "string") { try { shippingAddr = JSON.parse(shippingAddr); } catch { shippingAddr = {}; } }

    /* ── Price fields (always numbers from enriched endpoint) ── */
    const totalPrice    = parseFloat(order.totalPrice    || 0);
    const shippingCost  = parseFloat(order.shippingCost  || 0);
    const taxAmount     = parseFloat(order.taxAmount     || 0);
    const discount      = parseFloat(order.discountAmount|| 0);
    const finalAmt      = parseFloat(order.finalAmount   || totalPrice + shippingCost + taxAmount - discount);
    const coupon        = order.coupon || null;
    const hasCoupon     = discount > 0 || !!coupon;
    const isCod         = order.paymentMethod === "cod";

    const payMethodLabel =
        isCod                            ? "Cash on Delivery"
        : order.paymentMethod === "upi"  ? "UPI / PhonePe"
        : order.paymentMethod === "card" ? "Card"
        : (order.paymentMethod || "—").toUpperCase();

    /* ── Render ── */
    return (
        <div className="space-y-6 animate-in fade-in-50">

            {/* ── Page header ── */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                        Order {order.orderNumber}
                        <Badge variant="outline" className={`${STATUS_STYLES[order.orderStatus] || "bg-gray-100 text-gray-800 border-gray-200"} capitalize`}>
                            {order.orderStatus}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" /> Placed on {fmtDate(order.createdAt || order.created_at)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ══ Left/Main — 2 cols ══ */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ── Order Items table ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Order Items ({orderItems.length} product{orderItems.length !== 1 ? "s" : ""})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="w-12" />
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right w-28">Price</TableHead>
                                            <TableHead className="text-center w-16">Qty</TableHead>
                                            <TableHead className="text-right w-28">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orderItems.map((item, idx) => {
                                            const imgSrc    = resolveItemImage(item);
                                            const itemPrice = parseFloat(item.price || 0);
                                            const itemQty   = item.quantity || 1;
                                            const itemTotal = parseFloat(item.totalPrice || item.total || itemPrice * itemQty || 0);

                                            return (
                                                <TableRow key={idx} className="hover:bg-muted/20">
                                                    {/* Image */}
                                                    <TableCell className="py-3">
                                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border/40 flex-shrink-0">
                                                            {imgSrc ? (
                                                                <img src={imgSrc} alt={item.name || "Product"}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.style.display = "none"; }} />
                                                            ) : (
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Name + meta */}
                                                    <TableCell className="py-3">
                                                        <p className="font-medium text-sm leading-snug">
                                                            {item.name || item.productName || `Product #${item.productId}`}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {item.colorName && (
                                                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                                    {item.colorName}
                                                                </span>
                                                            )}
                                                            {item.variant && item.variant !== "Standard" && (
                                                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                                    {item.variant}
                                                                </span>
                                                            )}
                                                            {item.code && (
                                                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground flex items-center gap-0.5">
                                                                    <Tag className="w-2.5 h-2.5" />{item.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.product?.sku && (
                                                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                                                SKU: {item.product.sku}
                                                            </p>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right py-3 text-sm">{fmt(itemPrice)}</TableCell>
                                                    <TableCell className="text-center py-3 text-sm font-medium">{itemQty}</TableCell>
                                                    <TableCell className="text-right py-3 text-sm font-semibold">{fmt(itemTotal)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* ── Price breakdown ── */}
                            <div className="mt-4 border border-border rounded-lg overflow-hidden">
                                <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold">Price Breakdown</span>
                                </div>
                                <div className="px-4 py-3 space-y-2">

                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5"> <ShoppingCart className="w-3.5 h-3.5" /> Subtotal</span>
                                        <span className="font-medium">{fmt(totalPrice)}</span>
                                    </div>

                                    {/* Shipping */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5" /> Shipping
                                        </span>
                                        {shippingCost > 0 ? (
                                            <span className="font-medium">{fmt(shippingCost)}</span>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs h-5">
                                                FREE
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Tax */}
                                    {taxAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Tax / GST</span>
                                            <span className="font-medium">{fmt(taxAmount)}</span>
                                        </div>
                                    )}

                                    {/* Coupon discount */}
                                    {hasCoupon && (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-1.5">
                                                    <BadgePercent className="w-3.5 h-3.5 text-violet-600" />
                                                    <span className="text-violet-700 font-medium flex items-center gap-1.5">
                                                        Coupon Discount
                                                        {coupon?.code && (
                                                            <span className="ml-2 font-mono text-xs px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded text-violet-600">
                                                                {coupon.code}
                                                            </span>
                                                        )}<p className="text-[11px] text-violet-600 capitalize">
                                                                {coupon.discountType === "percentage"
                                                                    ? `${coupon.discountValue}% off`
                                                                    : coupon.discountType === "fixed"
                                                                    ? `₹${coupon.discountValue} flat off`
                                                                    : coupon.discountType}
                                                            </p>
                                                    </span>
                                                </span>
                                                <span className="font-semibold text-violet-700">− {fmt(discount)}</span>
                                            </div>

                                            {/* Coupon detail pill */}
                                            {/* {coupon && (
                                                <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mt-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                            <Ticket className="w-3.5 h-3.5 text-violet-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-violet-800 font-mono">{coupon.code}</p>
                                                            <p className="text-[11px] text-violet-600 capitalize">
                                                                {coupon.discountType === "percentage"
                                                                    ? `${coupon.discountValue}% off`
                                                                    : coupon.discountType === "fixed"
                                                                    ? `₹${coupon.discountValue} flat off`
                                                                    : coupon.discountType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-violet-700">− {fmt(discount)}</span>
                                                </div>
                                            )} */}
                                        </>
                                    )}

                                    <Separator />

                                    {/* Grand total */}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-base">Total Paid</span>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-primary">{fmt(finalAmt)}</p>
                                          
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Shipping info ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" /> Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" /> Delivery Address
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-0.5 ml-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                                    {shippingAddr.name   && <p className="font-semibold text-foreground">{shippingAddr.name}</p>}
                                    {shippingAddr.phone  && (
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" />{shippingAddr.phone}
                                        </p>
                                    )}
                                    {shippingAddr.street && <p>{shippingAddr.street}</p>}
                                    <p>
                                        {[shippingAddr.city, shippingAddr.state].filter(Boolean).join(", ")}
                                        {(shippingAddr.pincode || shippingAddr.zipCode) ? ` — ${shippingAddr.pincode || shippingAddr.zipCode}` : ""}
                                    </p>
                                    {shippingAddr.country && <p>{shippingAddr.country}</p>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                    <Truck className="h-4 w-4 text-muted-foreground" /> Tracking
                                </h4>
                                <div className="ml-0">
                                    {order.trackingId ? (
                                        <div className="bg-muted/40 border border-border/50 px-3 py-2 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-0.5">Tracking ID</p>
                                            <p className="text-sm font-mono font-semibold">{order.trackingId}</p>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No tracking info yet</span>
                                    )}
                                </div>
                                {order.notes && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 font-medium">Order Notes</p>
                                        <p className="text-sm text-foreground bg-muted/30 border border-border/40 rounded-lg p-3">
                                            {order.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ══ Sidebar — 1 col ══ */}
                <div className="space-y-6">

                    {/* Customer */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                                    {(order.user?.name || order.customerName || "C").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{order.user?.name || order.customerName || "Guest User"}</p>
                                    <p className="text-xs text-muted-foreground">ID: {order.userId}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <a href={`mailto:${order.user?.email || order.customerEmail}`}
                                        className="hover:underline truncate">
                                        {order.user?.email || order.customerEmail || "N/A"}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span>{order.user?.phone || order.customerPhone || "N/A"}</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full"
                                onClick={() => navigate(`/analytics/customers/${order.userId}`)}>
                                View Profile
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Method + status */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                <div>
                                    <p className="text-sm font-semibold">{payMethodLabel}</p>
                                    <p className="text-xs text-muted-foreground">Payment method</p>
                                </div>
                                <Badge className={`${PAYMENT_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-800"} capitalize border-0 text-xs font-semibold`}>
                                    {order.paymentStatus}
                                </Badge>
                            </div>

                            {/* Transaction IDs */}
                            {order.merchantOrderId && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Merchant Order ID</p>
                                    <code className="text-xs bg-muted w-fit px-2 py-1 rounded block font-mono break-all">
                                        {order.merchantOrderId}
                                    </code>
                                </div>
                            )}
                            {order.phonePeTransactionId && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">PhonePe Transaction ID</p>
                                    <code className="text-xs bg-muted w-fit px-2 py-1 rounded block font-mono break-all">
                                        {order.phonePeTransactionId}
                                    </code>
                                </div>
                            )}
                            {/* {order.phonePeResponse && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Provider Response</p>
                                    <details className="text-[10px] bg-muted p-2 rounded cursor-pointer">
                                        <summary className="text-muted-foreground font-medium">View Raw Response</summary>
                                        <pre className="mt-2 overflow-auto whitespace-pre-wrap text-foreground">
                                            {typeof order.phonePeResponse === "string"
                                                ? order.phonePeResponse
                                                : JSON.stringify(order.phonePeResponse, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )} */}

                            <Separator />

                            {/* Price mini-summary in sidebar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{fmt(totalPrice)}</span>
                                </div>
                                {shippingCost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>{fmt(shippingCost)}</span>
                                    </div>
                                )}
                                {taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{fmt(taxAmount)}</span>
                                    </div>
                                )}
                                {hasCoupon && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-violet-700 flex items-center gap-1">
                                            <BadgePercent className="w-3 h-3" />
                                            Discount{coupon?.code && ` (${coupon.code})`}
                                        </span>
                                        <span className="text-violet-700 font-medium">− {fmt(discount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">Total Paid</span>
                                    <span className="font-bold text-base text-primary">{fmt(finalAmt)}</span>
                                </div>
                              
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coupon status */}
                    {(hasCoupon || order.isCouponProvided !== undefined) && (
                        <Card>
                            <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Loyalty Coupon</span>
                                    </div>
                                    <Badge variant="outline"
                                        className={order.isCouponProvided
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }>
                                        {order.isCouponProvided ? "Provided" : "Not Provided"}
                                    </Badge>
                                </div>
                                {/* {hasCoupon && coupon && (
                                    <div className="mt-3 flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                                        <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                                            <Ticket className="w-3.5 h-3.5 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-violet-800 font-mono">{coupon.code}</p>
                                            <p className="text-[11px] text-violet-600 capitalize">
                                                {coupon.discountType === "percentage"
                                                    ? `${coupon.discountValue}% off`
                                                    : `₹${coupon.discountValue} flat off`}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-violet-700 flex-shrink-0">
                                            − {fmt(discount)}
                                        </span>
                                    </div>
                                )} */}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};