import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Package, Truck, Calendar, CreditCard,
    MapPin, Phone, Mail, User, Clock, CheckCircle, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/orders/${id}`);
            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                toast({
                    title: "Error",
                    description: response.data.message || "Failed to load order details",
                    variant: "destructive",
                });
                navigate("/admin/orders");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load order details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch (e) {
            return "N/A";
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            processing: "bg-blue-100 text-blue-800 border-blue-200",
            shipped: "bg-purple-100 text-purple-800 border-purple-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
        };
        const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
        return (
            <Badge variant="outline" className={`${style} capitalize`}>
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    // Parse order items if string
    const orderItems = typeof order.orderItems === 'string'
        ? JSON.parse(order.orderItems)
        : (order.orderItems || []);

    const shippingAddress = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress || '{}')
        : (order.shippingAddress || {});

    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Order {order.orderNumber}
                        {getStatusBadge(order.orderStatus)}
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" /> Placed on {formatDate(order.createdAt)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 Cols */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" /> Order Items ({orderItems.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orderItems.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <div className="font-medium">{item.productName || item.name}</div>
                                                    {item.variant && <div className="text-xs text-muted-foreground">{item.variant}</div>}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-medium">
                                            <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                                            <TableCell className="text-right">{formatCurrency(order.totalPrice)}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/50 font-bold text-base">
                                            <TableCell colSpan={3} className="text-right">Total Amount</TableCell>
                                            <TableCell className="text-right">{formatCurrency(order.finalAmount || order.totalPrice)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" /> Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" /> Address
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-1 ml-6">
                                    <p className="font-medium text-foreground">{shippingAddress.name}</p>
                                    <p>{shippingAddress.street}</p>
                                    <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
                                    <p>{shippingAddress.country}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" /> Status
                                    </h4>
                                    <div className="ml-6 flex items-center gap-2">
                                        {order.trackingId ? (
                                            <div className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                                Tracking ID: {order.trackingId}
                                            </div>
                                        ) : <span className="text-sm text-muted-foreground">No tracking info</span>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - 1 Col */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {order.user?.name?.charAt(0) || "C"}
                                </div>
                                <div>
                                    <p className="font-medium">{order.user?.name || "Guest User"}</p>
                                    <p className="text-xs text-muted-foreground">ID: {order.userId}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${order.user?.email}`} className="hover:underline">{order.user?.email}</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{order.user?.phone || "N/A"}</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => navigate(`/admin/analytics/customers/${order.userId}`)}>
                                View Profile
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Method:</span>
                                <span className="font-medium capitalize">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                                    {order.paymentStatus}
                                </Badge>
                            </div>
                            {order.paymentId && (
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                                    <code className="text-xs bg-muted p-1 rounded block truncate">{order.paymentId}</code>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
