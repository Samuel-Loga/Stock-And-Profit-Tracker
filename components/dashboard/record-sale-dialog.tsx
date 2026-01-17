'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface RecordSaleDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordSaleDialog({ item, open, onOpenChange, onSuccess, initialData }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity_sold: '',
    selling_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    sales_channel: 'Direct',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          quantity_sold: initialData.quantity_sold.toString(),
          selling_price: initialData.selling_price.toString(),
          sale_date: initialData.sale_date,
          sales_channel: initialData.sales_channel,
          notes: initialData.notes || '',
        });
      } else {
        setFormData(prev => ({ ...prev, selling_price: item.selling_price.toString() }));
      }
    }
  }, [open, initialData, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        selling_price: parseFloat(formData.selling_price),
        sales_channel: formData.sales_channel,
        notes: formData.notes,
        sale_date: formData.sale_date,
      };

      if (initialData) {
        // UPDATE MODE (Note: Quantity editing is disabled to protect inventory logic)
        await supabase.from('sales').update(payload).eq('id', initialData.id);
      } else {
        // INSERT MODE
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('sales').insert([{
          ...payload,
          user_id: user?.id,
          inventory_id: item.id,
          quantity_sold: parseInt(formData.quantity_sold),
        }]);
        
        // Update inventory count (via existing logic)
        await supabase.from('inventory')
          .update({ quantity_remaining: item.quantity_remaining - parseInt(formData.quantity_sold) })
          .eq('id', item.id);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      alert("Error saving sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Sale Record' : `Record Sale: ${item.item_name}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity Sold</Label>
              <Input 
                type="number" 
                value={formData.quantity_sold} 
                onChange={(e) => setFormData({...formData, quantity_sold: e.target.value})}
                disabled={!!initialData} // Quantity locked on edit for safety
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Price (K)</Label>
              <Input 
                type="number" 
                value={formData.selling_price} 
                onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                required 
              />
            </div>
          </div>
          {/* ... Rest of fields (Channel, Date, Notes) ... */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Record' : 'Complete Sale'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
