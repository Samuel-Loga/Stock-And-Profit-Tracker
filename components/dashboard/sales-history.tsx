// components/dashboard/sales-history.tsx
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, ShoppingBag, MoreVertical, Edit2, Trash2, 
  Search, Filter, ChevronLeft, ChevronRight, RotateCcw 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { RecordSaleDialog } from './record-sale-dialog';

export function SalesHistory({ sales, onRefresh }: { sales: any[], onRefresh: () => void }) {
  const [deleteSale, setDeleteSale] = useState<any | null>(null);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Filtering & Search State
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');

  // Pagination State (Updated with Dynamic Page Size)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default to 10 rows

  // Combined Filter Logic
  const filteredSales = sales.filter(sale => {
    const itemName = sale.inventory?.item_name?.toLowerCase() || '';
    const matchesSearch = itemName.includes(search.toLowerCase());
    const matchesChannel = channelFilter === 'all' || sale.sales_channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  // Pagination Logic
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + pageSize);

  const resetPagination = () => setCurrentPage(1);

  const exportToCSV = () => {
    const headers = ["Date,Time,Item,Channel,Quantity,Unit Price,Discount,Total Revenue,Profit\n"];
    const rows = filteredSales.map(sale => {
      const dateObj = new Date(sale.sale_date);
      const discount = sale.discount_amount || 0;
      const totalRevenue = (sale.quantity_sold * sale.selling_price) - discount;
      const unitCost = sale.inventory?.purchase_price || 0;
      const totalProfit = totalRevenue - (unitCost * sale.quantity_sold);
      
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${sale.inventory?.item_name || 'Unknown'}"`,
        `"${sale.sales_channel || 'Direct'}"`,
        sale.quantity_sold,
        sale.selling_price,
        discount,
        totalRevenue,
        totalProfit
      ].join(",");
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const confirmDelete = async () => {
    if (deleteSale) {
      const { error: invError } = await supabase.rpc('return_stock_on_sale_deletion', {
        target_inventory_id: deleteSale.inventory_id,
        qty_to_return: deleteSale.quantity_sold
      });
      if (invError) return alert("Failed to return stock");
      await supabase.from('sales').delete().eq('id', deleteSale.id);
      onRefresh();
      setDeleteSale(null);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            Sales History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tracking <b>{totalItems}</b> transactions.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCSV} 
          className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          disabled={filteredSales.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>

      {/* FILTER TOOLBAR */}
      <div className="px-6 pb-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search item name..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Row Limit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); resetPagination(); }}>
              <SelectTrigger className="h-9 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-[1px] bg-slate-200" />

          <Select value={channelFilter} onValueChange={(val) => { setChannelFilter(val); resetPagination(); }}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="Direct">Direct</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
            </SelectContent>
          </Select>

          {(search || channelFilter !== 'all') && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearch(''); setChannelFilter('all'); resetPagination(); }}>
              <RotateCcw className="h-4 w-4 text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      <CardContent>
        {/* Table container stays same... */}
        <div className="rounded-xl border bg-white overflow-hidden shadow-inner">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px] font-bold">Date &amp; Time</TableHead>
                <TableHead className="font-bold">Item Details</TableHead>
                <TableHead className="font-bold">Channel</TableHead>
                <TableHead className="text-center font-bold">Qty</TableHead>
                <TableHead className="text-right font-bold">Unit Price</TableHead>
                <TableHead className="text-right font-bold text-red-600">Discount</TableHead>
                <TableHead className="text-right font-bold text-slate-900">Revenue</TableHead>
                <TableHead className="text-right font-bold">Profit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center text-muted-foreground italic gap-2">
                      <ShoppingBag className="h-8 w-8 text-slate-200" />
                      No sales found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale) => {
                  const dateObj = new Date(sale.created_at || sale.sale_date);
                  const discount = sale.discount_amount || 0;
                  const totalRevenue = (sale.quantity_sold * sale.selling_price) - discount;
                  const unitCost = sale.inventory?.purchase_price || 0;
                  const profit = totalRevenue - (unitCost * sale.quantity_sold);

                  return (
                    <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="whitespace-nowrap text-[11px] font-medium">
                        {dateObj.toLocaleDateString()}
                        <span className="text-slate-400 ml-1">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[150px]">
                          <span className="font-bold text-slate-900 text-sm">
                            {sale.inventory?.item_name || 'Deleted Item'}
                          </span>
                          {sale.notes && (
                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">"{sale.notes}"</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-slate-100 text-slate-600 border-transparent">
                          {sale.sales_channel || 'Direct'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">{sale.quantity_sold}</TableCell>
                      <TableCell className="text-right font-medium">K{sale.selling_price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {discount > 0 ? (
                          <span className="text-xs font-bold text-red-500">-K{discount.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        K{totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          className={`${
                            profit >= 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                          } text-[10px] font-bold`}
                        >
                          {profit >= 0 ? '+' : ''}K{profit.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu 
                          open={dropdownOpen === sale.id} 
                          onOpenChange={(open) => setDropdownOpen(open ? sale.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setDropdownOpen(null);
                              setTimeout(() => setEditSale(sale), 10);
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onSelect={(e) => {
                              e.preventDefault();
                              setDropdownOpen(null);
                              setTimeout(() => setDeleteSale(sale), 10);
                            }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Record
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

        {/* PAGINATION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of {totalItems} sales
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-slate-200" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <Button key={i + 1} variant={currentPage === i + 1 ? 'default' : 'ghost'} size="sm" className="w-8 h-8 p-0 text-xs" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 border-slate-200" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modals remain same... */}
        {deleteSale && (
          <DeleteConfirmDialog 
            open={!!deleteSale} 
            onOpenChange={(open) => !open && setDeleteSale(null)}
            onConfirm={confirmDelete}
            title="Delete Sale?"
            description={`This will delete the sale of ${deleteSale.quantity_sold} units and return them to your inventory.`}
          />
        )}
        {editSale && (
          <RecordSaleDialog 
            item={editSale.inventory} 
            open={!!editSale} 
            onOpenChange={(open: boolean) => !open && setEditSale(null)} 
            initialData={editSale}
            onSuccess={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}