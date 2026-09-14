import { useState, useEffect } from "react";
import { Loader2, Search, CheckCircle, XCircle, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils"; 

export const OfflineGiftClaims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showToday, setShowToday] = useState(false);
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
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full justify-between">
                        <div>
                            <CardTitle>Offline Gift Claims</CardTitle>
                            <CardDescription>View and manage offline QR scans</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search user, phone or gift..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8"
                                />
                            </div>
                            <Button 
                                variant={showToday ? "default" : "outline"}
                                onClick={() => setShowToday(!showToday)}
                                className="w-full sm:w-auto"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Today Only
                            </Button>
                        </div>
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
                                    filteredClaims.map((claim) => (
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default OfflineGiftClaims;
