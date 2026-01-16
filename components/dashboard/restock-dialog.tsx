// components/dashboard/restock-dialog.tsx
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
  const [supplierCost, setSupplierCost] = useState(item.purchase_price.toString());
  const [sellingPrice, setSellingPrice] = useState(item.selling_price.toString());

  useEffect(() => {
    if (open) {
      setSupplierCost(item.purchase_price.toString());
      setSellingPrice(item.selling_price.toString());
      setQuantity('');
    }
  }, [open, item]);

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
      if (isNaN(cost) || cost < 0) throw new Error('Enter a valid supplier cost');
      if (isNaN(price) || price < 0) throw new Error('Enter a valid selling price');

      // 1. Log the restock event
      const { error: restockError } = await supabase.from('restocks').insert([{
        inventory_id: item.id,
        user_id: user.id,
        quantity_added: qty,
        cost_per_unit: cost,
        selling_price: price
      }]);
      if (restockError) throw restockError;

      // 2. Update the inventory item directly
      const { error: invError } = await supabase
        .from('inventory')
        .update({
          quantity_remaining: item.quantity_remaining + qty,
          initial_quantity: item.initial_quantity + qty,
          purchase_price: cost,
          selling_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (invError) throw invError;

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restock {item.item_name}</DialogTitle>
          <DialogDescription>Update stock count and pricing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity to Add</Label>
              <Input id="qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Supplier Cost ($)</Label>
              <Input id="cost" type="number" step="0.01" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="font-semibold text-primary">New Selling Price ($)</Label>
            <Input id="price" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Current price: ${item.selling_price}</p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : 'Confirm Restock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}