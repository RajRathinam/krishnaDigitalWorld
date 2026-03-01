"use client";
import { Users, UserCheck, UserX, Search, Filter, Download, Mail, MoreVertical, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Page size options
const PAGE_SIZE_OPTIONS = [15, 30, 45, 100];

export const CustomerAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [analyticsData, setAnalyticsData] = useState({
    totalCustomers: 0,
    orderedCustomers: 0,
    signupOnlyCustomers: 0,
    customers: [],
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      // Use the customer analytics API endpoint
      const response = await api.get("/admin/users/analytics/customers");
      console.log("Customer analytics response:", response.data);
      
      if (response.data.success && response.data.data) {
        const apiData = response.data.data;
        
        // Transform the data to match our interface
        const transformedData = {
          totalCustomers: apiData.totalCustomers || 0,
          orderedCustomers: apiData.orderedCustomers || 0,
          signupOnlyCustomers: apiData.signupOnlyCustomers || 0,
          customers: (apiData.customers || []).map((customer) => ({
            id: customer.id?.toString() || "",
            customerCode: customer.customerCode || `CUST-${customer.id}`,
            name: customer.name || "Unknown",
            email: customer.email || "No email",
            phone: customer.phone || "No phone",
            dateOfBirth: customer.dateOfBirth,
            orders: customer.orders || 0,
            totalSpent: customer.totalSpent || "0.00",
            status: customer.status || "signup-only",
            joinDate: customer.joinDate ||
              new Date(customer.createdAt || Date.now())
                .toISOString()
                .split("T")[0],
            isVerified: customer.isVerified || false,
            isActive: customer.isActive !== undefined ? customer.isActive : true,
          })),
        };
        
        setAnalyticsData(transformedData);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to load customer data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1); // Reset to first page
  };

  const handleExportCustomers = async () => {
    try {
      setExporting(true);
      
      if (filteredCustomers.length === 0) {
        toast({
          title: "Export Failed",
          description: "No customers to export",
          variant: "destructive",
        });
        return;
      }

      // Define CSV headers
      const headers = [
        "Customer Code",
        "Name",
        "Email",
        "Phone",
        "Date of Birth",
        "Orders",
        "Total Spent",
        "Status",
        "Joined Date",
        "Verified",
        "Active"
      ].join(",");

      // Map customers to CSV rows
      const rows = filteredCustomers.map(customer => {
        const safeName = `"${(customer.name || "Unknown").replace(/"/g, '""')}"`;
        const safeEmail = `"${(customer.email || "").replace(/"/g, '""')}"`;
        const date = customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : "N/A";
        const dob = customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : "N/A";

        return [
          customer.customerCode,
          safeName,
          safeEmail,
          customer.phone || "N/A",
          dob,
          customer.orders,
          customer.totalSpent,
          customer.status === "ordered" ? "Ordered" : "Signup Only",
          date,
          customer.isVerified ? "Yes" : "No",
          customer.isActive ? "Yes" : "No"
        ].join(",");
      });

      const csvString = [headers, ...rows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${filteredCustomers.length} customers successfully`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export customers",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/analytics/customers/${customerId}`);
  };

  const handleSendEmail = (customerEmail) => {
    if (customerEmail && customerEmail !== "No email") {
      window.location.href = `mailto:${customerEmail}`;
    } else {
      toast({
        title: "Info",
        description: "Customer doesn't have an email address",
        variant: "default",
      });
    }
  };

  // Filter customers based on search and status
  const filteredCustomers = analyticsData.customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || customer.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const customerStats = [
    {
      title: "Total Customers",
      value: analyticsData.totalCustomers.toLocaleString(),
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Ordered Customers",
      value: analyticsData.orderedCustomers.toLocaleString(),
      icon: UserCheck,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Signup Only",
      value: analyticsData.signupOnlyCustomers.toLocaleString(),
      icon: UserX,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString || dateString === "Not set") return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return "Not set";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Skeleton Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton rowCount={10} columnCount={9} showHeader={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {customerStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>
              Customer List ({filteredCustomers.length} of {analyticsData.totalCustomers} total)
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email, phone, code..." 
                  className="pl-9" 
                  value={searchTerm} 
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }} 
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1); // Reset to first page on filter change
              }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="signup-only">Signup Only</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
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

              <Button variant="outline" size="icon" onClick={handleExportCustomers} disabled={exporting || filteredCustomers.length === 0}>
                {exporting ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Download className="h-4 w-4" />)}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No customers found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No customers have been added yet"}
              </p>
              {(searchTerm || filterStatus !== "all") && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table with Horizontal Scroll */}
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Customer</TableHead>
                      <TableHead className="w-[200px]">Contact</TableHead>
                      <TableHead className="w-[100px]">DOB</TableHead>
                      <TableHead className="w-[80px]">Orders</TableHead>
                      <TableHead className="w-[120px]">Total Spent</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Joined</TableHead>
                      <TableHead className="w-[90px]">Verified</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/50">
                        <TableCell className="align-top">
                          <div>
                            <p className="font-medium truncate max-w-[150px]" title={customer.name}>
                              {customer.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono" title={customer.customerCode}>
                              {customer.customerCode}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <div>
                            <p className="text-sm truncate max-w-[150px]" title={customer.email}>
                              {customer.email}
                            </p>
                            <p className="text-xs text-muted-foreground" title={customer.phone}>
                              {customer.phone}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell className="align-top text-sm">
                          {formatDateDisplay(customer.dateOfBirth)}
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <Badge variant={customer.orders > 0 ? "default" : "secondary"}>
                            {customer.orders}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="align-top font-medium">
                          {formatCurrency(parseFloat(customer.totalSpent))}
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <Badge 
                            variant={customer.status === "ordered" ? "success" : "warning"}
                            className={customer.status === "ordered" 
                              ? "bg-green-100 text-green-700 hover:bg-green-100" 
                              : "bg-orange-100 text-orange-700 hover:bg-orange-100"}
                          >
                            {customer.status === "ordered" ? "Ordered" : "Signup Only"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {customer.joinDate}
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <Badge 
                            variant="outline"
                            className={customer.isVerified 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-gray-100 text-gray-700 border-gray-200"}
                          >
                            {customer.isVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSendEmail(customer.email)} 
                                disabled={!customer.email || customer.email === "No email"}
                              >
                                <Mail className="h-4 w-4 mr-2" /> Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, filteredCustomers.length)} of{" "}
                    {filteredCustomers.length} customers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};