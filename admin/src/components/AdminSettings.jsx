import { useState, useEffect } from "react";
import { Users, Store, Save, Plus, Edit, Trash2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { adminApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const AdminSettings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Subadmin state
  const [subadmins, setSubadmins] = useState([]);
  const [loadingSubadmins, setLoadingSubadmins] = useState(false);
  const [subadminDialogOpen, setSubadminDialogOpen] = useState(false);
  const [editingSubadmin, setEditingSubadmin] = useState(null);
  const [subadminForm, setSubadminForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Shop info state
  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    whatsappNumber: '',
    supportEmail: '',
    supportPhone: '',
    description: '',
    mapEmbedUrl: '',
    logoUrl: '',
    faviconUrl: '',
    currency: 'INR',
    gstNumber: '',
    locations: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '09:00', close: '18:00' }
    }
  });
  const [loadingShopInfo, setLoadingShopInfo] = useState(false);
  const [savingShopInfo, setSavingShopInfo] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    phone: '',
    mapUrl: ''
  });

  // Load subadmins
  useEffect(() => {
    if (isAdmin) {
      loadSubadmins();
    }
  }, [isAdmin]);

  // Load shop info
  useEffect(() => {
    loadShopInfo();
  }, []);

  const loadSubadmins = async () => {
    try {
      setLoadingSubadmins(true);
      const response = await adminApi.getSubadmins();
      if (response.success) {
        setSubadmins(response.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subadmins",
        variant: "destructive"
      });
    } finally {
      setLoadingSubadmins(false);
    }
  };

  const loadShopInfo = async () => {
    try {
      setLoadingShopInfo(true);
      const response = await adminApi.getShopInfo();
      if (response.success && response.data) {
        setShopInfo(prev => ({
          ...prev,
          ...response.data,
          socialMedia: response.data.socialMedia || prev.socialMedia,
          businessHours: response.data.businessHours || prev.businessHours,
          locations: response.data.locations || []
        }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load shop information",
        variant: "destructive"
      });
    } finally {
      setLoadingShopInfo(false);
    }
  };

  const handleSubadminSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubadmin) {
        await adminApi.updateSubadmin(editingSubadmin.id, {
          name: subadminForm.name,
          email: subadminForm.email
        });
        toast({
          title: "Success",
          description: "Subadmin updated successfully"
        });
      } else {
        await adminApi.createSubadmin(subadminForm);
        toast({
          title: "Success",
          description: "Subadmin created successfully. OTP sent to phone number."
        });
      }
      setSubadminDialogOpen(false);
      setEditingSubadmin(null);
      setSubadminForm({ name: '', phone: '', email: '' });
      loadSubadmins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save subadmin",
        variant: "destructive"
      });
    }
  };

  const handleEditSubadmin = (subadmin) => {
    setEditingSubadmin(subadmin);
    setSubadminForm({
      name: subadmin.name,
      phone: subadmin.phone,
      email: subadmin.email || ''
    });
    setSubadminDialogOpen(true);
  };

  const handleDeleteSubadmin = async (id) => {
    if (!confirm('Are you sure you want to deactivate this subadmin?')) return;
    try {
      await adminApi.deleteSubadmin(id);
      toast({
        title: "Success",
        description: "Subadmin deactivated successfully"
      });
      loadSubadmins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subadmin",
        variant: "destructive"
      });
    }
  };

  const handleShopInfoSave = async () => {
    try {
      setSavingShopInfo(true);
      const response = await adminApi.updateShopInfo(shopInfo);
      if (response.success) {
        toast({
          title: "Success",
          description: "Shop information updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save shop information",
        variant: "destructive"
      });
    } finally {
      setSavingShopInfo(false);
    }
  };

  const addLocation = () => {
    if (!newLocation.name || !newLocation.address) {
      toast({
        title: "Error",
        description: "Location name and address are required",
        variant: "destructive"
      });
      return;
    }
    setShopInfo(prev => ({
      ...prev,
      locations: [...prev.locations, { ...newLocation, id: Date.now() }]
    }));
    setNewLocation({ name: '', address: '', phone: '', mapUrl: '' });
  };

  const removeLocation = (index) => {
    setShopInfo(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isAdmin ? "subadmins" : "shop-info"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          {isAdmin && (
            <TabsTrigger value="subadmins" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Subadmins</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="shop-info" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Shop Information</span>
          </TabsTrigger>
        </TabsList>

        {/* Subadmin Management - Only for Admin */}
        {isAdmin && (
          <TabsContent value="subadmins" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subadmin Management</CardTitle>
                    <CardDescription>Create and manage subadmin accounts</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingSubadmin(null);
                    setSubadminForm({ name: '', phone: '', email: '' });
                    setSubadminDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subadmin
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSubadmins ? (
                  <div className="text-center py-8 text-muted-foreground">Loading subadmins...</div>
                ) : subadmins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No subadmins found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subadmins.map((subadmin) => (
                        <TableRow key={subadmin.id}>
                          <TableCell>{subadmin.name}</TableCell>
                          <TableCell>{subadmin.phone}</TableCell>
                          <TableCell>{subadmin.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={subadmin.isActive ? "default" : "secondary"}>
                              {subadmin.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubadmin(subadmin)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubadmin(subadmin.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Shop Information */}
        <TabsContent value="shop-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>Manage your shop's contact and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name *</Label>
                    <Input
                      value={shopInfo.shopName}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, shopName: e.target.value }))}
                      placeholder="Krishna Digital World"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={shopInfo.currency}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, currency: e.target.value }))}
                      placeholder="INR"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={shopInfo.description}
                    onChange={(e) => setShopInfo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Shop description..."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={shopInfo.email}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="shop@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={shopInfo.phone}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alternate Phone</Label>
                    <Input
                      value={shopInfo.alternatePhone}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, alternatePhone: e.target.value }))}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input
                      value={shopInfo.whatsappNumber}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={shopInfo.supportEmail}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input
                      value={shopInfo.supportPhone}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, supportPhone: e.target.value }))}
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address</h3>
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Textarea
                    value={shopInfo.address}
                    onChange={(e) => setShopInfo(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={shopInfo.city}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={shopInfo.state}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={shopInfo.pincode}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="123456"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={shopInfo.country}
                    onChange={(e) => setShopInfo(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="India"
                  />
                </div>
              </div>

              {/* Live Shop Locations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Live Shop Locations</h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location Name</Label>
                      <Input
                        value={newLocation.name}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Main Branch"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location Phone</Label>
                      <Input
                        value={newLocation.phone}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 1234567890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location Address</Label>
                    <Textarea
                      value={newLocation.address}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      placeholder="Full address of this location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Map URL / Embed Code</Label>
                    <Input
                      value={newLocation.mapUrl}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, mapUrl: e.target.value }))}
                      placeholder="Google Maps embed URL"
                    />
                  </div>
                  <Button onClick={addLocation} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
                {shopInfo.locations && shopInfo.locations.length > 0 && (
                  <div className="space-y-2">
                    {shopInfo.locations.map((location, index) => (
                      <div key={location.id || index} className="border rounded-lg p-4 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                          {location.phone && (
                            <p className="text-sm text-muted-foreground">Phone: {location.phone}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLocation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input
                      value={shopInfo.socialMedia?.facebook || ''}
                      onChange={(e) => setShopInfo(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      value={shopInfo.socialMedia?.instagram || ''}
                      onChange={(e) => setShopInfo(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                      }))}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter</Label>
                    <Input
                      value={shopInfo.socialMedia?.twitter || ''}
                      onChange={(e) => setShopInfo(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                      }))}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube</Label>
                    <Input
                      value={shopInfo.socialMedia?.youtube || ''}
                      onChange={(e) => setShopInfo(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                      }))}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input
                      value={shopInfo.gstNumber}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, gstNumber: e.target.value }))}
                      placeholder="GST123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Map Embed URL</Label>
                    <Input
                      value={shopInfo.mapEmbedUrl}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
                      placeholder="Google Maps embed URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={shopInfo.logoUrl}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      value={shopInfo.faviconUrl}
                      onChange={(e) => setShopInfo(prev => ({ ...prev, faviconUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button for Shop Info */}
      <div className="flex justify-end">
        <Button onClick={handleShopInfoSave} disabled={savingShopInfo}>
          <Save className="h-4 w-4 mr-2" />
          {savingShopInfo ? "Saving..." : "Save Shop Information"}
        </Button>
      </div>

      {/* Subadmin Dialog */}
      <Dialog open={subadminDialogOpen} onOpenChange={setSubadminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubadmin ? "Edit Subadmin" : "Add Subadmin"}</DialogTitle>
            <DialogDescription>
              {editingSubadmin
                ? "Update subadmin information"
                : "Create a new subadmin account. An OTP will be sent to the phone number for initial login."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubadminSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={subadminForm.name}
                  onChange={(e) => setSubadminForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Subadmin Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={subadminForm.phone}
                  onChange={(e) => setSubadminForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  disabled={!!editingSubadmin}
                  placeholder="+91 1234567890"
                />
                {editingSubadmin && (
                  <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={subadminForm.email}
                  onChange={(e) => setSubadminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="subadmin@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setSubadminDialogOpen(false);
                setEditingSubadmin(null);
                setSubadminForm({ name: '', phone: '', email: '' });
              }}>
                Cancel
              </Button>
              <Button type="submit">{editingSubadmin ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
