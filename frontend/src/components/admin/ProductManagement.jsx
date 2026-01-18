import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Filter, Edit, Trash2, MoreVertical, Upload, Loader2,
  Package, CheckCircle, XCircle, AlertTriangle, Star, Image as ImageIcon,
  Tag, Layers, DollarSign, BarChart3, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef([]);
  const { toast } = useToast();

  // Form State
  const [form, setForm] = useState({
    code: "",
    name: "",
    variant: "",
    sku: "",
    price: "",
    discountPrice: "",
    tax: "",
    categoryId: "",
    subcategory: "",
    brandId: "",
    modelCode: "",
    modelName: "",
    description: "",
    isFeatured: false,
    isActive: true,
  });

  const [colorsList, setColorsList] = useState([
    { name: "", files: [], existingImages: [], stock: 0 },
  ]);
  const [attributes, setAttributes] = useState("{}");

  // Metadata
  const [brands, setBrands] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // Auth User
  const currentUserId = localStorage.getItem("userId") || "1";

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      variant: "",
      sku: "",
      price: "",
      discountPrice: "",
      tax: "",
      categoryId: "",
      subcategory: "",
      brandId: "",
      modelCode: "",
      modelName: "",
      description: "",
      isFeatured: false,
      isActive: true,
    });
    setColorsList([{ name: "", files: [], existingImages: [], stock: 0 }]);
    setAttributes("{}");
    setEditingProductId(null);
    setIsEditing(false);
    setIsSubmitting(false);
    fileInputRefs.current = [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, brandRes, catRes] = await Promise.all([
        api.get("/products", { params: { page: 1, limit: 200 } }),
        api.get("/brands"),
        api.get("/categories")
      ]);

      // Process Products
      const prodData = prodRes.data?.data || prodRes.data;
      const prods = Array.isArray(prodData) ? prodData : (prodData?.products || []);

      const safeParse = (val, defaultVal) => {
        if (!val) return defaultVal;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch { return defaultVal; }
      };

      setProducts(prods.map(p => ({
        ...p,
        colorsAndImages: safeParse(p.colorsAndImages, {}),
        stock: safeParse(p.stock, {}),
        attributes: safeParse(p.attributes, {}),
      })));

      // Process Brands & Categories
      setBrands(brandRes.data?.data || brandRes.data || []);

      const rawCats = catRes.data?.data || catRes.data || [];
      setCategoriesList(rawCats.map(c => ({
        ...c,
        subcategories: Array.isArray(c.subcategories) ? c.subcategories : safeParse(c.subcategories, [])
      })));

    } catch (err) {
      console.error("Data load error:", err);
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // SKU Generation Logic
  useEffect(() => {
    if (isEditing || !form.code || !form.brandId || !form.categoryId) return;

    const brand = brands.find(b => String(b.id) === form.brandId);
    const category = categoriesList.find(c => String(c.id) === form.categoryId);

    if (brand && category) {
      const timestamp = Date.now().toString().slice(-6);
      const brandCode = brand.name.substring(0, 3).toUpperCase().replace(/\s/g, "");
      const catCode = category.name.substring(0, 3).toUpperCase().replace(/\s/g, "");
      const subCode = form.subcategory ? form.subcategory.substring(0, 3).toUpperCase().replace(/\s/g, "") : "GEN";
      const prodCode = form.code.toUpperCase().replace(/\s/g, "");

      setForm(prev => ({
        ...prev,
        sku: `${brandCode}-${prodCode}-${catCode}-${subCode}-${timestamp}`
      }));
    }
  }, [form.code, form.brandId, form.categoryId, form.subcategory]);

  // Filtering
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      product.name?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.code?.toLowerCase().includes(searchLower);

    const matchesCategory = filterCategory === "all" || product.category?.name === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    featured: products.filter(p => p.isFeatured).length,
    outOfStock: products.filter(p => {
      if (!p.stock) return true;
      if (typeof p.stock === 'number') return p.stock === 0;
      return Object.values(p.stock).every(val => Number(val) === 0);
    }).length
  };

  // Handlers
  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setEditingProductId(String(product.id));

    // Parse Colors
    const colors = [];
    if (product.colorsAndImages) {
      Object.entries(product.colorsAndImages).forEach(([name, images]) => {
        colors.push({
          name,
          existingImages: Array.isArray(images) ? images : [],
          files: [],
          stock: product.stock?.[name] ? Number(product.stock[name]) : 0
        });
      });
    }
    if (colors.length === 0) colors.push({ name: "", files: [], existingImages: [], stock: 0 });

    setForm({
      code: product.code || "",
      name: product.name || "",
      variant: product.variant || "",
      sku: product.sku || "",
      price: String(product.price || ""),
      discountPrice: String(product.discountPrice || ""),
      tax: String(product.tax || ""),
      categoryId: product.category?.id ? String(product.category.id) : "",
      subcategory: product.subcategory || "",
      brandId: product.brand?.id ? String(product.brand.id) : "",
      modelCode: product.modelCode || "",
      modelName: product.modelName || "",
      description: product.description || "",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive ?? true,
    });

    setColorsList(colors);
    setAttributes(product.attributes ? JSON.stringify(product.attributes, null, 2) : "{}");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.code || !form.name || !form.brandId || !form.categoryId || !form.price) {
      toast({ title: "Missing Fields", description: "Please fill all required fields info tab", variant: "destructive" });
      return;
    }
    if (colorsList.every(c => !c.name)) {
      toast({ title: "Incomplete", description: "At least one color variant is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      formData.append("sellerId", currentUserId);

      // Complex Data Structures
      const stockObj = {};
      const fileColorMapping = {};
      let fileIndex = 0;

      colorsList.forEach(color => {
        if (!color.name) return;
        stockObj[color.name] = color.stock || 0;

        if (color.files?.length) {
          const indices = [];
          color.files.forEach(file => {
            formData.append("images", file);
            indices.push(fileIndex++);
          });
          fileColorMapping[color.name] = indices;
        }
      });

      formData.append("stock", JSON.stringify(stockObj));
      if (Object.keys(fileColorMapping).length) {
        formData.append("fileColorMapping", JSON.stringify(fileColorMapping));
      }

      // Existing Images (for edit)
      const existingImages = {};
      colorsList.forEach(c => {
        if (c.name && c.existingImages?.length) {
          existingImages[c.name] = c.existingImages;
        }
      });
      formData.append("colorsAndImages", JSON.stringify(existingImages));

      try {
        formData.append("attributes", JSON.stringify(JSON.parse(attributes)));
      } catch {
        formData.append("attributes", "{}");
      }

      if (isEditing && editingProductId) {
        const res = await api.put(`/products/${editingProductId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setProducts(prev => prev.map(p => String(p.id) === String(editingProductId) ? { ...p, ...res.data.data } : p));
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const res = await api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setProducts(prev => [res.data.data, ...prev]);
        toast({ title: "Success", description: "Product created successfully" });
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err.response?.data?.message || "Operation failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Color & File Handlers
  const updatedColors = (idx, field, val) => {
    const newColors = [...colorsList];
    newColors[idx] = { ...newColors[idx], [field]: val };
    setColorsList(newColors);
  };

  const handleFileSelect = (idx, files) => {
    if (!files) return;
    const current = colorsList[idx].files || [];
    updatedColors(idx, 'files', [...current, ...Array.from(files)]);
  };

  const removeFile = (cIdx, fIdx) => {
    const newColors = [...colorsList];
    const files = [...newColors[cIdx].files];
    files.splice(fIdx, 1);
    newColors[cIdx].files = files;
    setColorsList(newColors);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", val: stats.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active", val: stats.active, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
          { label: "Out of Stock", val: stats.outOfStock, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
          { label: "Featured", val: stats.featured, icon: Star, color: "text-amber-500", bg: "bg-amber-100" },
        ].map((s, i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: s.color.includes('red') ? 'red' : s.color.includes('green') ? 'green' : s.color.includes('amber') ? 'orange' : 'currentColor' }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.val}</p>
              </div>
              <div className={`p-2 rounded-full ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>Manage your catalog, prices, and stock levels</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...new Set(categoriesList.map(c => c.name))].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Added max-height and overflow-auto for vertical scrolling */}
          <div className="rounded-md border max-h-[calc(100vh-300px)] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10"> {/* Sticky header */}
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Info</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Colors</TableHead> {/* Added Colors Column Header */}
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center"> {/* Updated colSpan */}
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground"> {/* Updated colSpan */}
                      No products found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => {
                    const img = Object.values(product.colorsAndImages || {})[0]?.[0]?.url;
                    const stock = typeof product.stock === 'object'
                      ? Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0)
                      : Number(product.stock);

                    // Extract colors
                    const availableColors = Object.keys(product.colorsAndImages || {});

                    return (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                            {img ? (
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[200px]" title={product.name}>{product.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{product.category?.name || "Uncategorized"}</Badge>
                        </TableCell>
                        {/* Added Colors Column Cell */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {availableColors.length > 0 ? (
                              availableColors.map((color, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                  {color}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">₹{product.price}</span>
                            {product.discountPrice && <span className="text-xs text-muted-foreground line-through">₹{product.discountPrice}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stock > 0 ? "secondary" : "destructive"} className={stock > 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                            {stock} in stock
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {product.isActive ? (
                              <Badge variant="default" className="w-fit bg-green-600 hover:bg-green-700 text-[10px]">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="w-fit text-[10px]">Draft</Badge>
                            )}
                            {product.isFeatured && (
                              <Badge variant="default" className="w-fit bg-amber-500 hover:bg-amber-600 text-[10px] flex gap-1">
                                <Star className="h-2 w-2 fill-current" /> Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  if (confirm('Delete this product?')) {
                                    await api.delete(`/products/${product.id}`);
                                    setProducts(prev => prev.filter(p => p.id !== product.id));
                                    toast({ title: "Deleted", description: "Product removed" });
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>Fill in the details below to {isEditing ? "update" : "create"} a product.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                  <TabsTrigger value="images">Images & Colors</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                </TabsList>

                {/* BASIC INFO TAB */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cotton T-Shirt" />
                    </div>
                    <div className="space-y-2">
                      <Label>Product Code *</Label>
                      <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. TSHIRT-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand *</Label>
                      <Select value={form.brandId} onValueChange={v => setForm({ ...form, brandId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                        <SelectContent>
                          {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {categoriesList.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategory</Label>
                      <Select value={form.subcategory} onValueChange={v => setForm({ ...form, subcategory: v })}>
                        <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                        <SelectContent>
                          {categoriesList.find(c => String(c.id) === form.categoryId)?.subcategories.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model Code *</Label>
                      <Input value={form.modelCode} onChange={e => setForm({ ...form, modelCode: e.target.value })} placeholder="e.g. MOD-2024" />
                    </div>
                    <div className="space-y-2">
                      <Label>Model Name *</Label>
                      <Input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })} placeholder="e.g. Summer Edition" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU (Auto-Generated)</Label>
                      <Input value={form.sku} readOnly className="bg-muted font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product details..." rows={4} />
                  </div>
                  <div className="flex gap-6 pt-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.isActive} onCheckedChange={c => setForm({ ...form, isActive: c })} />
                      <Label>Active Product</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.isFeatured} onCheckedChange={c => setForm({ ...form, isFeatured: c })} />
                      <Label>Featured Product</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* PRICING TAB */}
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Price (₹) *</Label>
                      <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Price (₹)</Label>
                      <Input type="number" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Tag className="h-4 w-4" /> Pricing Summary</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between"><span>Base Price:</span> <span className="font-mono">₹{form.price || 0}</span></div>
                      <div className="flex justify-between"><span>Discount Price:</span> <span className="font-mono text-green-600">₹{form.discountPrice || 0}</span></div>
                      <div className="flex justify-between border-t pt-1 font-bold"><span>Final Display:</span> <span>₹{form.discountPrice || form.price || 0}</span></div>
                    </div>
                  </div>
                </TabsContent>

                {/* IMAGES TAB */}
                <TabsContent value="images" className="space-y-6">
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                    <div>
                      <h4 className="font-semibold">Color Variants</h4>
                      <p className="text-xs text-muted-foreground">Manage colors, stock, and images</p>
                    </div>
                    <Button size="sm" onClick={() => setColorsList([...colorsList, { name: "", files: [], existingImages: [], stock: 0 }])}>
                      <Plus className="h-4 w-4 mr-1" /> Add Color
                    </Button>
                  </div>

                  {colorsList.map((color, idx) => (
                    <div key={idx} className="border rounded-xl p-4 space-y-4 relative bg-card">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => {
                        const newColors = [...colorsList];
                        newColors.splice(idx, 1);
                        setColorsList(newColors);
                      }}><Trash2 className="h-4 w-4" /></Button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Color Name</Label>
                          <Input value={color.name} onChange={e => updatedColors(idx, 'name', e.target.value)} placeholder="e.g. Navy Blue" />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock Quantity</Label>
                          <Input type="number" value={color.stock} onChange={e => updatedColors(idx, 'stock', Number(e.target.value))} placeholder="0" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Images</Label>
                        <div className="flex flex-wrap gap-2">
                          {color.existingImages?.map((img, iIdx) => (
                            <div key={`exist-${iIdx}`} className="relative h-20 w-20 rounded-md border overflow-hidden group">
                              <img src={img.url} className="h-full w-full object-cover" />
                              <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                onClick={() => {
                                  const newColors = [...colorsList];
                                  newColors[idx].existingImages.splice(iIdx, 1);
                                  setColorsList(newColors);
                                }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {color.files?.map((file, fIdx) => (
                            <div key={`new-${fIdx}`} className="relative h-20 w-20 rounded-md border overflow-hidden group">
                              <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                              <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                onClick={() => removeFile(idx, fIdx)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <Badge className="absolute bottom-0 left-0 right-0 rounded-none text-[10px] h-4 px-1">New</Badge>
                            </div>
                          ))}
                          <label className="h-20 w-20 flex flex-col items-center justify-center rounded-md border border-dashed hover:bg-muted cursor-pointer transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-[10px] text-muted-foreground">Upload</span>
                            <input type="file" multiple accept="image/*" className="hidden"
                              onChange={e => handleFileSelect(idx, e.target.files)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* ATTRIBUTES TAB */}
                <TabsContent value="attributes" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Additional Attributes (JSON Format)</Label>
                    <CardDescription className="mb-2">Enter technical specs like Size, Material, Warranty in JSON format.</CardDescription>
                    <Textarea
                      value={attributes}
                      onChange={e => setAttributes(e.target.value)}
                      className="font-mono text-sm"
                      rows={10}
                      placeholder='{
  "Material": "100% Cotton",
  "Fit": "Regular",
  "Care": "Machine wash cold"
}'
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="border-t p-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
