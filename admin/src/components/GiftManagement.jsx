import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils"; 

export const GiftManagement = () => {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Form State
    const [form, setForm] = useState({
        productName: "",
        price: "",
        status: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const resetForm = () => {
        setForm({
            productName: "",
            price: "",
            status: true,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingId(null);
        setIsEditing(false);
    };

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/gifts");
            const data = res.data?.data || res.data || [];
            setGifts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch gifts error:", err);
            toast({
                title: "Error",
                description: "Failed to load gifts",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "Image size must be less than 3MB",
                    variant: "destructive",
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!form.productName.trim() || !form.price) {
            toast({
                title: "Validation Error",
                description: "Product name and price are required",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("productName", form.productName.trim());
            formData.append("price", form.price);
            formData.append("status", form.status.toString());

            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            if (isEditing) {
                await api.put(`/gifts/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Gift updated successfully" });
            } else {
                await api.post("/gifts", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Gift created successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchGifts();
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

    const handleEdit = (gift) => {
        resetForm();
        setForm({
            productName: gift.productName || "",
            price: gift.price || "",
            status: gift.status ?? true,
        });
        setEditingId(gift.id);
        if (gift.image) {
            setPreviewUrl(getImageUrl(gift.image));
        }
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this gift?")) return;
        try {
            await api.delete(`/gifts/${id}`);
            toast({ title: "Success", description: "Gift deleted successfully" });
            fetchGifts();
        } catch (err) {
            toast({ 
                title: "Error", 
                description: "Failed to delete gift", 
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

    const filteredGifts = gifts.filter(gift => 
        gift.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full justify-between">
                        <div>
                            <CardTitle>Gifts Management</CardTitle>
                            <CardDescription>Add and manage gifts</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                                placeholder="Search gifts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-[300px]"
                            />
                            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="shrink-0">
                                <Plus className="h-4 w-4 mr-2" /> Add Gift
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Price</TableHead>
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
                                ) : filteredGifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            {searchTerm ? "No gifts match your search." : "No gifts found. Click \"Add Gift\" to create one."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGifts.map((gift) => (
                                        <TableRow key={gift.id}>
                                            <TableCell>
                                                <div className="h-12 w-12 p-1 rounded-md border overflow-hidden bg-white">
                                                    {gift.image ? (
                                                        <img
                                                            src={getImageUrl(gift.image)}
                                                            alt={gift.productName}
                                                            className="h-full w-full object-contain"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "";
                                                                e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center bg-gray-100"><svg class="h-6 w-6 text-gray-400" ... /></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                            <ImageIcon className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{gift.productName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                ₹{gift.price}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={gift.status ? "default" : "secondary"} 
                                                    className={gift.status ? "bg-green-600" : ""}
                                                >
                                                    {gift.status ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(gift.createdAt || gift.created_at)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleEdit(gift)}
                                                    title="Edit Gift"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(gift.id)}
                                                    title="Delete Gift"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Gift Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Gift" : "Add New Gift"}</DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? "Update gift information below." 
                                : "Fill in the details to create a new gift."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="productName">Product Name *</Label>
                            <Input
                                id="productName"
                                value={form.productName}
                                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                                placeholder="Enter gift name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="Enter price"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="status" 
                                checked={form.status} 
                                onChange={(e) => setForm({...form, status: e.target.checked})}
                            />
                            <Label htmlFor="status" className="cursor-pointer">Active</Label>
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <Label>Gift Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                                {previewUrl ? (
                                    <div className="relative w-full">
                                        <div className="mx-auto h-32 w-32 rounded-md overflow-hidden bg-muted">
                                            <img 
                                                src={previewUrl} 
                                                className="h-full w-full object-contain" 
                                                alt="Gift image preview" 
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
                                            Upload gift image (optional, max 3MB)
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
                            {isEditing ? "Update Gift" : "Create Gift"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GiftManagement;
