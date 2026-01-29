// components/dashboard/expense-dialog.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

const DEFAULT_FORM_STATE = {
  category: 'Packaging',
  amount: '',
  description: '',
  inventory_id: 'general',
  date: new Date().toISOString().split('T')[0]
};

export function ExpenseDialog({ open, onOpenChange, onSuccess, initialData }: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  // Reset form when modal closes or opens for a new entry
  useEffect(() => {
    if (!open) {
      setFormData(DEFAULT_FORM_STATE);
    } else if (initialData) {
      setFormData({
        category: initialData.category,
        amount: initialData.amount.toString(),
        description: initialData.description || '',
        inventory_id: initialData.inventory_id || 'general',
        date: initialData.expense_date
      });
    }
  }, [open, initialData]);

  // Fetch items for the dropdown
  useEffect(() => {
    if (open) {
      const fetchItems = async () => {
        const { data } = await supabase
          .from('inventory')
          .select('id, item_name')
          .neq('status', 'completed')
          .order('item_name', { ascending: true });
        if (data) setInventoryItems(data);
      };
      fetchItems();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expense_date: formData.date,
        inventory_id: formData.inventory_id === 'general' ? null : formData.inventory_id
      };

      let error;
      if (initialData?.id) {
        // UPDATE MODE
        const { error: updateError } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        // INSERT MODE
        const { error: insertError } = await supabase
          .from('expenses')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Expense Save Error:', err);
      alert(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Update Expense' : 'Record Operating Expense'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modify the details of this recorded expense.' 
              : 'Link this cost to a specific item or record it as general overhead.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          <div className="space-y-2">
            <Label>Apply Expense To</Label>
            <Select 
              value={formData.inventory_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, inventory_id: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Overhead (Business Wide)</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Packaging">Packaging</SelectItem>
                  <SelectItem value="Shipping">Shipping</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Repair">Repair/Maint.</SelectItem>
                  <SelectItem value="Subscription">Subscription</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (K)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={formData.amount} 
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} 
                placeholder="0.00"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="e.g. Courier fee for Lilongwe delivery" 
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
              required 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : initialData ? 'Update Entry' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}