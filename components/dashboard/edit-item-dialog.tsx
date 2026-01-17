// components/dashboard/edit-item-dialog.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function EditItemDialog({ item, open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item_name: item.item_name,
    description: item.description || '',
    selling_price: item.selling_price.toString(),
    purchase_price: item.purchase_price.toString(),
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('inventory')
      .update({
        item_name: form.item_name,
        description: form.description,
        selling_price: parseFloat(form.selling_price),
        purchase_price: parseFloat(form.purchase_price),
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (!error) {
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Input value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selling Price (K)</Label>
              <Input type="number" value={form.selling_price} onChange={(e) => setForm({...form, selling_price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Cost (K)</Label>
              <Input type="number" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}