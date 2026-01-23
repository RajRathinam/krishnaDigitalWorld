import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Folder, Tag, Plus, X } from "lucide-react";
import api from "@/lib/api";

export const AddCategory = ({ onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
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
    }
    catch (err) {
      console.error("Failed to load categories", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load categories",
        variant: "destructive",
      });
    }
    finally {
      setLoadingCategories(false);
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
    setName("");
    setDescription("");
    setParentId("");
    setSubcategories([]);
    setSubcategoryInput("");
    setEditingCategory(null);
    setIsEditing(false);
  };
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation",
        description: "Category name is required",
      });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        subcategories: subcategories.length > 0 ? subcategories : undefined,
      };
      if (parentId)
        payload.parentId = Number(parentId);
      let response;
      if (isEditing && editingCategory) {
        response = await api.put(`/categories/${editingCategory.id}`, payload);
        toast({
          title: "Category updated",
          description: response.data?.message || "Category updated successfully",
        });
      }
      else {
        response = await api.post("/categories", payload);
        toast({
          title: "Category created",
          description: response.data?.message || "Category created successfully",
        });
      }
      resetForm();
      fetchCategories();
      if (onCreated)
        onCreated();
    }
    catch (err) {
      console.error("Create/Update category failed", err);
      toast({
        title: "Error",
        description: err.response?.data?.message ||
          err?.message ||
          "Failed to save category",
      });
    }
    finally {
      setLoading(false);
    }
  };
  const handleEdit = (category) => {
    setName(category.name);
    setDescription(category.description || "");
    setParentId(category.parentId ? String(category.parentId) : "");
    setSubcategories(category.subcategories || []);
    setEditingCategory(category);
    setIsEditing(true);
    document
      .getElementById("category-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const handleUpdateStatus = async (id, isActive) => {
    try {
      await api.put(`/categories/${id}`, { isActive: !isActive });
      toast({ title: "Success", description: "Category status updated" });
      fetchCategories();
    }
    catch (err) {
      console.error("Failed to update category status", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update status",
      });
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await api.delete(`/categories/${id}`);
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
      if (editingCategory?.id === id) {
        resetForm();
      }
    }
    catch (err) {
      console.error("Failed to delete category", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete category",
      });
    }
  };
  const getParentName = (parentId) => {
    if (!parentId)
      return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || "Unknown";
  };
  const topLevelCategories = categories.filter((cat) => !cat.parentId);
  return (<div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add/Edit Category Form */}
      <div id="category-form">
        <h2 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Category" : "Add New Category"}
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Parent Category (optional)</Label>
            <Select value={parentId} onValueChange={(val) => setParentId(val === "__none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None (Top Level)</SelectItem>
                {topLevelCategories
                  .filter((c) => !isEditing || c.id !== editingCategory?.id)
                  .map((c) => (<SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategories Section */}
          <div className="space-y-3">
            <Label>Subcategories</Label>
            <div className="flex gap-2">
              <Input value={subcategoryInput} onChange={(e) => setSubcategoryInput(e.target.value)} placeholder="Enter subcategory name" onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubcategory();
                }
              }} />
              <Button type="button" variant="outline" size="icon" onClick={handleAddSubcategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {subcategories.length > 0 && (<div className="border rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {subcategories.map((subcat, index) => (<Badge key={index} variant="secondary" className="px-3 py-1">
                  {subcat}
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-2" onClick={() => handleRemoveSubcategory(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>))}
              </div>
            </div>)}
            <p className="text-xs text-muted-foreground">
              Add subcategories like "TV", "Washing Machine", "Refrigerator".
              These will be available as options when creating products in this
              category.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button disabled={loading} onClick={handleSubmit} className="flex-1">
              {loading
                ? "Saving..."
                : isEditing
                  ? "Update Category"
                  : "Save Category"}
            </Button>
            {isEditing && (<Button variant="outline" onClick={resetForm} disabled={loading}>
              Cancel
            </Button>)}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Categories ({categories.length})
            {isEditing && editingCategory && (<span className="text-sm font-normal text-muted-foreground ml-2">
              • Editing: {editingCategory.name}
            </span>)}
          </h2>
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loadingCategories}>
            Refresh
          </Button>
        </div>

        {loadingCategories ? (<div className="text-center py-8">
          <p>Loading categories...</p>
        </div>) : categories.length === 0 ? (<div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No categories found</p>
        </div>) : (<div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Subcategories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (<TableRow key={category.id} className={category.parentId ? "bg-muted/30" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {category.parentId ? (<Tag className="h-4 w-4 text-muted-foreground" />) : (<Folder className="h-4 w-4 text-muted-foreground" />)}
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (<p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {category.description}
                      </p>)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getParentName(category.parentId)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {category.subcategories
                      ?.slice(0, 3)
                      .map((subcat, idx) => (<Badge key={idx} variant="outline" className="text-xs">
                        {subcat}
                      </Badge>))}
                    {category.subcategories &&
                      category.subcategories.length > 3 && (<Badge variant="outline" className="text-xs">
                        +{category.subcategories.length - 3} more
                      </Badge>)}
                    {(!category.subcategories ||
                      category.subcategories.length === 0) && (<span className="text-xs text-muted-foreground">None</span>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>))}
            </TableBody>
          </Table>
        </div>)}
      </div>
    </div>
  </div>);
};
export default AddCategory;
