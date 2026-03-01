import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MapPin, Plus, Home, Briefcase, MapPin as MapPinIcon, User, X, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { baseUrl } from '@/config/baseUrl';

const API_BASE_URL = baseUrl;
const MAX_SAVED_ADDRESSES = 3;

const getAuthToken = () => localStorage.getItem('authToken');

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await response.json();
  return {
    success: data.success !== undefined ? data.success : response.ok,
    data: data.data || data,
    message: data.message || '',
    errors: data.errors || [],
    status: response.status,
  };
};

const api = {
  getMe:             ()                       => apiRequest('/auth/me'),
  addAddress:        (addressData)            => apiRequest('/auth/addresses',              { method: 'POST',   body: JSON.stringify(addressData) }),
  updateAddress:     (addressId, addressData) => apiRequest(`/auth/addresses/${addressId}`, { method: 'PUT',    body: JSON.stringify(addressData) }),
  deleteAddress:     (addressId)              => apiRequest(`/auth/addresses/${addressId}`, { method: 'DELETE' }),
  setDefaultAddress: (addressId)              => apiRequest(`/auth/addresses/${addressId}/default`, { method: 'PUT' }),
};

const getAddressTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'home':    return <Home      className="w-4 h-4" />;
    case 'work':    return <Briefcase className="w-4 h-4" />;
    case 'primary': return <User      className="w-4 h-4" />;
    default:        return <MapPinIcon className="w-4 h-4" />;
  }
};

