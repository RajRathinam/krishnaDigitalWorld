import { useState, useEffect } from "react";
import { Loader2, Search, CheckCircle, XCircle, Calendar, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 

export const OfflineGiftClaims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [showToday, setShowToday] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [exporting, setExporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const res = await api.get("/gifts/claims");
            const data = res.data?.data || res.data || [];
            setClaims(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch claims error:", err);
            toast({
                title: "Error",
                description: "Failed to load offline gift claims",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/gifts/claims/${id}`, { status });
            toast({ title: "Success", description: `Claim marked as ${status}` });
            fetchClaims();
        } catch (err) {
            console.error(err);
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
            return new Date(dateStr).toLocaleString();
        } catch (e) {
            return "Invalid Date";
        }
    };

    const filteredClaims = claims.filter(claim => {
        const matchesSearch = claim.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.user?.phone?.includes(searchTerm) ||
            claim.gift?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.status?.toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!showToday) return matchesSearch;
        
        const claimDate = new Date(claim.createdAt || claim.created_at);
        const today = new Date();
        const isToday = claimDate.getDate() === today.getDate() &&
            claimDate.getMonth() === today.getMonth() &&
            claimDate.getFullYear() === today.getFullYear();
            
        return matchesSearch && isToday;
    });

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setPage(1);
    };

    const handleExportClaims = () => {
        if (!filteredClaims.length) {
            toast({ title: "No data", description: "There are no claims to export." });
            return;
        }
        
        setExporting(true);
        try {
            const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s; };
            const headers = ["User Name", "Phone", "Gift Item", "Status", "Date Scanned"].join(",");
            const rows = filteredClaims.map(c => {
                return [
                    c.user?.name || "", 
                    c.user?.phone || "", 
                    c.gift?.productName || (c.status === 'lost' ? "None (Lost)" : ""), 
                    c.status || "", 
                    formatDate(c.createdAt || c.created_at)
                ].map(esc).join(",");
            });
            const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
            const link = Object.assign(document.createElement("a"), {
                href: URL.createObjectURL(blob),
                download: `offline_claims_${new Date().toISOString().slice(0,10)}.csv`,
            });
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            toast({ title: "Export successful", description: `${filteredClaims.length} records exported.` });
        } catch (err) {
            toast({ title: "Export failed", description: err.message, variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'won': return <Badge className="bg-yellow-500">Won</Badge>;
            case 'lost': return <Badge variant="secondary">Lost</Badge>;
            case 'claimed': return <Badge className="bg-green-600">Claimed</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle>Offline Gift Claims</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Showing {filteredClaims.length} claims
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-1 md:w-[250px] gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { setSearchTerm(searchInput); setPage(1); } }}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                            <Button onClick={() => { setSearchTerm(searchInput); setPage(1); }} className="h-9 px-3">
                                Search
                            </Button>
                        </div>
                        
                        <Button 
                            variant={showToday ? "default" : "outline"}
                            onClick={() => { setShowToday(!showToday); setPage(1); }}
                            className="h-9 text-sm"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Today Only
                        </Button>

                        <div className="flex items-center gap-2 border-l pl-3 ml-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
                            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange} disabled={loading}>
                                <SelectTrigger className="w-[80px] h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[15, 30, 45, 100, "all"].map(s => <SelectItem key={s} value={s.toString()}>{s === "all" ? "All" : s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button onClick={handleExportClaims} variant="outline" title="Export to CSV" className="h-9 px-3" disabled={exporting}>
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            <span className="text-sm">Export</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Gift Item</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[150px]">Date Scanned</TableHead>
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
                                ) : filteredClaims.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            {searchTerm ? "No claims match your search." : "No offline claims found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (() => {
                                        const currentSize = pageSize === "all" ? filteredClaims.length : parseInt(pageSize);
                                        const paginated = filteredClaims.slice((page - 1) * currentSize, page * currentSize);
                                        return paginated.map((claim) => (
                                            <TableRow key={claim.id}>
                                                <TableCell>
                                                    <span className="font-semibold">{claim.user?.name || 'Unknown'}</span>
                                                </TableCell>
                                                <TableCell>{claim.user?.phone || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {claim.gift ? (
                                                        <div className="flex items-center gap-2">
                                                            {claim.gift.image && (
                                                                <div className="h-8 w-8 p-0.5 rounded border overflow-hidden bg-white">
                                                                    <img 
                                                                        src={getImageUrl(claim.gift.image)} 
                                                                        alt={claim.gift.productName}
                                                                        className="h-full w-full object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                            <span className="font-medium text-sm text-yellow-600">
                                                                {claim.gift.productName}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">None (Lost)</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(claim.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(claim.createdAt || claim.created_at)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {claim.status === 'won' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                                onClick={() => handleStatusUpdate(claim.id, 'claimed')}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" /> Mark Claimed
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => handleStatusUpdate(claim.id, 'rejected')}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {(() => {
                        const currentSize = pageSize === "all" ? filteredClaims.length : parseInt(pageSize);
                        const totalPages = Math.ceil(filteredClaims.length / currentSize) || 1;
                        
                        if (totalPages <= 1) return null;
                        
                        return (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>
        </div>
    );
};
export default OfflineGiftClaims;
