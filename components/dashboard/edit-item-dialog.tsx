// components/dashboard/edit-item-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EditItemDialog({ item, open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Local form state initialized with item data
  const [formData, setFormData] = useState({
    item_name: item.item_name,
    purchase_price: item.purchase_price,
    selling_price: item.selling_price,
    initial_quantity: item.initial_quantity,
    quantity_remaining: item.quantity_remaining,
    category_id: item.category_id || '',
  });

  // Fetch categories only when modal opens
  useEffect(() => {
    if (open) {
      const fetchCats = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) setCategories(data);
      };
      fetchCats();
      // Reset form data to current item values whenever modal opens
      setFormData({
        item_name: item.item_name,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        initial_quantity: item.initial_quantity,
        quantity_remaining: item.quantity_remaining,
        category_id: item.category_id || '',
      });
    }
  }, [open, item]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('inventory')
      .update({
        item_name: formData.item_name,
        purchase_price: parseFloat(formData.purchase_price.toString()),
        selling_price: parseFloat(formData.selling_price.toString()),
        initial_quantity: parseInt(formData.initial_quantity.toString()),
        quantity_remaining: parseInt(formData.quantity_remaining.toString()),
        category_id: formData.category_id === '' ? null : formData.category_id,
        price_updated_at: new Date().toISOString(), // Track when price changed
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (error) {
      alert(error.message);
    } else {
      onSuccess(); // Triggers fetchInventory in parent
      onOpenChange(false); // Closes modal
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input 
              value={formData.item_name} 
              onChange={(e) => setFormData({...formData, item_name: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(val) => setFormData({...formData, category_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cost Price (K)</Label>
              <Input 
                type="number" 
                value={formData.purchase_price} 
                onChange={(e) => setFormData({...formData, purchase_price: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (K)</Label>
              <Input 
                type="number" 
                value={formData.selling_price} 
                onChange={(e) => setFormData({...formData, selling_price: e.target.value})} 
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving Changes...' : 'Save Product Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}