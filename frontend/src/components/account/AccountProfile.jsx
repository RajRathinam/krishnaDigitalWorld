import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Calendar, MapPin, User } from "lucide-react";
import { baseUrl } from '@/config/baseUrl';

const API_BASE_URL = baseUrl;

const getAuthToken = () => localStorage.getItem('authToken');

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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
  updateMe: async (data) => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export default function AccountProfile() {
  const { user, loading, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Primary address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDateOfBirth(user.dateOfBirth || "");

      // Parse address if exists
      if (user.address) {
        if (typeof user.address === 'object') {
          setStreet(user.address.street || "");
          setCity(user.address.city || "");
          setState(user.address.state || "");
          setPincode(user.address.pincode || "");
        } else {
          // Handle string address if needed
          const addressString = user.address;
          try {
            const parsed = JSON.parse(addressString);
            setStreet(parsed.street || "");
            setCity(parsed.city || "");
            setState(parsed.state || "");
            setPincode(parsed.pincode || "");
          } catch (e) {
            // Simple parsing fallback
            const parts = addressString.split(', ');
            setStreet(parts[0] || "");
            setPincode(parts.length > 0 && /\d{6}/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : "");
          }
        }
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updateData = {
        name,
        email: email || null
      };
      
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      
      // Update primary address
      if (street.trim() || city.trim() || pincode.trim()) {
        updateData.address = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        };
      }
      
      const response = await api.updateMe(updateData);
      if (response.success) {
        toast({ title: 'Profile updated successfully' });
        await refreshUser();
      }
    } catch (err) {
      toast({ 
        title: 'Update failed', 
        description: err?.message || 'Unable to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Profile Settings</h2>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-muted/50"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1">Phone number cannot be changed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter your email"
            />
            <p className="text-xs text-muted-foreground mt-1">For order updates and offers</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted-foreground mt-1">Get special birthday offers!</p>
          </div>
        </div>

        {/* Primary Address Fields */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Primary Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="House no., Building, Street, Area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="6-digit pincode"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}