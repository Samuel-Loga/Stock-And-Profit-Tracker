// components/dashboard/record-sale-dialog.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ShoppingCart, Info } from 'lucide-react';
import { toast } from 'sonner';

export function RecordSaleDialog({ item, open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(item.selling_price);
  const [discount, setDiscount] = useState(0);
  const [channel, setChannel] = useState('Direct');
  const [notes, setNotes] = useState('');

  // Enforce stock limits on input change
  const handleQuantityChange = (val: string) => {
    const num = parseInt(val) || 0;
    if (num > item.quantity_remaining) {
      setQuantity(item.quantity_remaining);
      toast.warning(`Only ${item.quantity_remaining} units available.`);
    } else {
      setQuantity(num);
    }
  };

  const finalTotal = (quantity * sellingPrice) - discount;

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return toast.error("Quantity must be at least 1");
    if (finalTotal < 0) return toast.error("Discount cannot exceed total price");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 1. Record the sale with all fields
      const { error: saleError } = await supabase.from('sales').insert([{
        user_id: user.id,
        inventory_id: item.id,
        quantity_sold: quantity,
        selling_price: parseFloat(sellingPrice.toString()),
        discount_amount: parseFloat(discount.toString()),
        sales_channel: channel,
        notes: notes,
        sale_date: new Date().toISOString()
      }]);

      if (saleError) throw saleError;

      // 2. Update inventory quantity (Status handled by DB Trigger)
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity_remaining: item.quantity_remaining - quantity })
        .eq('id', item.id);

      if (updateError) throw updateError;

      toast.success(`Successfully recorded sale for ${item.item_name}`);
      onSuccess();
      onOpenChange(false);
      
      // Reset local state for next use
      setQuantity(1);
      setDiscount(0);
      setNotes('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Process Sale: {item.item_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSale} className="space-y-4 pt-2">
          {/* Stock Guard Rail */}
          <div className={`p-3 rounded-lg flex items-center justify-between ${item.quantity_remaining < 5 ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50 border border-slate-100'}`}>
            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Available Stock
            </span>
            <span className="text-lg font-black text-slate-900">{item.quantity_remaining} Units</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity Sold</Label>
              <Input 
                type="number" 
                value={quantity} 
                max={item.quantity_remaining} 
                min={1}
                onChange={(e) => handleQuantityChange(e.target.value)} 
                required 
              />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                Total Sale: K{(quantity * sellingPrice).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Sales Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct Sale</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Price (K)</Label>
              <Input 
                type="number" 
                value={sellingPrice} 
                onChange={(e) => setSellingPrice(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Discount (K)</Label>
              <Input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Number(e.target.value))} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Info className="h-3 w-3" /> Sale Notes (Optional)
            </Label>
            <Textarea 
              placeholder="e.g. Sold to John Doe, customer paid via Airtel Money..." 
              className="resize-none h-20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
            <span className="text-xs uppercase font-bold text-slate-400">Total Revenue</span>
            <span className="text-2xl font-black text-emerald-400">K{finalTotal.toLocaleString()}</span>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading || item.quantity_remaining === 0} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
            >
              {loading ? "Recording..." : "Confirm & Record Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}