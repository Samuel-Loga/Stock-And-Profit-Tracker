// components/dashboard/sales-history.tsx
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ShoppingBag, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { RecordSaleDialog } from './record-sale-dialog';

export function SalesHistory({ sales, onRefresh }: { sales: any[], onRefresh: () => void }) {
  const [deleteSale, setDeleteSale] = useState<any | null>(null);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  /**
   * Generates and downloads a CSV report of the sales history.
   */
  const exportToCSV = () => {
    const headers = ["Date,Item,Channel,Quantity,Unit Price,Total Revenue,Profit\n"];
    const rows = sales.map(sale => {
      const dateObj = new Date(sale.sale_date);
      const totalRevenue = sale.quantity_sold * sale.selling_price;
      const unitCost = sale.inventory?.purchase_price || 0;
      const totalProfit = (sale.selling_price - unitCost) * sale.quantity_sold;
      
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${sale.inventory?.item_name || 'Unknown'}"`,
        `"${sale.sales_channel || 'Direct'}"`,
        sale.quantity_sold,
        sale.selling_price,
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
      // 1. Return stock to inventory using RPC
      const { error: invError } = await supabase.rpc('return_stock_on_sale_deletion', {
        target_inventory_id: deleteSale.inventory_id,
        qty_to_return: deleteSale.quantity_sold
      });

      if (invError) return alert("Failed to return stock");

      // 2. Delete sale record
      await supabase.from('sales').delete().eq('id', deleteSale.id);
      
      onRefresh();
      setDeleteSale(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            Sales History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A detailed log of all completed transactions and their performance.
          </p>
        </div>
        {/* ... Export Button ... */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCSV} 
          className="gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          disabled={sales.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px]">Date &amp; Time</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Supplier Cost</TableHead>
                <TableHead className="text-center">Selling Price</TableHead>
                <TableHead className="text-center">Total Revenue</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No sales recorded yet. Start selling to see your history here!
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => {
                const dateObj = new Date(sale.created_at || sale.sale_date);
                const revenue = sale.quantity_sold * sale.selling_price;
                const profit = (sale.selling_price - (sale.inventory?.purchase_price || 0)) * sale.quantity_sold;

                return (
                  <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      {dateObj.toLocaleDateString()}
                      <span className="text-muted-foreground ml-1">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="font-semibold text-slate-900">
                            {sale.inventory?.item_name || 'Deleted Item'}
                          </span>
                          {sale.notes && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1 italic">
                              "{sale.notes}"
                            </span>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-slate-100">
                        {sale.sales_channel || 'Direct'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{sale.quantity_sold}</TableCell>
                    <TableCell className="text-center font-medium">
                        {sale.inventory?.purchase_price || 'N/A. Check inventory.'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                        {sale.selling_price}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700">
                        K{revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        className={`${
                          profit >= 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                        } border-transparent text-[11px] font-bold`}
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
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                            setDropdownOpen(null);
                            setTimeout(() => setEditSale(sale), 10);
                          }}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Sale
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={(e) => {
                            e.preventDefault();
                            setDropdownOpen(null);
                            setTimeout(() => setDeleteSale(sale), 10);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Sale
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

        {/* Delete Confirmation Modal */}
        {deleteSale && (
          <DeleteConfirmDialog 
            open={!!deleteSale} 
            onOpenChange={(open) => !open && setDeleteSale(null)}
            onConfirm={confirmDelete}
            title="Delete Sale?"
            description={`This will delete the sale of ${deleteSale.quantity_sold} units and return them to your inventory.`}
          />
        )}

        {/* Edit Modal (Updates existing RecordSaleDialog) */}
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