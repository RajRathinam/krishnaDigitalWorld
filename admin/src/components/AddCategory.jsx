import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, MoreVertical, Folder, Tag, X } from "lucide-react";
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

export const AddCategory = ({ onCreated }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { toast } = useToast();

  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategories, setSubcategories] = useState([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      const data = response.data?.data || response.data || [];

      // Helper parsing function
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

      const parsedCategories = (Array.isArray(data) ? data : []).map(cat => ({
        ...cat,
        subcategories: safeParse(cat.subcategories)
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
    setSubcategories(subcategories.filter((_, i) => i !== index));
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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        subcategories: subcategories.length > 0 ? subcategories : undefined,
      };

      if (isEditing && editingId) {
        await api.put(`/categories/${editingId}`, payload);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await api.post("/categories", payload);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
      if (onCreated) onCreated();
    } catch (err) {
      console.error("Create/Update category failed", err);
      toast({
        title: "Error",
        description: err.response?.data?.message ||
          err?.message ||
          "Failed to save category",
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
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      await api.put(`/categories/${id}`, { isActive: !currentStatus });
      toast({ 
        title: "Success", 
        description: "Category status updated" 
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
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast({ 
        title: "Success", 
        description: "Category deleted successfully" 
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
            <CardDescription>Add and manage product categories and subcategories</CardDescription>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No categories found. Click "Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
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
                          {(!category.subcategories ||
                            category.subcategories.length === 0) && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.isActive ? "default" : "secondary"} 
                          className={category.isActive ? "bg-green-600" : ""}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                                className="text-destructive" 
                                onClick={() => handleDelete(category.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update category information below." 
                : "Fill in the details to create a new category."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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

            {/* Subcategories Section */}
            <div className="space-y-3">
              <Label>Subcategories</Label>
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
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {subcategories.length > 0 && (
                <div className="border rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((subcat, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {subcat}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          onClick={() => handleRemoveSubcategory(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add subcategories like "TV", "Washing Machine", "Refrigerator".
                These will be available as options when creating products in this category.
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