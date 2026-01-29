// components/dashboard/navbar-restock-dialog.tsx
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItem?: any;
  onSuccess?: () => void;
}

export function NavbarRestockDialog({ 
  open, 
  onOpenChange, 
  existingItem, 
  onSuccess 
}: RestockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (open) {
      const fetchItems = async () => {
        const { data } = await supabase.from('inventory').select('*').neq('status', 'completed');
        if (data) setItems(data);
      };
      fetchItems();
    }
  }, [open]);

  // Handle passed item (from Inventory list)
  useEffect(() => {
    if (existingItem && open) {
      setSelectedItem(existingItem);
      setSelectedItemId(existingItem.id);
    }
  }, [existingItem, open]);

  // Sync state when an item is selected via Combobox
  useEffect(() => {
    const item = items.find((i) => i.id === selectedItemId);
    if (item) {
      setSelectedItem(item);
      setSupplierCost(item.purchase_price.toString());
      setSellingPrice(item.selling_price.toString());
      setQuantity('');
    }
  }, [selectedItemId, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const qty = parseInt(quantity);
      const cost = parseFloat(supplierCost);
      const price = parseFloat(sellingPrice);

      // 1. Record restock
      const { error: restockErr } = await supabase.from('restocks').insert([{
        inventory_id: selectedItem.id,
        user_id: user.id,
        quantity_added: qty,
        cost_per_unit: cost,
        selling_price: price
      }]);
      if (restockErr) throw restockErr;

      // 2. Update inventory
      const { error: invErr } = await supabase.from('inventory').update({
        quantity_remaining: selectedItem.quantity_remaining + qty,
        initial_quantity: selectedItem.initial_quantity + qty,
        purchase_price: cost,
        selling_price: price,
        updated_at: new Date().toISOString()
      }).eq('id', selectedItem.id);
      if (invErr) throw invErr;

      onSuccess?.();
      onOpenChange(false);
      // Removed window.location.reload() to allow the state to refresh naturally via onSuccess
    } catch (err: any) {
      alert(err.message || 'Error restocking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{existingItem ? `Restock: ${existingItem.item_name}` : 'Global Restock'}</DialogTitle>
          <DialogDescription>Enter new stock quantities and update pricing if necessary.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!existingItem && (
            <div className="space-y-2 flex flex-col">
              <Label>Item Search</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedItemId ? selectedItem?.item_name : "Select an item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search inventory..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {items.map((item) => (
                          <CommandItem key={item.id} onSelect={() => { setSelectedItemId(item.id); setComboboxOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedItemId === item.id ? "opacity-100" : "opacity-0")} />
                            {item.item_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {selectedItem && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-md border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity Added</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Cost (K)</Label>
                  <Input type="number" step="0.01" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-blue-600">New Selling Price (K)</Label>
                <Input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="border-blue-200" required />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={!selectedItemId || loading}>
              {loading ? 'Processing...' : 'Confirm Restock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}