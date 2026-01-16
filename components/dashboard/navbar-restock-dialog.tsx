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
import { Database } from '@/types/database';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export function NavbarRestockDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  
  const selectedItem = items.find((i) => i.id === selectedItemId);

  useEffect(() => {
    if (open) {
      const fetchItems = async () => {
        const { data } = await supabase.from('inventory').select('*').eq('status', 'active');
        if (data) setItems(data);
      };
      fetchItems();
    }
  }, [open]);

  useEffect(() => {
    if (selectedItem) {
      setSupplierCost(selectedItem.purchase_price.toString());
      setSellingPrice(selectedItem.selling_price.toString());
      setQuantity('');
    }
  }, [selectedItem]);

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
      await supabase.from('restocks').insert([{
        inventory_id: selectedItem.id,
        user_id: user.id,
        quantity_added: qty,
        cost_per_unit: cost,
        selling_price: price
      }]);

      // 2. Update inventory
      await supabase.from('inventory').update({
        quantity_remaining: selectedItem.quantity_remaining + qty,
        initial_quantity: selectedItem.initial_quantity + qty,
        purchase_price: cost,
        selling_price: price,
        updated_at: new Date().toISOString()
      }).eq('id', selectedItem.id);

      onOpenChange(false);
      window.location.reload(); 
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
          <DialogTitle>Global Restock</DialogTitle>
          <DialogDescription>Search for an item and enter new details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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

          {selectedItem && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-md border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Cost ($)</Label>
                  <Input type="number" step="0.01" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">New Selling Price ($)</Label>
                <Input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={!selectedItemId || loading}>
              Confirm Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}