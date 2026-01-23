import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import api from "@/lib/api";

export const AddBrand = ({ onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await api.get("/brands");
      const data = response.data?.data || response.data || [];
      setBrands(Array.isArray(data) ? data : []);
    }
    catch (err) {
      console.error("Failed to load brands", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load brands",
        variant: "destructive",
      });
    }
    finally {
      setLoadingBrands(false);
    }
  };
  useEffect(() => {
    fetchBrands();
  }, []);
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation",
        description: "Brand name is required",
      });
      return;
    }
    try {
      setLoading(true);
      if (editingId) {
        // Update
        const response = await api.put(`/brands/${editingId}`, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({
          title: "Brand updated",
          description: response.data?.message || "Brand updated successfully",
        });
      } else {
        // Create
        const response = await api.post("/brands", {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({
          title: "Brand created",
          description: response.data?.message || "Brand created successfully",
        });
      }
      // Reset
      setName("");
      setDescription("");
      setEditingId(null);
      fetchBrands(); // Refresh the list
      if (onCreated)
        onCreated();
    }
    catch (err) {
      console.error("Save brand failed", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || err?.message || "Failed to save brand",
        variant: "destructive"
      });
    }
    finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setName(brand.name);
    setDescription(brand.description || "");
    setEditingId(brand.id);
  };

  const handleCancelEdit = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const handleUpdateStatus = async (id, isActive) => {
    try {
      await api.put(`/brands/${id}`, { isActive: !isActive });
      toast({ title: "Success", description: "Brand status updated" });
      fetchBrands();
    }
    catch (err) {
      console.error("Failed to update brand status", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this brand?"))
      return;
    try {
      await api.delete(`/brands/${id}`);
      toast({ title: "Success", description: "Brand deleted successfully" });
      fetchBrands();
    }
    catch (err) {
      console.error("Failed to delete brand", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete brand",
        variant: "destructive"
      });
    }
  };

  // Helper for safe date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (<div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add/Edit Brand Form */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Brand" : "Add New Brand"}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          <div className="flex gap-2">
            <Button disabled={loading} onClick={handleSubmit} className="w-full">
              {loading ? "Saving..." : (editingId ? "Update Brand" : "Save Brand")}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Brands List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Brands ({brands.length})</h2>
          <Button variant="outline" size="sm" onClick={fetchBrands} disabled={loadingBrands}>
            Refresh
          </Button>
        </div>

        {loadingBrands ? (<div className="text-center py-8">
          <p>Loading brands...</p>
        </div>) : brands.length === 0 ? (<div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No brands found</p>
        </div>) : (<div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (<TableRow key={brand.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {brand.logo && (<img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded object-cover" />)}
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      {brand.description && (<p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {brand.description}
                      </p>)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(brand.createdAt || brand.created_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(brand)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(brand.id)}>
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
export default AddBrand;
