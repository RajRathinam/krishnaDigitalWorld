"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, ShoppingBag, Package, DollarSign, Tag, Clock, Eye, Truck, Loader2, CreditCard, CalendarDays, UserCheck, UserX, Home, Award, Hash, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import api from "@/lib/api";

export const CustomerDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const customerId = params.id;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);
  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${customerId}`);
      if (response.data.success && response.data.data) {
        const customerData = response.data.data;
        console.log("Customer details:", customerData);
        if (customerData.orders?.length > 0) {
          console.log("First Order Data:", customerData.orders[0]);
          console.log("First Order Items:", customerData.orders[0].products);
        }
        // Map API response to our Customer interface
        setCustomer({
          id: customerData.id?.toString() || customerId,
          customerCode: customerData.customerCode || `CUST${customerData.id || customerId}`,
          name: customerData.name || "Unknown Customer",
          email: customerData.email || "",
          phone: customerData.phone || "",
          role: customerData.role || "customer",
          dateOfBirth: customerData.dateOfBirth,
          isVerified: customerData.isVerified || false,
          isActive: customerData.isActive !== undefined ? customerData.isActive : true,
          giftReceived: customerData.giftReceived || false,
          createdAt: customerData.created_at || customerData.createdAt || new Date().toISOString(),
          updatedAt: customerData.updated_at || customerData.updatedAt || new Date().toISOString(),
          address: customerData.address,
          additionalAddresses: customerData.additionalAddresses || [],
          stats: customerData.stats || {
            orderCount: 0,
            totalSpent: 0,
            avgOrderValue: 0,
          },
          orders: customerData.orders || [],
          reviews: customerData.reviews || [],
        });
      }
      else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to load customer details",
          variant: "destructive",
        });
        navigate("/admin/analytics");
      }
    }
    catch (error) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load customer details",
        variant: "destructive",
      });
      navigate("/admin/analytics");
    }
    finally {
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
  const formatDate = (dateString, includeTime = true) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  };
  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { variant: "default", color: "bg-blue-100 text-blue-800" },
      shipped: { variant: "outline", color: "bg-purple-100 text-purple-800" },
      delivered: { variant: "success", color: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive", color: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (<span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>);
  };
  if (loading) {
    return (<div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Loading customer details...</p>
      </div>
    </div>);
  }
  if (!customer) {
    return (<div className="text-center py-12">
      <UserX className="h-12 w-12 mx-auto text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Customer not found</h3>
      <p className="mt-2 text-muted-foreground">
        The customer you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate("/admin/analytics")} className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
      </Button>
    </div>);
  }
  const isTodayBirthday = () => {
    if (!customer.dateOfBirth)
      return false;
    const today = new Date();
    const birthDate = new Date(customer.dateOfBirth);
    return (today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate());
  };
  const calculateAge = () => {
    if (!customer.dateOfBirth)
      return null;
    const birthDate = new Date(customer.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  return (<div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin/analytics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> {customer.customerCode}
            </span>
            <Badge variant={customer.isActive ? "success" : "destructive"}>
              {customer.isActive ? "Active" : "Inactive"}
            </Badge>
            {customer.isVerified && (<Badge variant="outline" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Verified
            </Badge>)}
            {isTodayBirthday() && (<Badge variant="default" className="bg-pink-100 text-pink-700 hover:bg-pink-100">
              <Award className="h-3 w-3 mr-1" /> Birthday Today!
            </Badge>)}
            {customer.giftReceived && (<Badge variant="outline" className="bg-green-50 text-green-700">
              <Award className="h-3 w-3 mr-1" /> Gift Received
            </Badge>)}
          </div>
        </div>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{customer.stats?.orderCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(customer.stats?.totalSpent || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(customer.stats?.avgOrderValue || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-2xl font-bold">
                {new Date(customer.createdAt).getFullYear()}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(customer.createdAt, false)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Main Content Tabs */}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="orders">Orders ({customer.orders.length})</TabsTrigger>
        <TabsTrigger value="addresses">
          Addresses ({1 + (customer.additionalAddresses?.length || 0)})
        </TabsTrigger>
        <TabsTrigger value="reviews">Reviews ({customer.reviews.length})</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="text-muted-foreground">
                    {customer.email || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span className="text-muted-foreground">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date of Birth:</span>
                  <span className="text-muted-foreground">
                    {customer.dateOfBirth ? (<>
                      {formatDate(customer.dateOfBirth, false)}
                      {calculateAge() && ` (${calculateAge()} years)`}
                    </>) : ("Not provided")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline">{customer.role}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span className="text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                  <span className="text-muted-foreground">
                    {formatDate(customer.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Primary Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.address ? (<div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {customer.address.fullAddress ||
                        `${customer.address.street}, ${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium">City</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">State</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.state || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pincode</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.pincode}
                    </p>
                  </div>
                </div>
              </div>) : (<div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No address provided</p>
              </div>)}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Recent Orders
              </span>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                View All ({customer.orders.length})
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length > 0 ? (<div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.slice(0, 5).map((order) => (<TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber ||
                        order.trackingId ||
                        `ORD-${order.id}`}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt || order.created_at, false)}
                    </TableCell>
                    <TableCell>{order.products?.length || 0} items</TableCell>
                    <TableCell>
                      {formatCurrency(order.totalValue || order.totalPrice || 0)}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(order.orderStatus || "pending")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/orders/${order.id}`);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>))}
                </TableBody>
              </Table>
            </div>) : (<div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No orders yet</p>
            </div>)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Orders Tab */}
      <TabsContent value="orders" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> All Orders ({customer.orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length > 0 ? (<div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (<TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber ||
                        order.trackingId ||
                        `ORD-${order.id}`}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt || order.created_at)}
                    </TableCell>
                    <TableCell>{order.products?.length || 0}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {order.products
                          ?.map((p) => p.productName || p.name)
                          .join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(order.totalValue || order.totalPrice || 0)}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(order.orderStatus || "pending")}
                    </TableCell>
                    <TableCell>
                      {order.trackingId ? (<Badge variant="outline" className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {order.trackingId}
                      </Badge>) : (<span className="text-muted-foreground">
                        Not shipped
                      </span>)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/orders/${order.id}`);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/track/${order.trackingId}`, "_blank")} disabled={!order.trackingId}>
                          <Truck className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>))}
                </TableBody>
              </Table>
            </div>) : (<div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Orders</h3>
              <p className="mt-2 text-muted-foreground">
                This customer hasn't placed any orders yet.
              </p>
            </div>)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Addresses Tab */}
      <TabsContent value="addresses" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Primary Address
                </span>
                <Badge variant="default">Default</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.address ? (<div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Full Address</p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {customer.address.fullAddress ||
                      `${customer.address.street}, ${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium">Street</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.street}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">City</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">State</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.state || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pincode</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.address.pincode}
                    </p>
                  </div>
                </div>
              </div>) : (<div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No primary address</p>
              </div>)}
            </CardContent>
          </Card>

          {/* Additional Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Additional Addresses
              </CardTitle>
              <CardDescription>
                {customer.additionalAddresses?.length || 0} saved addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.additionalAddresses &&
                customer.additionalAddresses.length > 0 ? (<div className="space-y-4">
                  {customer.additionalAddresses.map((address, index) => (<div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {address.type || "Address"} {index + 1}
                        </p>
                        {address.isDefault && (<Badge variant="outline" className="mt-1">
                          Default
                        </Badge>)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {address.createdAt
                          ? formatDate(address.createdAt, false)
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.street}, {address.city}, {address.state} -{" "}
                      {address.pincode}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">{address.type || "other"}</Badge>
                      {address.phone && (<span className="text-xs text-muted-foreground">
                        Phone: {address.phone}
                      </span>)}
                    </div>
                  </div>))}
                </div>) : (<div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No additional addresses</p>
                </div>)}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Customer Reviews ({customer.reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.reviews.length > 0 ? (<div className="space-y-4">
              {customer.reviews.map((review, index) => (<div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">Review #{index + 1}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {review.rating && (<div className="flex items-center">
                        {[...Array(5)].map((_, i) => (<span key={i} className={`text-lg ${i < review.rating
                          ? "text-yellow-500"
                          : "text-gray-300"}`}>
                          ★
                        </span>))}
                      </div>)}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {review.createdAt ? formatDate(review.createdAt) : ""}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2">
                  {review.comment || "No comment"}
                </p>
                {review.productName && (<div className="mt-3 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    Product: {review.productName}
                  </p>
                </div>)}
              </div>))}
            </div>) : (<div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Reviews</h3>
              <p className="mt-2 text-muted-foreground">
                This customer hasn't left any reviews yet.
              </p>
            </div>)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>);
};
