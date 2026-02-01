'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Database } from '@/types/database';
import { AlertCircle, RefreshCcw, PackagePlus, Wallet, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface RestockDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RestockDialog({ item, open, onOpenChange, onSuccess }: RestockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Synchronize internal state with item data when opened
  useEffect(() => {
    if (open) {
      setSupplierCost(item.purchase_price.toString());
      setSellingPrice(item.selling_price.toString());
      setQuantity('');
    }
  }, [open, item]);

  // Derived calculations for the summary box
  const qtyNum = parseInt(quantity) || 0;
  const costNum = parseFloat(supplierCost) || 0;
  const totalInvestment = qtyNum * costNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const qty = parseInt(quantity);
      const cost = parseFloat(supplierCost);
      const price = parseFloat(sellingPrice);

      if (isNaN(qty) || qty <= 0) throw new Error('Enter a valid quantity');

      const newQtyTotal = item.quantity_remaining + qty;
      const totalInitial = item.initial_quantity + qty;

      /** * FIXED: ENUM MAPPING 
       * Calculating the status locally to ensure we send the exact string 
       * the database inventory_status enum expects.
       */
      let newStatus: 'available' | 'low_stock' | 'completed' = 'available';
      const percentage = (newQtyTotal / totalInitial) * 100;

      if (newQtyTotal <= 0) {
        newStatus = 'completed';
      } else if (percentage < 25) {
        newStatus = 'low_stock';
      } else {
        newStatus = 'available';
      }

      // 1. Record the restock in history
      const { error: restockError } = await supabase.from('restocks').insert([{
        inventory_id: item.id,
        user_id: user.id,
        quantity_added: qty,
        cost_per_unit: cost,
        selling_price: price
      }]);
      if (restockError) throw restockError;

      // 2. Update Master Inventory
      // The 'status' string below must be lowercase to satisfy the Postgres Enum
      const { error: invError } = await supabase
        .from('inventory')
        .update({
          quantity_remaining: newQtyTotal,
          status: newStatus, 
          initial_quantity: totalInitial,
          purchase_price: cost,
          selling_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (invError) throw invError;

      toast.success(`Successfully restocked ${qty} units of ${item.item_name}`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-blue-600" />
            Restock: {item.item_name}
          </DialogTitle>
          <DialogDescription>Update stock count and acquisition costs.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Status Header Box */}
          <div className="p-3 rounded-lg flex items-center justify-between bg-slate-50 border border-slate-100">
            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400" />
              Current Available Stock
            </span>
            <span className="text-lg font-black text-slate-900">
              {item.quantity_remaining} Units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center h-5 gap-2">
                <PackagePlus className="h-3.5 w-3.5 text-blue-500" /> Quantity to Add
              </Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="0"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center h-5 gap-2">
                <Wallet className="h-3.5 w-3.5 text-slate-500" /> Supplier Cost (K)
              </Label>
              <Input 
                type="number" 
                step="0.01" 
                value={supplierCost} 
                onChange={(e) => setSupplierCost(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center h-5 gap-2">
              <Tag className="h-3.5 w-3.5 text-emerald-500" /> New Selling Price (K)
            </Label>
            <Input 
              type="number" 
              step="0.01" 
              value={sellingPrice} 
              onChange={(e) => setSellingPrice(e.target.value)} 
              required 
            />
            <p className="text-[11px] font-bold text-slate-500">
              Current retail price: K{item.selling_price.toLocaleString()}
            </p>
          </div>

          {/* Investment Summary Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Investment</span>
              <span className="text-[10px] text-slate-500 italic">
                {qtyNum > 0 ? `${qtyNum} units @ K${costNum}` : 'Enter quantity and cost'}
              </span>
            </div>
            <span className="text-2xl font-black text-blue-400">
              K{totalInvestment.toLocaleString()}
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 text-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Confirm Restock"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}