import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, Trash2, Gift, Search,X, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const UserCouponManagement = () => {
  const [searchParams] = useSearchParams();
  const userIdFromParams = searchParams.get("userId");
  const orderIdFromParams = searchParams.get("orderId");
  
  console.log("UserCouponManagement mounted, userIdFromParams:", userIdFromParams, "orderId:", orderIdFromParams);
  
  const [userCoupons, setUserCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUsed, setFilterUsed] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(!!userIdFromParams);
  const [selectedUserId, setSelectedUserId] = useState(userIdFromParams || "");
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [assigning, setAssigning] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUserCoupons = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pageNum,
        limit: 20,
      };
      
      if (filterUsed !== "all") {
        params.isUsed = filterUsed === "used";
      }
      
      if (searchTerm.trim()) {
        params.couponCode = searchTerm;
      }
      
      const response = await api.get("/coupons/admin/user-coupons", { params });
      
      if (response.data.success) {
        setUserCoupons(response.data.data.userCoupons);
        setTotalPages(response.data.data.pagination.totalPages);
        setPage(pageNum);
      } else {
        setError(response.data.message || "Failed to fetch user coupons");
      }
    } catch (error) {
      console.error("Failed to fetch user coupons:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch user coupons";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (searchQuery = "") => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/admin/users/search", {
        params: { q: searchQuery, limit: 10 }
      });
      
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUserCoupons();
  }, [filterUsed, searchTerm]);

  // Handle userId from query params - open dialog and pre-select user
  useEffect(() => {
    console.log("userId effect running, userIdFromParams:", userIdFromParams);
    if (userIdFromParams) {
      console.log("useEffect triggered - userIdFromParams:", userIdFromParams);
      // Parse and set the user ID
      const parsedUserId = parseInt(userIdFromParams);
      if (!isNaN(parsedUserId)) {
        console.log("Setting selectedUserId to:", String(parsedUserId));
        setSelectedUserId(String(parsedUserId));
        setAssignDialogOpen(true);
        console.log("Dialog should open now");
      }
    }
  }, [userIdFromParams]);

  // Fetch user data when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && !selectedUserData) {
      const fetchUserData = async () => {
        try {
          const response = await api.get(`/admin/users/${selectedUserId}`);
          if (response.data && response.data.data) {
            setSelectedUserData(response.data.data);
            console.log("User data fetched:", response.data.data);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          // Still show user ID even if fetch fails
        }
      };
      fetchUserData();
    }
  }, [selectedUserId, selectedUserData]);

  const handleDeleteCoupon = async (userId, userCouponId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this coupon from the user?"
    );
    if (!confirmed) return;

    try {
      setDeleting(userCouponId);
      const response = await api.delete(
        `/coupons/admin/users/${userId}/coupons/${userCouponId}`
      );
      
      if (response.data.success) {
        toast.success("Coupon removed successfully");
        fetchUserCoupons(page);
      } else {
        toast.error(response.data.message || "Failed to remove coupon");
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error(error.response?.data?.message || "Failed to remove coupon");
    } finally {
      setDeleting(null);
    }
  };

  const handleAssignCoupon = async () => {
    if (!selectedUserId || !discountValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setAssigning(true);
      const response = await api.post(
        `/coupons/admin/users/${selectedUserId}/assign-coupon`,
        {
          discountValue: parseFloat(discountValue),
          discountType,
          orderId: orderIdFromParams ? parseInt(orderIdFromParams) : null
        }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || "Coupon assigned successfully");
        setAssignDialogOpen(false);
        setSelectedUserId("");
        setSelectedUserData(null);
        setDiscountValue("");
        setDiscountType("percentage");
        fetchUserCoupons(1);
      } else {
        toast.error(response.data.message || "Failed to assign coupon");
      }
    } catch (error) {
      console.error("Failed to assign coupon:", error);
      toast.error(error.response?.data?.message || "Failed to assign coupon");
    } finally {
      setAssigning(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof price === "string" ? parseFloat(price) : price || 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Coupon Management</h2>
        <Button
          onClick={() => {
            setSelectedUserId("");
            setSelectedUserData(null);
            setDiscountValue("");
            setDiscountType("percentage");
            setAssignDialogOpen(true);
            setUsers([]);
          }}
          className="gap-2 hidden"
        >
          <Plus className="w-4 h-4" />
          Assign Coupon
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search by Coupon Code
              </label>
              <Input
                placeholder="Search coupon code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Filter by Status
              </label>
              <Select value={filterUsed} onValueChange={setFilterUsed}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coupons</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Assign Coupon Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Coupon to User</DialogTitle>
            <DialogDescription>
              Create and assign a custom discount coupon to a user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 block">
                Selected User
              </label>
              <Input
                placeholder="Search user by name..."
                onChange={(e) => {
                  if (e.target.value.length > 0) {
                    fetchUsers(e.target.value);
                  } else {
                    setUsers([]);
                  }
                }}
                className="mb-2 hidden"
              />
              {users.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(String(user.id));
                        setSelectedUserData(user);
                        setUsers([]);
                      }}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email || user.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          {/* Selected User Display */}
{selectedUserId && selectedUserData && (
  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
    <div className="flex-1 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
        <span className="text-sm font-medium text-accent">
          {selectedUserData.name?.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium">{selectedUserData.name}</p>
        <p className="text-xs text-muted-foreground">
          {selectedUserData.email || selectedUserData.phone}
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        setSelectedUserId("");
        setSelectedUserData(null);
      }}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}

{selectedUserId && !selectedUserData && (
  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">User #{selectedUserId}</p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setSelectedUserId("")}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
            </div>
  <div>
              <label className="text-sm font-medium mb-2 block">
                Discount Type
              </label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Discount Value
              </label>
              <Input
                type="number"
                placeholder="Enter discount value"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>

          
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedUserId("");
                setSelectedUserData(null);
                setDiscountValue("");
                setDiscountType("percentage");
              }}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCoupon}
              disabled={assigning}
              className="gap-2"
            >
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {userCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No user coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCoupons.map((uc) => (
                    <TableRow key={uc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{uc.user.name}</p>
                          <p className="text-xs text-muted-foreground">{uc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{uc.coupon.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {uc.coupon.discountType === "percentage"
                            ? `${uc.coupon.discountValue}%`
                            : formatPrice(uc.coupon.discountValue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={uc.isUsed ? "secondary" : "outline"}
                          className={uc.isUsed ? "bg-blue-500/10 text-blue-600" : ""}
                        >
                          {uc.isUsed ? "Used" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(uc.coupon.validUntil)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoupon(uc.userId, uc.id)}
                          disabled={deleting === uc.id || uc.isUsed}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleting === uc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUserCoupons(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUserCoupons(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};