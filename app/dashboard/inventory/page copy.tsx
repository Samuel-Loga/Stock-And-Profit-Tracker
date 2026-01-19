// app/dashboard/inventory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Filter, 
  SearchX, 
  PackageX, 
  RotateCcw 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { InventoryItemCard } from '@/components/dashboard/inventory-item-card';
import { InventoryItemRow } from '@/components/dashboard/inventory-item-row';
import { BulkCategoryModal } from '@/components/dashboard/bulk-category-modal';
import { CategoryManagerDialog } from '@/components/dashboard/category-manager-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function InventoryPage() {
  // 1. Hydration Fix
  const [mounted, setMounted] = useState(false);

  // 2. Data & UI States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // 3. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 4. Bulk Action Modal States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<{id: string, name: string} | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select(`
        *,
        batches(batch_name),
        categories(name)
      `)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  // Combined Filter Logic (Search + Status)
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when search or filters change
  const resetPagination = () => setCurrentPage(1);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map(item => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} items? This cannot be undone.`)) return;
    const { error } = await supabase.from('inventory').delete().in('id', selectedIds);
    if (!error) {
      setSelectedIds([]);
      fetchInventory();
    }
  };

  const confirmBulkCategoryUpdate = async () => {
    if (!targetCategory) return;
    setBulkLoading(true);
    
    const { error } = await supabase
      .from('inventory')
      .update({ category_id: targetCategory.id })
      .in('id', selectedIds);
    
    if (!error) {
      setBulkModalOpen(false);
      setSelectedIds([]);
      fetchInventory();
    }
    setBulkLoading(false);
  };

  return (
    <div className="space-y-6 pt-6 pt-16 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Manage <b>{totalItems}</b> items. Tracking stock levels and operational velocity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CategoryManagerDialog />
          <Link href="/dashboard/add-stock">
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" /> Add New Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              className="pl-9 border-slate-200" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); resetPagination(); }}>
              <SelectTrigger className="w-full md:w-[160px] h-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto justify-between">
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

      {/* BULK ACTION FLOATING BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-6 transition-all border border-slate-700">
          <span className="text-sm font-medium whitespace-nowrap">{selectedIds.length} items selected</span>
          
          <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white transition-colors text-xs h-8">
                    Set Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {categories.map(cat => (
                    <DropdownMenuItem key={cat.id} onClick={() => {
                      setTargetCategory({ id: cat.id, name: cat.name });
                      setBulkModalOpen(true);
                    }}>
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs h-8 gap-2" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3 w-3" /> Delete Selected
              </Button>
              
              <Button 
                size="sm" 
                variant="destructive" 
                className="text-white hover:bg-white/10 hover:text-white transition-colors text-xs h-8"
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </Button>
            
          </div>
        </div>
      )}

      {/* Modal for confirmation */}
      <BulkCategoryModal 
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        targetCategoryName={targetCategory?.name || ""}
        selectedItems={items.filter(i => selectedIds.includes(i.id))}
        onConfirm={confirmBulkCategoryUpdate}
        loading={bulkLoading}
      />

      {/* Main Content Area */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground font-medium italic">
          Syncing with warehouse...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            {search ? (
              <SearchX className="h-12 w-12 text-slate-300" />
            ) : (
              <PackageX className="h-12 w-12 text-slate-300" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {search ? 'No matches found' : `No ${statusFilter.replace('_', ' ')} items`}
          </h3>
          <p className="text-muted-foreground text-center text-sm max-w-sm mt-3">
            {search 
              ? `We couldn't find anything matching "${search}". Try adjusting your filters or search term.`
              : `There are currently no items in the database matching the "${statusFilter.replace('_', ' ')}" status.`}
          </p>
          <Button 
            variant="outline" 
            className="mt-8 gap-2 border-slate-200" 
            onClick={() => { setSearch(''); setStatusFilter('all'); resetPagination(); }}
          >
            <RotateCcw className="h-4 w-4" /> Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedItems.map(item => (
                <InventoryItemCard key={item.id} item={item} onUpdate={fetchInventory} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 w-[50px] text-center">
                      <Checkbox 
                        checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-600 w-1/4 min-w-[200px]">Product</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Category</th>
                    <th className="text-right p-4 font-semibold text-slate-600 whitespace-nowrap">Purchase Cost</th>
                    <th className="text-right p-4 font-semibold text-slate-600 whitespace-nowrap">Selling Price</th>
                    <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                    <th className="text-center p-4 font-semibold text-slate-600">Stock</th>
                    <th className="text-left p-4 font-semibold text-slate-600 whitespace-nowrap">Added On</th>
                    <th className="text-left p-4 font-semibold text-slate-600 whitespace-nowrap">Updated On</th>
                    <th className="text-right p-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map(item => (
                    <InventoryItemRow 
                      key={item.id} 
                      item={item} 
                      onUpdate={fetchInventory}
                      isSelected={selectedIds.includes(item.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <p className="text-sm text-muted-foreground font-medium">
              Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of {totalItems} entries
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 border-slate-200"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-9 h-9 ${currentPage === page ? 'bg-slate-900' : 'text-slate-600'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 border-slate-200"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}