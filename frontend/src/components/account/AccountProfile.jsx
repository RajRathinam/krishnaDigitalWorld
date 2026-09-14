import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Calendar, MapPin, User, Camera } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { baseUrl } from '@/config/baseUrl'; // If baseUrl is still needed elsewhere, keep it, but getImageUrl is better

import api from "@/lib/api";

export default function AccountProfile() {
  const { user, loading, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  // Primary address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

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
          setLat(user.address.lat || null);
          setLng(user.address.lng || null);
        } else {
          // Handle string address if needed
          const addressString = user.address;
          try {
            const parsed = JSON.parse(addressString);
            setStreet(parsed.street || "");
            setCity(parsed.city || "");
            setState(parsed.state || "");
            setPincode(parsed.pincode || "");
            setLat(parsed.lat || null);
            setLng(parsed.lng || null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // DOB editable only if user has not set it yet
  const dobEditable = !(user && user.dateOfBirth);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'Geolocation is not supported by your browser', variant: 'destructive' });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const p = data.address;
          if (p) {
            setLat(latitude);
            setLng(longitude);
            setStreet(p.road || p.suburb || p.neighbourhood || street);
            setCity(p.city || p.town || p.village || p.county || city);
            setState(p.state || state);
            setPincode(p.postcode || pincode);
            toast({ title: 'Location captured successfully' });
          } else {
            setLat(latitude);
            setLng(longitude);
            toast({ title: 'Location captured (No address details found)' });
          }
        } catch (error) {
          setLat(latitude);
          setLng(longitude);
          toast({ title: 'Location captured (Failed to fetch address details)' });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast({ title: 'Error', description: 'Failed to capture location', variant: 'destructive' });
      }
    );
  };

  const handleAddressChange = (field, value) => {
    if (lat && lng) {
      if (window.confirm("Are you sure you want to remove the captured location and enter manually?")) {
        setLat(null);
        setLng(null);
        setStreet('');
        setCity('');
        setState('');
        setPincode('');
      }
    } else {
      if (field === 'street') setStreet(value);
      if (field === 'city') setCity(value);
      if (field === 'state') setState(value);
      if (field === 'pincode') setPincode(value);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Use FormData for profile update
      const formData = new FormData();
      formData.append('name', name);
      if (email) formData.append('email', email);
      if (dateOfBirth && dobEditable) formData.append('dateOfBirth', dateOfBirth);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      
      if (street.trim() || city.trim() || pincode.trim()) {
        const addressData = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          lat,
          lng,
        };
        formData.append('address', JSON.stringify(addressData));
      }
      
      const response = await api.put('/auth/me', formData);
      
      if (response.data.success) {
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
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/20 bg-muted flex items-center justify-center">
              {profileImagePreview || user?.profileImage ? (
                <img 
                  src={profileImagePreview || getImageUrl(user?.profileImage)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <Camera className="w-6 h-6" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Click the camera to update profile picture</p>
        </div>

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
              className={`w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${!dobEditable ? 'bg-muted/50' : ''}`}
              readOnly={!dobEditable}
              disabled={!dobEditable}
            />
            {dobEditable ? (
              <p className="text-xs text-muted-foreground mt-1">Get special birthday offers!</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Date of birth is set and cannot be changed.</p>
            )}
          </div>
        </div>

        {/* Primary Address Fields */}
        <div className="pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Primary Address
            </h3>
            <div className="flex items-center gap-2">
              {lat && lng && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  View Map
                </button>
              )}
              <button
                onClick={(e) => { e.preventDefault(); captureLocation(); }}
                disabled={isFetchingLocation}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <MapPin className="w-3.5 h-3.5" />
                {isFetchingLocation ? 'Getting location...' : 'Capture Location'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
              <input
                type="text"
                value={street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="House no., Building, Street, Area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => handleAddressChange('pincode', e.target.value)}
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