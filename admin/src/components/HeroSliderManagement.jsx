import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Upload, ImageIcon, Loader2, Play, Pause, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export const HeroSliderManagement = () => {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { toast } = useToast();

    // Form State
    const [form, setForm] = useState({
        title: "",
        subtitle: "",
        cta: "",
        ctaLink: "",
        accent: "",
        order: 0,
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const resetForm = () => {
        setForm({
            title: "",
            subtitle: "",
            cta: "",
            ctaLink: "",
            accent: "",
            order: 0,
            isActive: true,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingId(null);
        setIsEditing(false);
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const res = await api.get("/hero-slider");
            setSliders(res.data?.data || []);
        } catch (err) {
            console.error("Fetch sliders error:", err);
            toast({
                title: "Error",
                description: "Failed to load hero sliders",
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
        if (!isEditing && !selectedFile) {
            toast({ title: "Incomplete", description: "Image is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                formData.append(key, val);
            });

            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            if (isEditing) {
                await api.put(`/hero-slider/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Hero slider updated successfully" });
            } else {
                await api.post("/hero-slider", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({ title: "Success", description: "Hero slider created successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchSliders();
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

    const handleEdit = (slider) => {
        resetForm();
        setForm({
            title: slider.title || "",
            subtitle: slider.subtitle || "",
            cta: slider.cta || "",
            ctaLink: slider.ctaLink || "",
            accent: slider.accent || "",
            order: slider.order || 0,
            isActive: slider.isActive ?? true,
        });
        setEditingId(slider.id);
        setPreviewUrl(getImageUrl(slider.image));
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this slider?")) return;
        try {
            await api.delete(`/hero-slider/${id}`);
            toast({ title: "Success", description: "Hero slider deleted" });
            fetchSliders();
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete slider", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
                    <div>
                        <CardTitle>Hero Slider Management</CardTitle>
                        <CardDescription>Upload and manage homepage banner slides</CardDescription>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Slide
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Image</TableHead>
                                    <TableHead>Text Details</TableHead>
                                    <TableHead>CTA</TableHead>
                                    <TableHead className="w-[80px]">Order</TableHead>
                                    <TableHead className="w-[80px]">Status</TableHead>
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
                                ) : sliders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No slides found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sliders.map((slider) => (
                                        <TableRow key={slider.id}>
                                            <TableCell>
                                                <div className="h-20 w-32 rounded-md border overflow-hidden bg-muted">
                                                    <img
                                                        src={getImageUrl(slider.image)}
                                                        alt={slider.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{slider.title}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{slider.subtitle}</span>
                                                    {slider.accent && <Badge className="w-fit mt-1 text-[10px]">{slider.accent}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{slider.cta}</span>
                                                    <span className="text-xs text-muted-foreground">{slider.ctaLink}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{slider.order}</TableCell>
                                            <TableCell>
                                                <Badge variant={slider.isActive ? "default" : "secondary"} className={slider.isActive ? "bg-green-600" : ""}>
                                                    {slider.isActive ? "Active" : "Hidden"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(slider)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(slider.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogContent className="sm:max-w-[800px] lg:max-w-[900px]">
        <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Slide" : "Add New Slide"}</DialogTitle>
            <DialogDescription>
                Enter slide details and upload an image (Recommended: 1600x530px or 16:9 ratio)
            </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            {/* First row: 3 fields */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Slide Title"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Accent Badge</Label>
                    <Input
                        value={form.accent}
                        onChange={(e) => setForm({ ...form, accent: e.target.value })}
                        placeholder="e.g. 50% Off"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                        type="number"
                        value={form.order}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setForm({ ...form, order: isNaN(val) ? 0 : val });
                        }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Description text..."
                />
            </div>

            {/* Second row: 3 fields */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input
                        value={form.cta}
                        onChange={(e) => setForm({ ...form, cta: e.target.value })}
                        placeholder="e.g. Shop Now"
                    />
                </div>
                <div className="space-y-2">
                    <Label>CTA Link</Label>
                    <Input
                        value={form.ctaLink}
                        onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                        placeholder="e.g. /products"
                    />
                </div>
                <div className="flex items-center gap-2 pt-8">
                    <Switch
                        checked={form.isActive}
                        onCheckedChange={(c) => setForm({ ...form, isActive: c })}
                    />
                    <Label>Active</Label>
                </div>
            </div>

            {/* Image upload section - still full width */}
            <div className="space-y-2 flex items-center gap-10">
                <Label>Slide Image *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                    {previewUrl ? (
                        <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                            <img src={previewUrl} className="h-full w-full object-contain" alt="Preview" />
                            <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0"
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center">Click to upload image</p>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Slide" : "Create Slide"}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
        </div>
    );
};
