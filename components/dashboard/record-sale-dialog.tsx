'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface RecordSaleDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordSaleDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: RecordSaleDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    quantity_sold: '',
    selling_price: item.selling_price.toString(),
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const quantity = Number(formData.quantity_sold);
  const sellingPrice = Number(formData.selling_price);

  const previewTotal =
    quantity > 0 ? sellingPrice * quantity : 0;

  const previewProfit =
    quantity > 0
      ? (sellingPrice - Number(item.purchase_price)) * quantity
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
      }

      if (quantity > item.quantity_remaining) {
        throw new Error(
          'Quantity sold cannot exceed quantity remaining'
        );
      }

      const { error } = await supabase.from('sales').insert([
        {
          inventory_id: item.id,
          user_id: user.id,
          quantity_sold: quantity,
          selling_price: sellingPrice,
          sale_date: formData.sale_date,
          notes: formData.notes || null,
        },
      ]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);

      setFormData({
        quantity_sold: '',
        selling_price: item.selling_price.toString(),
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      console.error('Error recording sale:', err);
      alert(err.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
          <DialogDescription>
            Record a sale for <strong>{item.item_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity_sold">Quantity Sold *</Label>
              <Input
                id="quantity_sold"
                name="quantity_sold"
                type="number"
                min={1}
                max={item.quantity_remaining}
                value={formData.quantity_sold}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Available: {item.quantity_remaining} units
              </p>
            </div>

            {/* Selling price */}
            <div className="space-y-2">
              <Label htmlFor="selling_price">
                Selling Price per Unit *
              </Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Sale date */}
            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date *</Label>
              <Input
                id="sale_date"
                name="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Optional notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Preview */}
            {quantity > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Sale:
                  </span>
                  <span className="font-medium">
                    ${previewTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimated Profit:
                  </span>
                  <span
                    className={`font-medium ${
                      previewProfit >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${previewProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording…' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
