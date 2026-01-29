// components/dashboard/expenses-table.tsx
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, Edit2, Trash2, MoreVertical, Search, 
  Filter, ChevronLeft, ChevronRight, RotateCcw, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ExpenseDialog } from './expense-dialog';
import { toast } from 'sonner';

export function ExpensesTable({ expenses, onRefresh }: { expenses: any[], onRefresh: () => void }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // 1. Filtering & Search State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 2. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get unique categories for the filter dropdown
  const uniqueCategories = Array.from(new Set(expenses.map(e => e.category)));

  // 3. Combined Filter Logic
  const filteredExpenses = expenses.filter(expense => {
    const description = expense.description?.toLowerCase() || '';
    const itemName = expense.inventory?.item_name?.toLowerCase() || '';
    const category = expense.category?.toLowerCase() || '';
    
    const matchesSearch = description.includes(search.toLowerCase()) || 
                         itemName.includes(search.toLowerCase()) ||
                         category.includes(search.toLowerCase());
                         
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // 4. Pagination Logic
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + pageSize);

  const resetPagination = () => setCurrentPage(1);

  // 5. Export Feature
  const exportToCSV = () => {
    const headers = ["Date,Time,Category,Item,Description,Amount\n"];
    const rows = filteredExpenses.map(expense => {
      const dateObj = new Date(expense.created_at);
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${expense.category}"`,
        `"${expense.inventory?.item_name || 'General'}"`,
        `"${expense.description || ''}"`,
        expense.amount
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
  }

  const confirmDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
      if (error) {
        toast.error("Failed to delete expense");
      } else {
        toast.success("Expense record removed");
        onRefresh();
      }
      setDeleteId(null);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-red-600" />
            Operating Expenses
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Log of overhead costs impacting Net Profit. Found <b>{totalItems}</b> records.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCSV} 
          className="gap-2 border-red-100 text-red-700 hover:bg-red-50"
          disabled={filteredExpenses.length === 0}
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
            placeholder="Search descriptions or items..." 
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

          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); resetPagination(); }}>
            <SelectTrigger className="w-[150px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || categoryFilter !== 'all') && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearch(''); setCategoryFilter('all'); resetPagination(); }}>
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
                <TableHead className="w-[150px] font-bold">Date & Time</TableHead>
                <TableHead className="font-bold">Expensed Item</TableHead>
                <TableHead className="font-bold">Description</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="text-right font-bold">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center text-muted-foreground italic gap-2">
                      <Receipt className="h-8 w-8 text-slate-200" />
                      No expenses found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense) => {
                  const dateObj = new Date(expense.created_at);
                  return (
                    <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                      <TableCell className="whitespace-nowrap font-medium text-[11px]">
                        {dateObj.toLocaleDateString()}
                        <span className="text-slate-400 ml-1">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {expense.inventory?.item_name || 'General Overhead'}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[200px] truncate">
                        {expense.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold uppercase text-[10px] border-red-100 text-red-600 bg-red-50/30">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-red-600">
                        K{Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={dropdownOpen === expense.id} 
                          onOpenChange={(open) => setDropdownOpen(open ? expense.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setDropdownOpen(null);
                              setTimeout(() => setEditExpense(expense), 10);
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onSelect={(e) => {
                              e.preventDefault();
                              setDropdownOpen(null);
                              setTimeout(() => setDeleteId(expense.id), 10);
                            }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</span> of {totalItems} entries
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

        {deleteId && (
          <DeleteConfirmDialog 
            open={!!deleteId} 
            onOpenChange={(open) => !open && setDeleteId(null)}
            onConfirm={confirmDelete}
            title="Delete Expense?"
          />
        )}

        {editExpense && (
          <ExpenseDialog 
            open={!!editExpense} 
            onOpenChange={(open) => !open && setEditExpense(null)} 
            initialData={editExpense}
            onSuccess={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}