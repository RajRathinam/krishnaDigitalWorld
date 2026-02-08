import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, ImageIcon, Loader2, MoreVertical } from "lucide-react";
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

export const AddBrand = () => {
    const [brands, setBrands] = useState([]);
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
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            isActive: true,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingId(null);
        setIsEditing(false);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await api.get("/brands");
            // Handle different response structures
            const data = res.data?.data || res.data || [];
            setBrands(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch brands error:", err);
            toast({
                title: "Error",
                description: "Failed to load brands",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Brand name is required",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("description", form.description.trim());
            formData.append("isActive", form.isActive.toString());

            if (selectedFile) {
                formData.append("logo", selectedFile);
            }

            if (isEditing) {
                await api.put(`/brands/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Brand updated successfully" });
            } else {
                await api.post("/brands", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Brand created successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchBrands();
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Operation failed",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (brand) => {
        resetForm();
        setForm({
            name: brand.name || "",
            description: brand.description || "",
            isActive: brand.isActive ?? true,
        });
        setEditingId(brand.id);
        if (brand.logo) {
            setPreviewUrl(brand.logo); // Assuming brand.logo contains the image URL
        }
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this brand?")) return;
        try {
            await api.delete(`/brands/${id}`);
            toast({ title: "Success", description: "Brand deleted successfully" });
            fetchBrands();
        } catch (err) {
            toast({ 
                title: "Error", 
                description: "Failed to delete brand", 
                variant: "destructive" 
            });
        }
    };

    const handleUpdateStatus = async (id, currentStatus) => {
        try {
            await api.put(`/brands/${id}`, { isActive: !currentStatus });
            toast({ title: "Success", description: "Brand status updated" });
            fetchBrands();
        } catch (err) {
            console.error("Failed to update brand status", err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            return "Invalid Date";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
                    <div>
                        <CardTitle>Brand Management</CardTitle>
                        <CardDescription>Add and manage product brands</CardDescription>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Brand
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Logo</TableHead>
                                    <TableHead>Brand Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[100px]">Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : brands.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No brands found. Click "Add Brand" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    brands.map((brand) => (
                                        <TableRow key={brand.id}>
                                            <TableCell>
                                                <div className="h-12 w-12 rounded-md border overflow-hidden bg-muted">
                                                    {brand.logo ? (
                                                        <img
                                                            src={brand.logo}
                                                            alt={brand.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{brand.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground line-clamp-2">
                                                    {brand.description || "No description"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={brand.isActive ? "default" : "secondary"} 
                                                    className={brand.isActive ? "bg-green-600" : ""}
                                                >
                                                    {brand.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(brand.createdAt || brand.created_at)}
                                                </span>
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
                                                            <DropdownMenuItem onClick={() => handleEdit(brand)}>
                                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(brand.id, brand.isActive)}>
                                                                {brand.isActive ? "Deactivate" : "Activate"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="text-destructive" 
                                                                onClick={() => handleDelete(brand.id)}
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

            {/* Add/Edit Brand Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Brand" : "Add New Brand"}</DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? "Update brand information below." 
                                : "Fill in the details to create a new brand."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Brand Name *</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Enter brand name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Brand description (optional)"
                                rows={3}
                            />
                        </div>

                        {/* Logo Upload Section */}
                        <div className="space-y-2">
                            <Label>Brand Logo</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                                {previewUrl ? (
                                    <div className="relative w-full">
                                        <div className="mx-auto h-32 w-32 rounded-md overflow-hidden bg-muted">
                                            <img 
                                                src={previewUrl} 
                                                className="h-full w-full object-contain" 
                                                alt="Brand logo preview" 
                                            />
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 h-8 w-8 p-0"
                                            onClick={() => { 
                                                setSelectedFile(null); 
                                                setPreviewUrl(null); 
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground text-center">
                                            Upload brand logo (optional)
                                        </p>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="w-fit"
                                            onChange={handleFileChange}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Update Brand" : "Create Brand"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddBrand;