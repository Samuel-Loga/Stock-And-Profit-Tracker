'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, Layers, Search, Filter, 
  ChevronLeft, ChevronRight, RotateCcw, Loader2,
  TrendingUp, History
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function StockLogsPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Search & Filter State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // 2. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data Fetching Logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch initial inventory entries (Initial Stock)
    const { data: invData } = await supabase
      .from('inventory')
      .select('*, batches(batch_name)')
      .order('created_at', { ascending: false });

    // Fetch restock entries
    const { data: restockData } = await supabase
      .from('restocks')
      .select('*, inventory(item_name), batches(batch_name)')
      .order('created_at', { ascending: false });

    setInventory(invData || []);
    setRestocks(restockData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. Combine and sort events by Date & Time
  const allStockEvents = [
    ...inventory.map(item => ({
      id: `init-${item.id}`,
      date: new Date(item.created_at),
      item_name: item.item_name,
      batch_name: item.batches?.batch_name || 'Individual Entry',
      type: 'Initial Stock',
      quantity: item.initial_quantity,
      cost: item.purchase_price,
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    })),
    ...restocks.map(restock => ({
      id: `restock-${restock.id}`,
      date: new Date(restock.date_added || restock.created_at),
      item_name: restock.inventory?.item_name || 'Unknown Item',
      batch_name: restock.batches?.batch_name || 'Restock Entry',
      type: 'Restock',
      quantity: restock.quantity_added,
      cost: restock.cost_per_unit,
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-100'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // 4. Combined Filter Logic
  const filteredEvents = allStockEvents.filter(event => {
    const matchesSearch = 
      event.item_name.toLowerCase().includes(search.toLowerCase()) ||
      event.batch_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 5. Pagination Logic
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + pageSize);

  const resetPagination = () => setCurrentPage(1);

  // 6. Export Feature
  const exportToCSV = () => {
    const headers = ["Date,Time,Batch Name,Item Details,Type,Quantity,Unit Cost,Total Investment\n"];
    const rows = filteredEvents.map(event => {
      return [
        event.date.toLocaleDateString(),
        event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${event.batch_name}"`,
        `"${event.item_name}"`,
        event.type,
        event.quantity,
        event.cost,
        event.quantity * event.cost
      ].join(",");
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && allStockEvents.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-2" /> Loading stock history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Area 
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/*<h1 className="text-3xl font-black text-slate-900 tracking-tight">Stock Logs</h1>
          <p className="text-slate-500 font-medium tracking-tight">Complete audit trail of inventory acquisition.</p>
        </div>
      </div>*/}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl"><History className="h-6 w-6 text-slate-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Stocking Events</p>
              <h3 className="text-2xl font-black text-slate-900">{totalItems}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-emerald-50 border-emerald-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Stock Value</p>
              <h3 className="text-2xl font-black text-emerald-900">
                K{filteredEvents.reduce((sum, e) => sum + (e.quantity * e.cost), 0).toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Events Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6 text-emerald-600" />
              Stock History
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed log of <b>{totalItems}</b> inventory events. A complete audit trail of inventory acquisition.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV} 
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            disabled={filteredEvents.length === 0}
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
              placeholder="Search items or batches..." 
              className="pl-9 border-slate-200"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
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

            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); resetPagination(); }}>
              <SelectTrigger className="w-[150px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                <SelectItem value="Restock">Restocks</SelectItem>
              </SelectContent>
            </Select>

            {(search || typeFilter !== 'all') && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearch(''); setTypeFilter('all'); resetPagination(); }}>
                <RotateCcw className="h-4 w-4 text-slate-400" />
              </Button>
            )}
          </div>
        </div>

        <CardContent>
          <div className="rounded-xl border bg-white overflow-hidden shadow-inner">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Date &amp; Time</TableHead>
                  <TableHead className="font-bold">Batch Name</TableHead>
                  <TableHead className="font-bold">Item Details</TableHead>
                  <TableHead className="text-center font-bold">Type</TableHead>
                  <TableHead className="text-center font-bold">Qty Added</TableHead>
                  <TableHead className="text-right font-bold">Total Investment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center text-muted-foreground italic gap-2">
                        <Layers className="h-8 w-8 text-slate-200" />
                        No stock events found.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="whitespace-nowrap font-medium">
                        {event.date.toLocaleDateString()}
                        <span className="text-slate-400 ml-1">
                          {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 text-sm">
                        {event.batch_name}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {event.item_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${event.badgeStyle} border text-[10px] uppercase font-bold px-2 py-0.5`}>
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        +{event.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-700">
                        K{(event.quantity * event.cost).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
            <p className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of {totalItems} entries
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 border-slate-200"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'ghost'}
                    size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 border-slate-200"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}