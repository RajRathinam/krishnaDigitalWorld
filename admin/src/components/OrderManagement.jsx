import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, MapPin, Phone, Mail, Package, Truck, XCircle, CheckCircle, MoreVertical, Download, Clock, RefreshCw, ChevronLeft, ChevronRight, Loader2, User, CreditCard, Hash, Tag, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import api from "@/lib/api";

// Page size options
const PAGE_SIZE_OPTIONS = [15, 30, 45, 100];

export const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all"); // 'all' | 'cod' | 'online'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToUpdate, setOrderToUpdate] = useState(null); // order being edited in update dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [notes, setNotes] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
  });
  const { toast } = useToast();

  // Fetch orders from API
  const fetchOrders = async (page = 1, limit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: "created_at",
        sortOrder: "desc",
      });
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPaymentMethod !== "all") params.append("paymentMethod", filterPaymentMethod);
      if (searchTerm) params.append("search", searchTerm);
      console.log("Fetching orders:", `/api/admin/orders?${params}`);
      const response = await api.get(`/admin/orders?${params}`);
      console.log("Orders API response:", response.data);
      if (response.data.success) {
        const ordersData = response.data.data.orders || [];
        if (ordersData.length > 0) {
          console.log("First order sample:", ordersData[0]);
          console.log("First order createdAt:", ordersData[0].createdAt);
        }
        setOrders(ordersData);
        const paginationData = response.data.data.pagination || {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 1,
        };
        setPagination(paginationData);

        // Use server-computed revenue & status counts (covers the full filter, not just this page)
        const serverStatusCounts = response.data.data.statusCounts || {};
        const serverRevenue = response.data.data.totalRevenue ?? 0;
        
        // Calculate monthly and weekly revenue from orders (paid only)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        let monthlyRev = 0;
        let weeklyRev = 0;
        ordersData.forEach(order => {
          if (order.paymentStatus === 'paid') {
            const amount = typeof order.finalAmount === 'string' ? parseFloat(order.finalAmount) : (order.finalAmount || 0);
            const orderDate = new Date(order.createdAt || order.created_at);
            if (orderDate >= startOfMonth) monthlyRev += amount;
            if (orderDate >= startOfWeek) weeklyRev += amount;
          }
        });
        
        setStats({
          total: paginationData.total,
          pending: serverStatusCounts.pending || 0,
          processing: serverStatusCounts.processing || 0,
          shipped: serverStatusCounts.shipped || 0,
          delivered: serverStatusCounts.delivered || 0,
          cancelled: serverStatusCounts.cancelled || 0,
          revenue: serverRevenue,
          monthlyRevenue: monthlyRev,
          weeklyRevenue: weeklyRev,
        });
      }
      else {
        throw new Error(response.data.data?.message || "Failed to fetch orders");
      }
    }
    catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      });
    }
    finally {
      setLoading(false);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    // Reset to page 1 when changing page size
    fetchOrders(1, newSize);
  };

  // Update order status
  const updateOrderStatus = async (orderId, statusData) => {
    try {
      console.log("Updating order status:", { orderId, ...statusData });
      const response = await api.put(`/admin/orders/${orderId}/status`, statusData);
      console.log("Update status response:", response.data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      else {
        throw new Error(response.data.message || "Failed to update order status");
      }
    }
    catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  };
  // Calculate statistics from orders
  const calculateStats = (ordersList, totalFromPagination) => {
    const pending = ordersList.filter((o) => o.orderStatus === "pending").length;
    const processing = ordersList.filter((o) => o.orderStatus === "processing").length;
    const shipped = ordersList.filter((o) => o.orderStatus === "shipped").length;
    const delivered = ordersList.filter((o) => o.orderStatus === "delivered").length;
    const cancelled = ordersList.filter((o) => o.orderStatus === "cancelled").length;
    // Calculate revenue
    const revenue = ordersList.reduce((sum, order) => {
      const amount = typeof order.finalAmount === "string"
        ? parseFloat(order.finalAmount)
        : order.finalAmount || order.totalPrice || 0;
      return sum + amount;
    }, 0);
    const total = totalFromPagination ?? ordersList.length;
    setStats({
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      revenue,
    });
  };

  // Update payment status for an order (COD or any)
  const updateCodPaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      const response = await api.put(`/admin/orders/${orderId}/payment`, { status: newPaymentStatus });
      if (response.data.success) {
        const updatedOrders = orders.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o
        );
        setOrders(updatedOrders);
        toast({ title: "Success", description: `Payment marked as ${newPaymentStatus}` });
        // Refetch stats to update revenue calculations
        await fetchOrders(pagination.page, pageSize);
      } else {
        throw new Error(response.data.message || "Failed to update payment status");
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to update payment status", variant: "destructive" });
    }
  };
  // Initial fetch
  useEffect(() => {
    fetchOrders(1, pageSize);
  }, [filterStatus, filterPaymentMethod, searchTerm]);

  // Handle status update
  const handleUpdateStatus = async () => {
    const target = orderToUpdate || selectedOrder;
    if (!target || !updateStatus) return;
    try {
      const result = await updateOrderStatus(target.id, {
        status: updateStatus,
        trackingId: trackingId || undefined,
        notes: notes || undefined,
      });
      if (result.success) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        });
        const updatedOrders = orders.map((order) => order.id === target.id
          ? {
            ...order,
            orderStatus: updateStatus,
            trackingId: trackingId || order.trackingId,
          }
          : order);
        setOrders(updatedOrders);
        calculateStats(updatedOrders, pagination.total);
        setIsUpdateDialogOpen(false);
        setUpdateStatus("");
        setTrackingId("");
        setNotes("");
        setOrderToUpdate(null);
        setSelectedOrder(null);
      }
    }
    catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };
  const handleCancelOrder = async (orderId) => {
    try {
      const result = await updateOrderStatus(orderId, {
        status: "cancelled",
      });
      if (result.success) {
        const updatedOrders = orders.map((order) => order.id === orderId
          ? { ...order, orderStatus: "cancelled" }
          : order);
        setOrders(updatedOrders);
        calculateStats(updatedOrders, pagination.total);
        toast({
          title: "Success",
          description: "Order cancelled successfully",
        });
      }
    }
    catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  // Helper function to get customer name from order
  const getCustomerName = (order) => {
    // Try multiple possible locations for customer name
    return order.customerName ||
      order.user?.name ||
      order.shippingAddress?.name ||
      (order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress.name : null) ||
      (order.billingAddress?.name) ||
      "Unknown Customer";
  };

  // Helper function to get customer phone
  const getCustomerPhone = (order) => {
    return order.customerPhone ||
      order.user?.phone ||
      order.shippingAddress?.phone ||
      (order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress.phone : null) ||
      "N/A";
  };

  // Helper function to get customer email
  const getCustomerEmail = (order) => {
    return order.customerEmail ||
      order.user?.email ||
      order.shippingAddress?.email ||
      "N/A";
  };

  const handleExportOrders = () => {
    try {
      if (orders.length === 0) {
        toast({
          title: "Export Failed",
          description: "No orders to export",
          variant: "destructive",
        });
        return;
      }

      // Define CSV headers
      const csvHeaders = [
        "Order Number",
        "Customer Name",
        "Customer Phone",
        "Customer Email",
        "Date",
        "Status",
        "Total Amount",
        "Payment Method",
        "Payment Status",
        "Items Count",
        "Tracking ID"
      ].join(",");

      // Map order data to CSV rows
      const csvRows = orders.map(order => {
        const rawDate = order.createdAt || order.created_at || order.date || null;
        let date = 'N/A';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            date = d.toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            });
          }
        }
        const customerName = getCustomerName(order);
        const customerPhone = getCustomerPhone(order);
        const customerEmail = getCustomerEmail(order);
        const total = order.finalAmount || order.totalPrice || 0;
        const itemsCount = calculateTotalItems(order.orderItems);

        // Escape commas and quotes in text fields
        const escapeCsvField = (field) => {
          if (field === null || field === undefined) return '';
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          escapeCsvField(order.orderNumber),
          escapeCsvField(customerName),
          escapeCsvField(customerPhone),
          escapeCsvField(customerEmail),
          escapeCsvField(date),
          escapeCsvField(order.orderStatus),
          escapeCsvField(total),
          escapeCsvField(order.paymentMethod || 'COD'),
          escapeCsvField(order.paymentStatus || 'pending'),
          escapeCsvField(itemsCount),
          escapeCsvField(order.trackingId || '')
        ].join(",");
      });

      const csvString = [csvHeaders, ...csvRows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${orders.length} orders successfully`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      });
    }
  };

  // Get status badge with proper styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      processing: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      shipped: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      delivered: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      cancelled: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
      provided: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
       notprovided: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      }
    };
    const style = styles[status] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    };
    return (<Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} font-medium capitalize`}>
      {status}
    </Badge>);
  };
  // Get payment status badge
  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: { bg: "bg-green-100", text: "text-green-800" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
      failed: { bg: "bg-red-100", text: "text-red-800" },
      refunded: { bg: "bg-blue-100", text: "text-blue-800" },
    };
    const style = styles[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return (<Badge variant="secondary" className={`${style.bg} ${style.text} text-xs font-medium capitalize`}>
      {status}
    </Badge>);
  };
  // Parse address from order
  const parseAddress = (address) => {
    if (!address) return "No address provided";

    let addrObj = address;
    // Try parsing if it's a string that looks like JSON
    if (typeof address === "string") {
      if (address.trim().startsWith('{')) {
        try {
          addrObj = JSON.parse(address);
        } catch (e) {
          // It's just a plain string or invalid JSON
          return address;
        }
      } else {
        return address;
      }
    }

    // Return formatted JSX if we have an object
    if (typeof addrObj === 'object' && addrObj !== null) {
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {addrObj.name && <span className="font-semibold">{addrObj.name}</span>}
          {addrObj.phone && <span>{addrObj.phone}</span>}
          <span>
            {addrObj.street || ''}
            {addrObj.street && (addrObj.city || addrObj.state || addrObj.pincode) ? ', ' : ''}
            {addrObj.city || ''}
          </span>
          <span>
            {addrObj.state || ''}
            {addrObj.state && addrObj.pincode ? ' - ' : ''}
            {addrObj.pincode || ''}
          </span>
          {addrObj.country && <span>{addrObj.country}</span>}
        </div>
      );
    }

    return String(address);
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  // Format date for display
  const formatOrderDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    catch (e) {
      return "N/A";
    }
  };
  // Calculate total items in order
  const calculateTotalItems = (orderItems) => {
    if (!orderItems) return 0;
    let items = orderItems;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return 0;
      }
    }
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };
  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (order.totalPrice) {
      return typeof order.totalPrice === "string"
        ? parseFloat(order.totalPrice)
        : order.totalPrice;
    }
    // Fallback: calculate from items
    return order.orderItems.reduce((total, item) => {
      const price = typeof item.price === "string" ? parseFloat(item.price) : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  // Get absolute final amount (including shipping/tax)
  const getFinalAmount = (order) => {
    if (order.finalAmount !== undefined && order.finalAmount !== null) {
      return typeof order.finalAmount === "string"
        ? parseFloat(order.finalAmount)
        : order.finalAmount;
    }
    return calculateOrderTotal(order);
  };
  return (<div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">Manage and track all customer orders</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExportOrders} disabled={loading || orders.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" onClick={() => fetchOrders(pagination.page, pageSize)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>

    {/* Stats Cards - 2 rows x 4 columns */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        [
          // Row 1: Revenue metrics
          { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
          { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue), icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Weekly Revenue", value: formatCurrency(stats.weeklyRevenue), icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Total Orders", value: pagination.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          // Row 2: Order status metrics
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
          { label: "Processing", value: stats.processing, icon: RefreshCw, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-orange-600", bg: "bg-orange-100" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>

    {/* Payment Method Tabs + Search + Status Filter */}
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Tabs: All / COD / Online */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All Orders" },
            { key: "cod", label: "COD" },
            { key: "online", label: "Online" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilterPaymentMethod(tab.key); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filterPaymentMethod === tab.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Status */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order ID, customer, phone..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders(1, pageSize)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Delivery Status" />
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

    {/* Orders Table - With Horizontal Scroll and Proper Column Widths */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Showing {orders.length} of {pagination.total} orders
          </CardDescription>
        </div>

        {/* Page Size Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(parseInt(value))}
            disabled={loading}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="15" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <TableSkeleton rowCount={10} columnCount={8} />
        ) : orders.length === 0 ? (<div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No orders have been placed yet"}
          </p>
          {searchTerm || filterStatus !== "all" ? (<Button variant="outline" className="mt-4" onClick={() => {
            setSearchTerm("");
            setFilterStatus("all");
            fetchOrders(1, pageSize);
          }}>
            Clear filters
          </Button>) : null}
        </div>) : (<>
          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[170px] text-xs font-semibold">Order ID</TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold">Customer</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold">Items</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold">Amount</TableHead>
                  <TableHead className="w-[160px] text-xs font-semibold">Date</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold">Delivery</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold">Payment</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold">Coupon</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const customerName = getCustomerName(order);
                  const customerPhone = getCustomerPhone(order);
                  const isCod = order.paymentMethod === 'cod';

                  return (
                    <TableRow key={order.id} className={`text-sm ${order.orderStatus === "cancelled" ? "bg-red-50/30" : ""
                      }`}>

                      {/* Order ID */}
                      <TableCell className="align-middle py-3">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-semibold text-foreground truncate max-w-[150px]" title={order.orderNumber}>
                            {order.orderNumber}
                          </p>
                          {order.trackingId && (
                            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Truck className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[130px]">{order.trackingId}</span>
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="align-middle py-3">
                        <div className="space-y-0.5">
                          <p className="font-medium truncate max-w-[160px] text-sm" title={customerName}>{customerName}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />{customerPhone}
                          </p>
                        </div>
                      </TableCell>

                      {/* Items */}
                      <TableCell className="align-middle py-3">
                        <span className="font-semibold">{calculateTotalItems(order.orderItems)}</span>
                        <span className="text-muted-foreground text-[11px]"> items</span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="align-middle py-3">
                        <p className="font-semibold text-sm">{formatCurrency(getFinalAmount(order))}</p>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="align-middle py-3">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{formatOrderDate(order.createdAt)}</p>
                      </TableCell>

                      {/* Delivery Status */}
                      <TableCell className="align-middle py-3">{getStatusBadge(order.orderStatus)}</TableCell>

                      {/* Payment */}
                      <TableCell className="align-middle py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isCod ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {isCod ? 'COD' : order.paymentMethod?.toUpperCase()}
                            </span>
                            {getPaymentStatusBadge(order.paymentStatus)}
                          </div>
                          {(order.phonePeTransactionId || order.merchantOrderId) && (
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]" title={order.phonePeTransactionId || order.merchantOrderId}>
                              {order.phonePeTransactionId || order.merchantOrderId}
                            </p>
                          )}
                        </div>
                      </TableCell>
   {/* coupon Status */}
    <TableCell className="align-middle py-3">
  {getStatusBadge(order.isCouponProvided ? "provided" : "notprovided")}
</TableCell>
                      <TableCell className="text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setOrderToUpdate(order);
                                setUpdateStatus(order.orderStatus);
                                setTrackingId(order.trackingId || "");
                                setIsUpdateDialogOpen(true);
                              }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update Delivery Status
                              </DropdownMenuItem>
                              {/* Payment toggle – only for COD orders */}
                              {order.paymentMethod === 'cod' && (
                                <>
                                  {order.paymentStatus !== "paid" ? (
                                    <DropdownMenuItem onClick={() => updateCodPaymentStatus(order.id, "paid")} className="text-green-600 focus:text-green-700">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Payment as Paid
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => updateCodPaymentStatus(order.id, "pending")} className="text-yellow-600 focus:text-yellow-700">
                                      <Clock className="h-4 w-4 mr-2" />
                                      Mark Payment as Unpaid
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {order.orderStatus !== "cancelled" &&
                                order.orderStatus !== "delivered" && (<DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-destructive focus:text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>)}
                              {!order.isCouponProvided && (
                                <DropdownMenuItem onClick={() => navigate(`/user-coupons?userId=${order.userId}&orderId=${order.id}`)}>
                                  <Ticket className="h-4 w-4 mr-2" />
                                  Provide Coupon
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (<div className="flex items-center justify-between mt-6 px-6 pb-6">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} orders
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => fetchOrders(pagination.page - 1, pageSize)} disabled={pagination.page === 1 || loading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  }
                  else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  }
                  else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  }
                  else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (<Button key={pageNum} variant={pagination.page === pageNum ? "default" : "outline"} size="sm" className="h-8 w-8" onClick={() => fetchOrders(pageNum, pageSize)} disabled={loading}>
                    {pageNum}
                  </Button>);
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchOrders(pagination.page + 1, pageSize)} disabled={pagination.page === pagination.totalPages || loading}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>)}
        </>)}
      </CardContent>
    </Card>

    {/* Order Detail Modal */}
    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Details
            {selectedOrder && getStatusBadge(selectedOrder.orderStatus)}
          </DialogTitle>
          <DialogDescription>
            Order ID: {selectedOrder?.orderNumber}
            {selectedOrder?.trackingId && ` • Tracking: ${selectedOrder.trackingId}`}
          </DialogDescription>
        </DialogHeader>

        {selectedOrder && (<div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">{formatOrderDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium uppercase">{selectedOrder.paymentMethod || "COD"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <div>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                    </div>
                  </div>

                  {(selectedOrder.merchantOrderId || selectedOrder.phonePeTransactionId) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t mt-2">
                      {selectedOrder.merchantOrderId && (
                        <div>
                          <p className="text-xs text-muted-foreground">Merchant Order ID</p>
                          <code className="text-[10px] bg-muted px-1 rounded truncate py-1">{selectedOrder.merchantOrderId}</code>
                        </div>
                      )}
                      {selectedOrder.phonePeTransactionId && (
                        <div>
                          <p className="text-xs text-muted-foreground">PhonePe Txn ID</p>
                          <code className="text-[10px] bg-muted px-1 rounded truncate py-1">{selectedOrder.phonePeTransactionId}</code>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">{selectedOrder.customerName || selectedOrder.shippingAddress?.name || "Unknown"}</p>
                          <p className="text-muted-foreground">{selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || "N/A"}</p>
                          <div className="mt-2 text-sm">{parseAddress(selectedOrder.shippingAddress)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {getCustomerName(selectedOrder).charAt(0).toUpperCase() || "C"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{getCustomerName(selectedOrder)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Customer ID: {selectedOrder.userId || selectedOrder.user?.id || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getCustomerPhone(selectedOrder)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getCustomerEmail(selectedOrder)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Order Items ({calculateTotalItems(selectedOrder.orderItems)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.orderItems.map((item, index) => (<div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {item.image ? (<img src={item.image} alt={item.productName || item.name || "Product"} className="w-full h-full object-cover rounded-lg" />) : (<Package className="h-6 w-6 text-muted-foreground" />)}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {item.productName || item.name || "Unnamed Product"}
                          </h4>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            {item.code && (<div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Code: {item.code}
                            </div>)}
                            <div>Color: {item.colorName || item.color || "N/A"}</div>
                            <div>Variant: {item.variant || "Standard"}</div>
                            <div>Quantity: {item.quantity}</div>
                            <div>
                              Price:{" "}
                              {formatCurrency(typeof item.price === "string"
                                ? parseFloat(item.price)
                                : item.price)}{" "}
                              each
                            </div>
                            {item.tax && <div>Tax: {item.tax}%</div>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency((typeof item.price === "string"
                            ? parseFloat(item.price)
                            : item.price) * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.quantity} ×{" "}
                          {formatCurrency(typeof item.price === "string"
                            ? parseFloat(item.price)
                            : item.price)}
                        </p>
                      </div>
                    </div>))}

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(calculateOrderTotal(selectedOrder))}</span>
                      </div>
                      {typeof selectedOrder.totalPrice !== "string" ||
                        selectedOrder.totalPrice !== selectedOrder.finalAmount?.toString() ? (<>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{formatCurrency(typeof selectedOrder.shippingCost === "string"
                              ? parseFloat(selectedOrder.shippingCost)
                              : selectedOrder.shippingCost || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span>{formatCurrency(typeof selectedOrder.taxAmount === "string"
                              ? parseFloat(selectedOrder.taxAmount)
                              : selectedOrder.taxAmount || 0)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center pt-2">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-lg">
                              {formatCurrency(typeof selectedOrder.finalAmount === "string"
                                ? parseFloat(selectedOrder.finalAmount)
                                : selectedOrder.finalAmount || calculateOrderTotal(selectedOrder))}
                            </span>
                          </div>
                        </>) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedOrder(null);
            }}>
              Close
            </Button>
            <Button onClick={() => {
              setOrderToUpdate(selectedOrder);
              setUpdateStatus(selectedOrder.orderStatus);
              setTrackingId(selectedOrder.trackingId || "");
              setSelectedOrder(null); // close detail modal
              setIsUpdateDialogOpen(true);
            }}>
              Update Status
            </Button>
          </div>
        </div>)}
      </DialogContent>
    </Dialog>

    {/* Update Status Dialog */}
    <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update the status for order: {selectedOrder?.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Order Status *</Label>
            <Select value={updateStatus} onValueChange={setUpdateStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updateStatus === "shipped" && (<div className="space-y-2">
            <Label htmlFor="trackingId">Tracking ID</Label>
            <Input id="trackingId" placeholder="Enter tracking ID" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate a tracking ID
            </p>
          </div>)}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Add any notes about this status update..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setIsUpdateDialogOpen(false);
            setUpdateStatus("");
            setTrackingId("");
            setNotes("");
          }}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={!updateStatus}>
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>);
};
export default OrderManagement;