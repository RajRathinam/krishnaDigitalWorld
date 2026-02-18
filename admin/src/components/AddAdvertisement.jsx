import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit, MoreVertical, Video, Image, X, 
  Play, Eye, MousePointer, Calendar, Clock, Link as LinkIcon,
  Youtube, Globe, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl, getVideoUrl } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const AddAdvertisement = ({ onCreated }) => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // File states
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    position: "homepage_middle",
    type: "video",
    externalVideoId: "",
    startDate: "",
    endDate: "",
    priority: 0,
    maxViews: "",
    autoplay: false,
    muted: true,
    loop: false,
    duration: ""
  });
  
  const { toast } = useToast();

  // Position options
  const positionOptions = [
    { value: "homepage_top", label: "Homepage Top" },
    { value: "homepage_middle", label: "Homepage Middle" },
    { value: "homepage_bottom", label: "Homepage Bottom" },
    { value: "sidebar", label: "Sidebar" },
    { value: "popup", label: "Popup" }
  ];

  // Type options
  const typeOptions = [
    { value: "video", label: "Uploaded Video" },
    { value: "youtube", label: "YouTube" },
    { value: "vimeo", label: "Vimeo" }
  ];

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await api.get("/advertisements?includeInactive=true");
      const data = response.data?.data || response.data || [];
      setAdvertisements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load advertisements", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load advertisements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  // Handle video file change
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Handle thumbnail file change
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      link: "",
      position: "homepage_middle",
      type: "video",
      externalVideoId: "",
      startDate: "",
      endDate: "",
      priority: 0,
      maxViews: "",
      autoplay: false,
      muted: true,
      loop: false,
      duration: ""
    });
    setVideoFile(null);
    setVideoPreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditingId(null);
    setIsEditing(false);
    setActiveTab("details");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Validation",
        description: "Advertisement title is required",
        variant: "destructive",
      });
      return;
    }

    // Validate based on type
    if (form.type === "video" && !videoFile && !isEditing) {
      toast({
        title: "Validation",
        description: "Video file is required for video type advertisements",
        variant: "destructive",
      });
      return;
    }

    if ((form.type === "youtube" || form.type === "vimeo") && !form.externalVideoId) {
      toast({
        title: "Validation",
        description: `External video ID is required for ${form.type} type`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });
      
      // Append files if they exist
      if (videoFile) {
        formData.append('video', videoFile);
      }
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      console.log('Sending FormData:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? pair[1].name : pair[1]);
      }

      let response;
      
      if (isEditing && editingId) {
        response = await api.put(`/advertisements/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({
          title: "Success",
          description: "Advertisement updated successfully",
        });
      } else {
        response = await api.post("/advertisements", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({
          title: "Success",
          description: "Advertisement created successfully",
        });
      }

      console.log('Response:', response.data);
      
      setIsDialogOpen(false);
      resetForm();
      fetchAdvertisements();
      if (onCreated) onCreated();
      
    } catch (err) {
      console.error("Save advertisement failed", err);
      console.error("Error response:", err.response);
      
      const errorMessage = err.response?.data?.message || 
                          err.message ||
                          "Failed to save advertisement";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ad) => {
    resetForm();
    
    // Set form fields
    setForm({
      title: ad.title || "",
      description: ad.description || "",
      link: ad.link || "",
      position: ad.position || "homepage_middle",
      type: ad.type || "video",
      externalVideoId: ad.externalVideoId || "",
      startDate: ad.startDate ? ad.startDate.split('T')[0] : "",
      endDate: ad.endDate ? ad.endDate.split('T')[0] : "",
      priority: ad.priority || 0,
      maxViews: ad.maxViews || "",
      autoplay: ad.autoplay || false,
      muted: ad.muted !== undefined ? ad.muted : true,
      loop: ad.loop || false,
      duration: ad.duration || ""
    });
    
    // Set previews if they exist
    if (ad.videoUrl) {
      setVideoPreview(getVideoUrl(ad.videoUrl));
    }
    
    if (ad.thumbnailUrl) {
      setThumbnailPreview(getImageUrl(ad.thumbnailUrl));
    }
    
    setEditingId(ad.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/advertisements/${id}/status`, { isActive: !currentStatus });
      toast({ 
        title: "Success", 
        description: `Advertisement ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      fetchAdvertisements();
    } catch (err) {
      console.error("Failed to update status", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this advertisement permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/advertisements/${id}?hardDelete=true`);
      toast({ 
        title: "Success", 
        description: "Advertisement deleted permanently" 
      });
      fetchAdvertisements();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete advertisement", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete advertisement",
        variant: "destructive"
      });
    }
  };

  // Get badge color for position
  const getPositionBadge = (position) => {
    const colors = {
      homepage_top: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      homepage_middle: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      homepage_bottom: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      sidebar: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      popup: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    return colors[position] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  // Get icon for type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'youtube': return <Youtube className="h-3 w-3 mr-1" />;
      case 'vimeo': return <Globe className="h-3 w-3 mr-1" />;
      default: return <Video className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Advertisement Management</CardTitle>
            <CardDescription>Add and manage video advertisements for your website</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Advertisement
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Views/Clicks</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : advertisements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No advertisements found. Click "Add Advertisement" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  advertisements.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        {ad.thumbnailUrl ? (
                          <img 
                            src={getImageUrl(ad.thumbnailUrl)} 
                            alt={ad.title}
                            className="h-10 w-16 object-cover rounded"
                            onError={(e) => {
                              e.target.src = '/placeholder-video.png';
                            }}
                          />
                        ) : ad.type === 'video' ? (
                          <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          {ad.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {ad.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPositionBadge(ad.position)}>
                          {ad.position.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTypeIcon(ad.type)}
                          <span className="text-sm capitalize">{ad.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-center text-xs" title="Views">
                            <Eye className="h-3 w-3 mr-1 text-muted-foreground" />
                            {ad.views || 0}
                          </div>
                          <div className="flex items-center text-xs" title="Clicks">
                            <MousePointer className="h-3 w-3 mr-1 text-muted-foreground" />
                            {ad.clicks || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={ad.isActive ? "default" : "secondary"} 
                          className={ad.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {ad.isExpired && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(ad)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ad.id, ad.isActive)}>
                              {ad.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive" 
                              onClick={() => handleDelete(ad.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Advertisement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Advertisement" : "Add New Advertisement"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update advertisement details and video below." 
                : "Fill in the details to create a new video advertisement."
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="video">Video & Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter advertisement title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Advertisement description (optional)"
                  rows={2}
                />
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link">Destination Link</Label>
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="link"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://example.com (optional)"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Display Position</Label>
                <Select 
                  value={form.position} 
                  onValueChange={(value) => setForm({ ...form, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (Higher = Shows first)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Max Views */}
              <div className="space-y-2">
                <Label htmlFor="maxViews">Maximum Views (Leave empty for unlimited)</Label>
                <Input
                  id="maxViews"
                  type="number"
                  min="1"
                  value={form.maxViews}
                  onChange={(e) => setForm({ ...form, maxViews: e.target.value })}
                  placeholder="e.g. 1000"
                />
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-6">
              {/* Video Type Selection */}
              <div className="space-y-2">
                <Label>Video Source Type</Label>
                <Select 
                  value={form.type} 
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* External Video ID (YouTube/Vimeo) */}
              {(form.type === 'youtube' || form.type === 'vimeo') && (
                <div className="space-y-2">
                  <Label htmlFor="externalVideoId">
                    {form.type === 'youtube' ? 'YouTube Video ID' : 'Vimeo Video ID'}
                  </Label>
                  <div className="flex items-center">
                    {form.type === 'youtube' ? (
                      <Youtube className="h-4 w-4 mr-2 text-red-500" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    <Input
                      id="externalVideoId"
                      value={form.externalVideoId}
                      onChange={(e) => setForm({ ...form, externalVideoId: e.target.value })}
                      placeholder={form.type === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'e.g. 123456789'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.type === 'youtube' 
                      ? 'Enter the YouTube video ID from the URL (e.g., dQw4w9WgXcQ)' 
                      : 'Enter the Vimeo video ID from the URL (e.g., 123456789)'}
                  </p>
                </div>
              )}

              {/* Video File Upload */}
              {form.type === 'video' && (
                <div className="space-y-3 border rounded-lg p-4">
                  <Label className="text-base font-semibold">Video File</Label>
                  
                  {/* Video Preview */}
                  {videoPreview ? (
                    <div className="relative">
                      <video 
                        src={videoPreview} 
                        controls
                        className="w-full max-h-[200px] rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeVideo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          onChange={handleVideoChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: MP4, WebM, OGG. Max size: 100MB
                        </p>
                        {isEditing && videoPreview && !videoFile && (
                          <p className="text-xs text-blue-600 mt-1">
                            Current video will be kept if no new file is selected
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail Upload */}
              <div className="space-y-3 border rounded-lg p-4">
                <Label className="text-base font-semibold">Thumbnail Image</Label>
                
                {/* Thumbnail Preview */}
                <div className="flex items-start gap-4">
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="h-20 w-20 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeThumbnail}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 1280x720px, max 5MB
                    </p>
                    {isEditing && thumbnailPreview && !thumbnailFile && (
                      <p className="text-xs text-blue-600 mt-1">
                        Current thumbnail will be kept if no new file is selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-4 border rounded-lg p-4">
                <Label className="text-base font-semibold">Video Settings</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoplay" className="cursor-pointer">Autoplay</Label>
                    <Switch
                      id="autoplay"
                      checked={form.autoplay}
                      onCheckedChange={(checked) => setForm({ ...form, autoplay: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="muted" className="cursor-pointer">Muted</Label>
                    <Switch
                      id="muted"
                      checked={form.muted}
                      onCheckedChange={(checked) => setForm({ ...form, muted: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loop" className="cursor-pointer">Loop</Label>
                    <Switch
                      id="loop"
                      checked={form.loop}
                      onCheckedChange={(checked) => setForm({ ...form, loop: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Duration (sec)"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Advertisement" : "Create Advertisement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddAdvertisement;