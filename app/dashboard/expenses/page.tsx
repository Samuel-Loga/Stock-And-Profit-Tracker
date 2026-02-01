'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, Receipt, Search, Filter, ChevronLeft, ChevronRight, RotateCcw, Loader2, CreditCard
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Data Fetching
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*, inventory_items(item_name)')
      .order('expense_date', { ascending: false });
    
    if (data) setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 2. Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.description?.toLowerCase().includes(search.toLowerCase()) || exp.expense_on?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  // 3. Summaries & Pagination
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + pageSize);

  const resetPagination = () => setCurrentPage(1);

  // 4. Export CSV Logic
  const exportToCSV = () => {
    const headers = ["Date,Time,Expense On,Description,Category,Amount\n"];
    const rows = filteredExpenses.map(exp => {
      const dateObj = new Date(exp.expense_date);
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${exp.inventory?.item_name || 'General Overhead'}"`,
        `"${exp.description || 'N/A'}"`,
        `"${exp.category || 'General'}"`,
        exp.amount
      ].join(",");
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-2" /> Loading expense records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm bg-rose-50 border-rose-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-xl"><Receipt className="h-6 w-6 text-rose-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500">Total Expenses</p>
              <h3 className="text-2xl font-bold text-rose-700">K{totalAmount.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN DATA CARD */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-rose-600" />
              Operating Expenses
            </CardTitle>
            <p className="text-sm font-bold text-slate-500">
              Log of overhead costs impacting Net Profit. Found <span className="text-slate-950">{totalItems}</span> total entries.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV} 
            className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold h-10 px-4 rounded-xl"
            disabled={filteredExpenses.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>

        {/* TOOLBAR */}
        <div className="px-6 pb-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search descriptions..." 
              className="pl-9 h-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); resetPagination(); }}>
                <SelectTrigger className="h-10 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); resetPagination(); }}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Logistics">Logistics</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>

            {(search || categoryFilter !== 'all') && (
              <Button variant="ghost" size="icon" className="h-10 w-9" onClick={() => { setSearch(''); setCategoryFilter('all'); resetPagination(); }}>
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
                  <TableHead className="font-bold">Expense On</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="text-center font-bold">Category</TableHead>
                  <TableHead className="text-right px-6 font-bold">Amount Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center italic text-slate-400 font-medium">
                      <div className="flex flex-col items-center text-muted-foreground italic gap-2">
                        <CreditCard className="h-8 w-8 text-slate-200" />
                        No expenses found matching your criteria.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const dateObj = new Date(exp.expense_date);

                    return (
                      <TableRow key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="whitespace-nowrap font-medium">
                          {dateObj.toLocaleDateString()}
                          <span className="text-slate-400 ml-1">
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                        {/* Expense On: Derived from the joined inventory table */}
                        <TableCell className="font-bold text-slate-700 text-sm">
                          {exp.inventory?.item_name || 'General Overhead'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-500 text-sm">
                          {exp.description}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-transparent font-bold text-[10px] uppercase">
                            {exp.category || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 font-black text-slate-900 text-red-600">
                          -K{Number(exp.amount).toLocaleString()}
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
              Showing <span className="text-slate-900">{currentPage}</span> to {totalPages || 1} of {totalItems} total logs
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 p-0 border-slate-200"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center">
                      {i > 0 && arr[i-1] !== p - 1 && <span className="px-1 text-slate-400">...</span>}
                      <Button
                        variant={currentPage === p ? 'default' : 'ghost'}
                        size="sm"
                        className="w-8 h-8 p-0 text-xs" 
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  ))
                }
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