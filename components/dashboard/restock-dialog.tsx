// components/dashboard/restock-dialog.tsx
'use client';

import { useState } from 'react';
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

export function RestockDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: RestockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState('');
  const [newCost, setNewCost] = useState(item.purchase_price.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const quantity = parseInt(quantityToAdd);
      const cost = parseFloat(newCost);

      if (isNaN(quantity) || quantity <= 0) throw new Error('Enter valid quantity');
      if (isNaN(cost) || cost < 0) throw new Error('Enter valid cost');

      // 1. Record the restock event history
      const { error: restockError } = await supabase.from('restocks').insert([
        {
          inventory_id: item.id,
          user_id: user.id,
          quantity_added: quantity,
          cost_per_unit: cost,
        },
      ]);
      if (restockError) throw restockError;

      // 2. Update the inventory item itself
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity_remaining: item.quantity_remaining + quantity,
          initial_quantity: item.initial_quantity + quantity,
          purchase_price: cost, // Update to newest supplier cost
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      onSuccess();
      onOpenChange(false);
      setQuantityToAdd('');
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
          <DialogDescription>
            Add stock and update supplier cost.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quantity to Add</Label>
            <Input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>New Supplier Cost ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Previous cost: ${item.purchase_price}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}