export default function AccountAddresses() {
  const { user, refreshUser } = useAuth();

  const [primaryAddress,     setPrimaryAddress    ] = useState(null);
  const [additionalAddresses,setAdditionalAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressForm,    setShowAddressForm   ] = useState(false);
  const [editingAddress,     setEditingAddress    ] = useState(null);

  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', street: '', city: '', state: '', pincode: '', type: 'home',
  });

  // Derived — is the saved-address slot full?
  const isAtLimit = additionalAddresses.length >= MAX_SAVED_ADDRESSES;

  useEffect(() => {
    if (user) loadUserAddresses();
  }, [user]);

  const loadUserAddresses = async () => {
    if (!user) return;
    setIsLoadingAddresses(true);
    try {
      const response = await api.getMe();
      if (response.success) {
        const userData = response.data;

        // ── Primary address ──────────────────────────────────────────────
        let primary = null;
        if (userData?.address) {
          let parsed = {};
          if (typeof userData.address === 'object') {
            parsed = userData.address;
          } else {
            try { parsed = JSON.parse(userData.address); } catch {
              const parts = String(userData.address).split(', ');
              parsed = {
                street:  parts[0] || '',
                city:    parts.length > 1 ? parts[1] : '',
                state:   parts.length > 2 ? parts[2] : '',
                pincode: /\d{6}/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : '',
              };
            }
          }
          primary = {
            id:        'primary',
            name:      userData.name  || '',
            phone:     userData.phone || '',
            street:    parsed.street  || '',
            city:      parsed.city    || '',
            state:     parsed.state   || '',
            pincode:   parsed.pincode || '',
            isDefault: true,
            type:      'primary',
          };
        }

        // ── Additional addresses ─────────────────────────────────────────
        const additional = [];
        if (Array.isArray(userData?.additionalAddresses)) {
          userData.additionalAddresses.forEach((addr) => {
            additional.push({
              id:        addr.id    || String(Math.random()),
              name:      addr.name  || userData.name  || '',
              phone:     addr.phone || userData.phone || '',
              street:    addr.street  || '',
              city:      addr.city    || '',
              state:     addr.state   || '',
              pincode:   addr.pincode || '',
              isDefault: addr.isDefault || false,
              type:      addr.type   || 'other',
            });
          });
        }

        setPrimaryAddress(primary);
        setAdditionalAddresses(additional);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
      toast({ title: 'Error', description: 'Failed to load addresses', variant: 'destructive' });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const resetForm = () => {
    setNewAddress({ name: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', pincode: '', type: 'home' });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    try {
      const res = await api.addAddress(newAddress);
      if (res.success) {
        toast({ title: 'Address added successfully' });
        await loadUserAddresses();
        await refreshUser();
        resetForm();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to add address', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to add address', variant: 'destructive' });
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    try {
      const res = await api.updateAddress(editingAddress.id, newAddress);
      if (res.success) {
        toast({ title: 'Address updated successfully' });
        await loadUserAddresses();
        await refreshUser();
        resetForm();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to update address', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to update address', variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.deleteAddress(addressId);
      if (res.success) {
        toast({ title: 'Address deleted successfully' });
        await loadUserAddresses();
        await refreshUser();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to delete address', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete address', variant: 'destructive' });
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await api.setDefaultAddress(addressId);
      if (res.success) {
        toast({ title: 'Default address updated' });
        await loadUserAddresses();
        await refreshUser();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to set default address', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to set default address', variant: 'destructive' });
    }
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setNewAddress({ name: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', pincode: '', type: 'home' });
    setShowAddressForm(true);
  };

  const openEditForm = (address) => {
    setEditingAddress(address);
    setNewAddress({ name: address.name, phone: address.phone, street: address.street, city: address.city, state: address.state, pincode: address.pincode, type: address.type || 'home' });
    setShowAddressForm(true);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {additionalAddresses.length} / {MAX_SAVED_ADDRESSES} saved addresses used
          </p>
        </div>

        {/* Add button — hidden when limit reached */}
        {!isAtLimit ? (
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-3 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-lg text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Limit reached
          </div>
        )}
      </div>

      {/* Limit banner — shown only when full */}
      {isAtLimit && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-snug">
            You've reached the maximum of <strong>{MAX_SAVED_ADDRESSES} saved addresses</strong>.
            Delete an existing address to add a new one.
          </p>
        </div>
      )}

      {/* Primary Address */}
      <div className="mb-6">
        <h3 className="font-medium text-foreground mb-3">Primary Address</h3>
        {primaryAddress ? (
          <div className="bg-accent/5 p-4 rounded-lg border border-accent">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm bg-accent/20 text-accent px-2 py-0.5 rounded">Primary</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm font-medium text-foreground">{primaryAddress.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {primaryAddress.street}, {primaryAddress.city}, {primaryAddress.state} - {primaryAddress.pincode}
                </p>
                {primaryAddress.phone && (
                  <p className="text-sm text-muted-foreground mt-1">Phone: {primaryAddress.phone}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <p className="text-muted-foreground text-sm">No primary address set.</p>
          </div>
        )}
      </div>

      {/* Additional Addresses */}
      <div>
        <h3 className="font-medium text-foreground mb-3">
          Saved Addresses ({additionalAddresses.length}/{MAX_SAVED_ADDRESSES})
        </h3>

        {isLoadingAddresses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : additionalAddresses.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">No saved addresses yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add up to {MAX_SAVED_ADDRESSES} addresses for faster checkout</p>
            <button
              onClick={openAddForm}
              className="inline-block bg-accent text-primary font-medium px-4 py-2 rounded-lg text-sm hover:bg-krishna-orange-hover transition-colors"
            >
              + Add Your First Address
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {additionalAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 relative ${
                    address.isDefault ? 'border-accent bg-accent/5' : 'border-border'
                  }`}
                >
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 text-xs bg-accent text-primary px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="text-muted-foreground mt-0.5">
                      {getAddressTypeIcon(address.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-medium text-foreground capitalize">{address.type}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-sm text-foreground font-medium">{address.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {address.street}, {address.city}, {address.state} - {address.pincode}
                      </p>
                      {address.phone && (
                        <p className="text-xs text-muted-foreground mt-1">Phone: {address.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => handleSetDefaultAddress(address.id)}
                      disabled={address.isDefault}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        address.isDefault
                          ? 'bg-muted text-muted-foreground cursor-default'
                          : 'text-krishna-blue-link hover:underline'
                      }`}
                    >
                      {address.isDefault ? 'Default' : 'Set as Default'}
                    </button>
                    <button
                      onClick={() => openEditForm(address)}
                      className="text-xs text-krishna-blue-link hover:underline px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-xs text-destructive hover:underline px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty slot placeholder — shows how many slots remain */}
              {!isAtLimit && Array.from({ length: MAX_SAVED_ADDRESSES - additionalAddresses.length }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  onClick={openAddForm}
                  className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors min-h-[100px]"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-medium">Add Address</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter phone number"
                  readOnly={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address Type</label>
                <select
                  value={newAddress.type}
                  onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                <textarea
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="House no., Building, Street, Area"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
                <input
                  type="text"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                className="flex-1 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors text-sm"
              >
                {editingAddress ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}