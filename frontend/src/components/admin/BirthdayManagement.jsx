import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Cake, PartyPopper, Send, Gift, Search, Mail, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";

export const BirthdayManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [wishesDialogOpen, setWishesDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingWishes, setSendingWishes] = useState(false);
  const [bulkWishDialogOpen, setBulkWishDialogOpen] = useState(false);
  const [bulkWishNames, setBulkWishNames] = useState([]);
  const [error, setError] = useState(null);

  // Get today's date for debugging
  const getTodayString = () => {
    const today = new Date();
    return {
      month: today.getMonth() + 1,
      day: today.getDate(),
      string: `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    };
  };
  // Fetch today's birthdays from backend
  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching birthdays with role:", filterRole);
      console.log("Today's date:", getTodayString());
      const response = await api.get("/birthdays/today", {
        params: {
          role: filterRole
        }
      });
      console.log("API Response:", response.data);
      if (response.data.success) {
        const apiData = response.data.data || [];
        console.log("Raw API data:", apiData);
        const transformedData = apiData.map((user) => {
          const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
          const age = dob ? calculateAge(user.dateOfBirth) : 0;
          const dobString = dob ? dob.toISOString().split('T')[0] : "Unknown";
          return {
            id: `CUS-${user.id}`,
            userId: user.id,
            name: user.name || "Unknown",
            email: user.email || "No email",
            phone: user.phone || "No phone",
            dob: dobString,
            dateOfBirth: user.dateOfBirth,
            age: age,
            totalOrders: 0,
            totalSpent: 0,
            wishesSent: user.giftReceived || false,
            offerSent: false,
            giftReceived: user.giftReceived || false,
            role: user.role || "customer"
          };
        });
        console.log("Transformed data:", transformedData);
        setCustomers(transformedData);
        // Prepare names for bulk wish toast
        const unsentNames = transformedData
          .filter(c => !c.wishesSent)
          .map(c => c.name);
        setBulkWishNames(unsentNames);
        if (transformedData.length === 0) {
          console.log("No birthdays found for today. Check if users have date_of_birth set in database.");
        }
      }
      else {
        setError(response.data.message || "Failed to fetch birthdays");
      }
    }
    catch (error) {
      console.error("Failed to fetch birthdays:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch birthdays";
      setError(errorMessage);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please login again to access birthday management",
          variant: "destructive"
        });
      }
      else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      // Fallback to empty array if API fails
      setCustomers([]);
    }
    finally {
      setLoading(false);
    }
  };
  // Calculate age from date of birth
  const calculateAge = (dob) => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    catch (e) {
      console.error("Error calculating age:", e);
      return 0;
    }
  };
  // Fetch data on component mount and when filterRole changes
  useEffect(() => {
    fetchBirthdays();
  }, [filterRole]);
  const todayBirthdays = customers.filter(c => {
    if (!c.dateOfBirth)
      return false;
    try {
      const dob = new Date(c.dateOfBirth);
      const today = new Date();
      return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
    }
    catch (e) {
      return false;
    }
  });
  const getFilteredCustomers = () => {
    let filtered = customers;
    if (filterPeriod === "today") {
      filtered = todayBirthdays;
    }
    else if (filterPeriod === "week") {
      // For week filter, you might want to fetch from backend with date range
      // For now, we'll just show all since we only fetch today's birthdays
      filtered = customers;
    }
    else if (filterPeriod === "month") {
      filtered = customers;
    }
    return filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()));
  };
  const handleSendWishes = async (customer) => {
    try {
      setSendingWishes(true);
      const response = await api.post(`/birthdays/${customer.userId}/wish`, { customMessage });
      if (response.data.success) {
        // Update local state
        setCustomers(customers.map(c => c.userId === customer.userId ? { ...c, wishesSent: true, giftReceived: true } : c));
        setWishesDialogOpen(false);
        setSelectedCustomer(null);
        setCustomMessage("");
        toast({
          title: "Birthday wishes sent! 🎂",
          description: `Birthday message sent to ${customer.name}`,
        });
        // Refresh the list
        fetchBirthdays();
      }
    }
    catch (error) {
      console.error("Failed to send wishes:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send birthday wishes",
        variant: "destructive"
      });
    }
    finally {
      setSendingWishes(false);
    }
  };
  const handleSendOffer = async (customer) => {
    try {
      const response = await api.post(`/birthdays/${customer.userId}/offer`, {});
      if (response.data.success) {
        setCustomers(customers.map(c => c.userId === customer.userId ? { ...c, offerSent: true } : c));
        setOfferDialogOpen(false);
        setSelectedCustomer(null);
        toast({
          title: "Birthday offer sent! 🎁",
          description: `Special birthday offer sent to ${customer.name}`,
        });
      }
    }
    catch (error) {
      console.error("Failed to send offer:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send birthday offer",
        variant: "destructive"
      });
    }
  };
  const handleBulkSendWishes = async () => {
    try {
      setSendingWishes(true);
      const unsentCustomers = todayBirthdays.filter(c => !c.wishesSent);
      if (unsentCustomers.length === 0) {
        toast({
          title: "No pending wishes",
          description: "All birthday wishes have already been sent today.",
        });
        setBulkWishDialogOpen(false);
        return;
      }
      // Send wishes to all unsent customers
      const promises = unsentCustomers.map(customer => api.post(`/birthdays/${customer.userId}/wish`, {}));
      const results = await Promise.all(promises);
      // Update local state for all successful sends
      setCustomers(customers.map(c => {
        const wasSent = unsentCustomers.find(u => u.userId === c.userId);
        if (wasSent) {
          return { ...c, wishesSent: true, giftReceived: true };
        }
        return c;
      }));
      // Show toast with all names
      if (unsentCustomers.length > 0) {
        toast({
          title: "Bulk wishes sent successfully! 🎉",
          description: (<div className="mt-2">
            <p className="font-medium">Birthday wishes sent to:</p>
            <div className="mt-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {unsentCustomers.map((customer, index) => (<div key={customer.id} className="py-1">
                {index + 1}. {customer.name} ({customer.email})
              </div>))}
            </div>
          </div>),
          duration: 8000, // Longer duration to read all names
        });
      }
      setBulkWishDialogOpen(false);
      // Refresh the list
      fetchBirthdays();
    }
    catch (error) {
      console.error("Failed to send bulk wishes:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send bulk wishes",
        variant: "destructive"
      });
    }
    finally {
      setSendingWishes(false);
    }
  };
  const handleBulkWishClick = () => {
    const unsentCustomers = todayBirthdays.filter(c => !c.wishesSent);
    if (unsentCustomers.length === 0) {
      toast({
        title: "No pending wishes",
        description: "All birthday wishes have already been sent today.",
      });
      return;
    }
    setBulkWishNames(unsentCustomers.map(c => c.name));
    setBulkWishDialogOpen(true);
  };
  const handleRefresh = () => {
    fetchBirthdays();
  };
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No authentication token found. Please login first.");
    }
  }, []);
  if (loading) {
    return (<div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 mt-2">Loading birthdays...</span>
      <p className="text-sm text-muted-foreground mt-2">
        Checking for birthdays on {getTodayString().month}/{getTodayString().day}
      </p>
    </div>);
  }
  return (<div className="space-y-6">


    {/* Error display */}
    {error && (<Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-700">Error fetching birthdays</p>
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchBirthdays} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>)}

    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Cake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Birthdays</p>
              <p className="text-2xl font-bold">{todayBirthdays.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Wishes Sent</p>
          <p className="text-2xl font-bold text-green-600">
            {todayBirthdays.filter(c => c.wishesSent).length}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Offers Sent</p>
          <p className="text-2xl font-bold text-blue-600">
            {todayBirthdays.filter(c => c.offerSent).length}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            {todayBirthdays.filter(c => !c.wishesSent).length}
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Quick Actions */}
    {todayBirthdays.length > 0 && todayBirthdays.some(c => !c.wishesSent) && (<Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PartyPopper className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">
              {todayBirthdays.filter(c => !c.wishesSent).length} customers have birthdays today!
            </p>
            <p className="text-sm text-muted-foreground">
              Send them birthday wishes and special offers
            </p>
          </div>
        </div>
        <Button onClick={handleBulkWishClick} disabled={sendingWishes}>
          {sendingWishes ? (<>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>) : (<>
            <Send className="h-4 w-4 mr-2" />
            Send All Wishes
          </>)}
        </Button>
      </CardContent>
    </Card>)}

    {/* Birthday List */}
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Birthday Calendar
            <Badge variant="outline" className="ml-2">
              {getFilteredCustomers().length} found
            </Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {getFilteredCustomers().length === 0 ? (<div className="text-center py-8">
          <Cake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No birthdays found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try a different search term" : "No birthdays for the selected filters"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check if users have their birth dates set in the database.
          </p>
        </div>) : (<div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredCustomers().map((customer) => {
                const isToday = customer.dateOfBirth ?
                  new Date(customer.dateOfBirth).getMonth() === new Date().getMonth() &&
                  new Date(customer.dateOfBirth).getDate() === new Date().getDate() :
                  false;
                return (<TableRow key={customer.id} className={isToday ? "bg-primary/5" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isToday && <span className="text-lg">🎂</span>}
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{customer.email}</p>
                      <p className="text-muted-foreground">{customer.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{customer.dob}</TableCell>
                  <TableCell>{customer.age} years</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {customer.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {customer.wishesSent && (<Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                        Wishes ✓
                      </Badge>)}
                      {customer.offerSent && (<Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                        Offer ✓
                      </Badge>)}
                      {!customer.wishesSent && !customer.offerSent && (<Badge variant="outline" className="text-muted-foreground text-xs">
                        Pending
                      </Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant={customer.wishesSent ? "outline" : "default"} disabled={customer.wishesSent || sendingWishes} onClick={() => {
                        setSelectedCustomer(customer);
                        setWishesDialogOpen(true);
                      }}>
                        {sendingWishes ? (<Loader2 className="h-3 w-3 animate-spin" />) : ("🎂 Wish")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={customer.offerSent || sendingWishes} onClick={() => {
                        setSelectedCustomer(customer);
                        setOfferDialogOpen(true);
                      }}>
                        🎁 Offer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>);
              })}
            </TableBody>
          </Table>
        </div>)}
      </CardContent>
    </Card>

    {/* Bulk Wish Confirmation Dialog - Custom Implementation */}
    {bulkWishDialogOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">Send Birthday Wishes to All</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will send birthday wishes to {bulkWishNames.length} people
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setBulkWishDialogOpen(false)} disabled={sendingWishes}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[40vh]">
          <p className="font-medium mb-3">Recipients:</p>
          <div className="space-y-2">
            {bulkWishNames.map((name, index) => (<div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                {index + 1}
              </div>
              <span className="text-sm">{name}</span>
            </div>))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={() => setBulkWishDialogOpen(false)} disabled={sendingWishes}>
            Cancel
          </Button>
          <Button onClick={handleBulkSendWishes} disabled={sendingWishes}>
            {sendingWishes ? (<>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>) : ("Send All Wishes")}
          </Button>
        </div>
      </div>
    </div>)}

    {/* Send Wishes Dialog */}
    <Dialog open={wishesDialogOpen} onOpenChange={setWishesDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎂 Send Birthday Wishes
          </DialogTitle>
          <DialogDescription>
            Send a birthday message to {selectedCustomer?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">{selectedCustomer?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedCustomer?.email}</p>
          </div>
          <Textarea placeholder="Add a personal message (optional)..." value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={4} />
          <p className="text-xs text-muted-foreground">
            A standard birthday greeting will be sent along with any custom message.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setWishesDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => selectedCustomer && handleSendWishes(selectedCustomer)} disabled={sendingWishes}>
            {sendingWishes ? (<>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>) : (<>
              <Mail className="h-4 w-4 mr-2" />
              Send Wishes
            </>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Send Offer Dialog */}
    <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎁 Send Birthday Offer
          </DialogTitle>
          <DialogDescription>
            Send a special birthday offer to {selectedCustomer?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">{selectedCustomer?.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedCustomer?.role} | Birthday: {selectedCustomer?.dob}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="text-lg">10%</span>
              <span className="text-xs text-muted-foreground">Discount</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="text-lg">15%</span>
              <span className="text-xs text-muted-foreground">Discount</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="text-lg">20%</span>
              <span className="text-xs text-muted-foreground">Discount</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col">
              <span className="text-lg">🎁</span>
              <span className="text-xs text-muted-foreground">Free Gift</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => selectedCustomer && handleSendOffer(selectedCustomer)}>
            <Gift className="h-4 w-4 mr-2" />
            Send Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>);
};
