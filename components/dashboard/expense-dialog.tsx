'use client';

import { useState, useEffect } from 'react';
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
import { 
  ReceiptText, 
  Wallet, 
  Info, 
  Tag, 
  Calendar, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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
  const isEditing = !!initialData;

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
    const amountNum = parseFloat(formData.amount);
    
    if (isNaN(amountNum) || amountNum <= 0) return toast.error("Please enter a valid amount");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // FIXED: Payload only includes columns existing in your SQL definition
      const payload: any = {
        user_id: user.id,
        category: formData.category,
        amount: amountNum,
        description: formData.description,
        expense_date: formData.date,
        inventory_id: formData.inventory_id === 'general' ? null : formData.inventory_id
      };

      const { error } = isEditing 
        ? await supabase.from('expenses').update(payload).eq('id', initialData.id)
        : await supabase.from('expenses').insert([payload]);

      if (error) throw error;

      toast.success(isEditing ? "Expense updated" : "Expense recorded");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Expense Save Error:', err);
      toast.error(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-rose-600" />
            {isEditing ? 'Update Expense' : 'Record Operating Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modify the details of this recorded expense.' 
              : 'Link this cost to a specific item or record it as general overhead.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Info Box */}
          <div className="p-3 rounded-lg flex items-center justify-between bg-slate-50 border border-slate-100">
            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Applied To
            </span>
            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
              {formData.inventory_id === 'general' 
                ? 'Business Wide' 
                : inventoryItems.find(i => i.id === formData.inventory_id)?.item_name || 'Select Item'}
            </span>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center h-5">Expense Target</Label>
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
              <Label className="flex items-center h-5 gap-2">
                <Tag className="h-3 w-3 text-emerald-500" /> Category
              </Label>
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
              <Label className="flex items-center h-5 gap-2">
                <Wallet className="h-3 w-3 text-rose-500" /> Amount (K)
              </Label>
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
            <Label className="flex items-center h-5 gap-2"> Description </Label>
            <Input 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="e.g. Courier fee for delivery" 
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center h-5 gap-2"> Date </Label>
            <Input 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
              required 
            />
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-left">Cash Outflow</span>
              <span className="text-[10px] text-slate-500 italic text-left">
                {formData.category} Expense
              </span>
            </div>
            <span className="text-2xl font-black text-rose-400">
              K{parseFloat(formData.amount || '0').toLocaleString()}
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading} 
              className={`w-full h-12 text-lg font-bold shadow-md ${
                isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isEditing ? "Updating..." : "Processing..."}
                </div>
              ) : (
                isEditing ? "Update Expense" : "Record Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}