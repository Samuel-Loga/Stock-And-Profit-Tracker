// app/dashboard/inventory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItemCard } from '@/components/dashboard/inventory-item-card';
import { InventoryItemRow } from '@/components/dashboard/inventory-item-row';
import Link from 'next/link';

export default function InventoryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*, batches(batch_name)')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  // Filter logic
  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when search or page size changes
  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pt-20 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm">Manage {totalItems} items in your warehouse.</p>
        </div>
        <Link href="/dashboard/add-stock">
          <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Add New Stock</Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            className="pl-9 border-slate-200" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-9 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-9 w-[1px] bg-slate-200 hidden md:block" />

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <Button 
              variant={view === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('grid')}
              className={`h-7 px-3 ${view === 'grid' ? 'shadow-sm bg-white' : ''}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className={`h-7 px-3 ${view === 'list' ? 'shadow-sm bg-white' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">Processing...</div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map(item => (
                <InventoryItemCard key={item.id} item={item} onUpdate={fetchInventory} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">Product</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Cost</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Selling Price</th>
                    <th className="text-center p-4 font-semibold text-slate-600">Stock</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Added On</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Updated On</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map(item => (
                    <InventoryItemRow key={item.id} item={item} onUpdate={fetchInventory} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to <span className="font-medium text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of {totalItems} entries
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}