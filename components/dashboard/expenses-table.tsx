// components/dashboard/expenses-table.tsx
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ExpenseDialog } from './expense-dialog';

export function ExpensesTable({ expenses, onRefresh }: { expenses: any[], onRefresh: () => void }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<any | null>(null);

  // A state to force close the dropdown
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
      if (!error) onRefresh();
      setDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-red-600" />
          Operating Expenses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Log of non-inventory or overhead costs like shipping, packaging, and marketing impacting Net Profit.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Expensed Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const dateObj = new Date(expense.created_at);
               
                return (
                  <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      {dateObj.toLocaleDateString()}
                      <span className="text-muted-foreground ml-1">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold uppercase text-[10px] border-red-200 text-red-700">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {expense.inventory?.item_name || 'General Overhead'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {expense.description || '—'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      K{Number(expense.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu
                        open={dropdownOpen === expense.id} 
                        onOpenChange={(open) => setDropdownOpen(open ? expense.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault(); // Prevents focus trap issues
                              setDropdownOpen(null); // Close dropdown first
                              setTimeout(() => setEditExpense(expense), 10); // Open modal next tick
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" 
                            onSelect={(e) => {
                              e.preventDefault();
                              setDropdownOpen(null);
                              setTimeout(() => setDeleteId(expense.id), 10);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Use a conditional check to ensure the component is unmounted when not in use */}
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