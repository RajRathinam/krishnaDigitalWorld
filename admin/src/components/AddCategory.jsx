// AddCategory.jsx - Complete fixed version with proper image handling
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, MoreVertical, Folder, X, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export const AddCategory = ({ onCreated }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Category image state
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  
  // Subcategory images state
  const [subcategoryImages, setSubcategoryImages] = useState({});
  const [subcategoryImageFiles, setSubcategoryImageFiles] = useState({});

  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories?includeInactive=true");
      const data = response.data?.data || response.data || [];

      const safeParse = (val) => {
        if (Array.isArray(val)) return val;
        if (!val) return [];
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      };

      const safeParseObject = (val) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) return val;
        if (!val) return {};
        try {
          const parsed = JSON.parse(val);
          return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
          return {};
        }
      };

      const parsedCategories = (Array.isArray(data) ? data : []).map(cat => ({
        ...cat,
        subcategories: safeParse(cat.subcategories),
        subcategoryImages: safeParseObject(cat.subcategoryImages)
      }));

      setCategories(parsedCategories);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (trimmed && !subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed]);
      setSubcategoryInput("");
    }
  };

  const handleRemoveSubcategory = (index) => {
    const subToRemove = subcategories[index];
    setSubcategories(subcategories.filter((_, i) => i !== index));
    
    // Also remove the image for this subcategory
    const newSubcategoryImages = { ...subcategoryImages };
    delete newSubcategoryImages[subToRemove];
    setSubcategoryImages(newSubcategoryImages);
    
    const newSubcategoryImageFiles = { ...subcategoryImageFiles };
    delete newSubcategoryImageFiles[subToRemove];
    setSubcategoryImageFiles(newSubcategoryImageFiles);
  };

  // Handle category main image
  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCategoryImage = () => {
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
  };

  // Handle subcategory image upload
  const handleSubcategoryImageChange = (subcategoryName, e) => {
    const file = e.target.files[0];
    if (file) {
      setSubcategoryImageFiles({
        ...subcategoryImageFiles,
        [subcategoryName]: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubcategoryImages({
          ...subcategoryImages,
          [subcategoryName]: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSubcategoryImage = (subcategoryName) => {
    const newSubcategoryImages = { ...subcategoryImages };
    delete newSubcategoryImages[subcategoryName];
    setSubcategoryImages(newSubcategoryImages);
    
    const newSubcategoryImageFiles = { ...subcategoryImageFiles };
    delete newSubcategoryImageFiles[subcategoryName];
    setSubcategoryImageFiles(newSubcategoryImageFiles);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
    });
    setSubcategories([]);
    setSubcategoryInput("");
    setEditingId(null);
    setIsEditing(false);
    
    // Reset images
    setCategoryImagePreview(null);
    setCategoryImageFile(null);
    setSubcategoryImages({});
    setSubcategoryImageFiles({});
  };

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast({
      title: "Validation",
      description: "Category name is required",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);
  try {
    const formData = new FormData();
    formData.append('name', form.name.trim());
    
    if (form.description.trim()) {
      formData.append('description', form.description.trim());
    }
    
    // Only append subcategories if there are any
    if (subcategories.length > 0) {
      formData.append('subcategories', JSON.stringify(subcategories));
    }
    
    // Add category main image if a new one is selected
    if (categoryImageFile) {
      formData.append('categoryImage', categoryImageFile);
    }
    
    // CRITICAL FIX: Handle subcategory images properly for updates
    const finalSubcategoryImages = { ...subcategoryImages };
    
    // Remove data: URLs (previews) from the final object - we only want to keep existing DB paths
    Object.keys(finalSubcategoryImages).forEach(key => {
      if (finalSubcategoryImages[key] && finalSubcategoryImages[key].startsWith('data:')) {
        delete finalSubcategoryImages[key];
      }
    });

    // Add existing subcategory images that should be kept (only if we're editing)
    if (isEditing && editingId) {
      const currentCategory = categories.find(c => c.id === editingId);
      if (currentCategory && currentCategory.subcategoryImages) {
        // Only keep images for subcategories that still exist
        Object.keys(currentCategory.subcategoryImages).forEach(key => {
          if (subcategories.includes(key) && !subcategoryImageFiles[key]) {
            // This is an existing image we want to keep
            finalSubcategoryImages[key] = currentCategory.subcategoryImages[key];
          }
        });
      }
    }
    
    // Send the complete subcategoryImages object
    if (Object.keys(finalSubcategoryImages).length > 0) {
      formData.append('subcategoryImages', JSON.stringify(finalSubcategoryImages));
      console.log('Subcategory images to keep:', finalSubcategoryImages);
    }
    
    // Add NEW subcategory image files with mapping
    if (Object.keys(subcategoryImageFiles).length > 0) {
      const mapping = {};
      
      Object.keys(subcategoryImageFiles).forEach((subName) => {
        const file = subcategoryImageFiles[subName];
        mapping[file.name] = subName;
        formData.append('subcategoryImages', file);
      });
      
      formData.append('subcategoryImageMapping', JSON.stringify(mapping));
      console.log('New subcategory mapping:', mapping);
    }

    console.log('Sending FormData:');
    for (let pair of formData.entries()) {
      if (pair[0] === 'subcategoryImages') {
        console.log(pair[0], pair[1] instanceof File ? pair[1].name : '(JSON object)');
      } else {
        console.log(pair[0], pair[1] instanceof File ? pair[1].name : pair[1]);
      }
    }

    let response;
    
    if (isEditing && editingId) {
      console.log('Sending PUT request to:', `/categories/${editingId}`);
      response = await api.put(`/categories/${editingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } else {
      console.log('Sending POST request to:', '/categories');
      response = await api.post("/categories", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    }

    console.log('Response:', response.data);
    
    setIsDialogOpen(false);
    resetForm();
    fetchCategories();
    if (onCreated) onCreated();
    
  } catch (err) {
    console.error("Create/Update category failed", err);
    console.error("Error response:", err.response);
    console.error("Error data:", err.response?.data);
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error ||
                        err.message ||
                        "Failed to save category";
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleEdit = (category) => {
    resetForm();
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setSubcategories(category.subcategories || []);
    setEditingId(category.id);
    setIsEditing(true);
    
    // Set category image preview if exists - Use getImageUrl to ensure proper URL
    if (category.image) {
      setCategoryImagePreview(getImageUrl(category.image));
    }
    
    // Set subcategory images if exist - Process each image through getImageUrl
    if (category.subcategoryImages && Object.keys(category.subcategoryImages).length > 0) {
      const processedImages = {};
      Object.keys(category.subcategoryImages).forEach(key => {
        processedImages[key] = getImageUrl(category.subcategoryImages[key]);
      });
      setSubcategoryImages(processedImages);
    }
    
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/categories/${id}/status`, { isActive: !currentStatus });
      toast({ 
        title: "Success", 
        description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to update category status", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/categories/${id}?hardDelete=true`);
      toast({ 
        title: "Success", 
        description: "Category deleted permanently" 
      });
      fetchCategories();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Add and manage product categories and subcategories with images</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Category Image</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No categories found. Click "Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        {category.image ? (
                          <img 
                            src={getImageUrl(category.image)} 
                            alt={category.name}
                            className="h-12 w-12 object-cover rounded-md"
                            onError={(e) => {
                              console.error('Failed to load category image:', category.image);
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Folder className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories
                              ?.slice(0, 3)
                              .map((subcat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {subcat}
                                </Badge>
                              ))}
                            {category.subcategories &&
                              category.subcategories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{category.subcategories.length - 3} more
                                </Badge>
                              )}
                          </div>
                          {category.subcategoryImages && Object.keys(category.subcategoryImages).length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Image className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {Object.keys(category.subcategoryImages).length} subcategory image(s)
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.isActive ? "default" : "secondary"} 
                          className={category.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(category.id, category.isActive)}>
                              {category.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive" 
                              onClick={() => handleDelete(category.id)}
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update category information and images below." 
                : "Fill in the details to create a new category with subcategory images."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Category Main Image Upload */}
            <div className="space-y-3 border-b pb-4">
              <Label className="text-base font-semibold">Category Main Image</Label>
              <div className="flex items-start gap-4">
                {categoryImagePreview ? (
                  <div className="relative">
                    <img 
                      src={categoryImagePreview} 
                      alt="Category preview" 
                      className="h-20 w-20 object-cover rounded-md border"
                      onError={(e) => {
                        console.error('Failed to load preview image:', categoryImagePreview);
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeCategoryImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="categoryImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: Square image, max 5MB
                  </p>
                  {isEditing && categoryImagePreview && !categoryImageFile && (
                    <p className="text-xs text-blue-600 mt-1">
                      Current image will be kept if no new file is selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>

            {/* Subcategories Section with Image Upload */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">Subcategories with Images</Label>
              
              {/* Add Subcategory Input */}
              <div className="flex gap-2">
                <Input
                  value={subcategoryInput}
                  onChange={(e) => setSubcategoryInput(e.target.value)}
                  placeholder="Enter subcategory name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubcategory();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={handleAddSubcategory}
                  disabled={!subcategoryInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Subcategories List with Image Upload */}
              {subcategories.length > 0 && (
                <div className="border rounded-lg p-4 space-y-4">
                  <p className="text-sm font-medium">Subcategory Images:</p>
                  {subcategories.map((subcat, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                      {/* Subcategory Image Preview */}
                      <div className="relative shrink-0">
                        {subcategoryImages[subcat] ? (
                          <div className="relative">
                            <img 
                              src={subcategoryImages[subcat]} 
                              alt={subcat}
                              className="h-16 w-16 object-cover rounded-md border"
                              onError={(e) => {
                                console.error('Failed to load subcategory image:', subcategoryImages[subcat]);
                                e.target.src = '/placeholder-image.png';
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                              onClick={() => removeSubcategoryImage(subcat)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Subcategory Info and Upload */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="px-3 py-1">
                            {subcat}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-7 px-2 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveSubcategory(index)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSubcategoryImageChange(subcat, e)}
                          className="cursor-pointer text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {subcategoryImages[subcat] && !subcategoryImageFiles[subcat] 
                            ? `Current image will be kept if no new file is selected`
                            : `Upload image for ${subcat}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Add subcategories and upload images for each. These images will be displayed in the Subcategory Slider on the homepage.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddCategory;