// components/dashboard/record-sale-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ShoppingCart, Info, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RecordSaleProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; // Used when editing an existing sale
}

export function RecordSaleDialog({ item, open, onOpenChange, onSuccess, initialData }: RecordSaleProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  // Form State
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [channel, setChannel] = useState('Direct');
  const [notes, setNotes] = useState('');

  // Sync state when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setQuantity(initialData?.quantity_sold || 1);
      setSellingPrice(initialData?.selling_price || item.selling_price || 0);
      setDiscount(initialData?.discount_amount || 0);
      setChannel(initialData?.sales_channel || 'Direct');
      setNotes(initialData?.notes || '');
    }
  }, [open, initialData, item]);

  /**
   * Logic: When editing, the "Effective Stock" is what's in the warehouse 
   * PLUS what was already taken for this specific sale.
   */
  const availableStock = isEditing 
    ? item.quantity_remaining + initialData.quantity_sold 
    : item.quantity_remaining;

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val) || 0;
    if (num > availableStock) {
      setQuantity(availableStock);
      toast.warning(`Maximum available stock reached (${availableStock} units).`);
    } else {
      setQuantity(num);
    }
  };

  const totalRevenue = (quantity * sellingPrice) - discount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return toast.error("Quantity must be at least 1");
    if (totalRevenue < 0) return toast.error("Discount cannot be higher than total price");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      if (isEditing) {
        // --- EDIT LOGIC ---
        const quantityDiff = quantity - initialData.quantity_sold;

        // 1. Update the Sale
        const { error: saleError } = await supabase
          .from('sales')
          .update({
            quantity_sold: quantity,
            selling_price: parseFloat(sellingPrice.toString()),
            discount_amount: parseFloat(discount.toString()),
            sales_channel: channel,
            notes: notes,
          })
          .eq('id', initialData.id);

        if (saleError) throw saleError;

        // 2. Adjust Inventory (Subtraction of the difference)
        const { error: invError } = await supabase
          .from('inventory')
          .update({ quantity_remaining: item.quantity_remaining - quantityDiff })
          .eq('id', item.id);

        if (invError) throw invError;
        toast.success("Sale details updated and stock adjusted.");

      } else {
        // --- NEW SALE LOGIC ---
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

        const { error: invError } = await supabase
          .from('inventory')
          .update({ quantity_remaining: item.quantity_remaining - quantity })
          .eq('id', item.id);

        if (invError) throw invError;
        toast.success(`Successfully recorded sale for ${item.item_name}`);
      }

      onSuccess();
      onOpenChange(false);
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
            {isEditing ? 'Edit Sale Record' : `Process Sale: ${item.item_name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Stock Display Box */}
          <div className={`p-3 rounded-lg flex items-center justify-between ${availableStock < 5 ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50 border border-slate-100'}`}>
            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${availableStock < 5 ? 'text-orange-500' : 'text-slate-400'}`} />
              Available Stock
            </span>
            <span className={`text-lg font-black ${availableStock < 5 ? 'text-orange-600' : 'text-slate-900'}`}>
              {availableStock} Units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center h-5">Quantity to Sell</Label>
              <Input 
                type="number" 
                value={quantity} 
                max={availableStock} 
                min={1}
                onChange={(e) => handleQuantityChange(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center h-5">Sales Channel</Label>
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
              <Label className="flex items-center h-5">Unit Price (K)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={sellingPrice} 
                onChange={(e) => setSellingPrice(parseFloat(e.target.value))} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 h-5">
                <Tag className="h-3 w-3 text-red-500" /> Discount (K)
              </Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={discount} 
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 h-5">
              <Info className="h-3 w-3 text-slate-400" /> Sale Notes (Optional)
            </Label>
            <Textarea 
              placeholder="Customer name, payment method, or delivery details..." 
              className="resize-none h-20 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Revenue</span>
              <span className="text-xs text-slate-500 line-through">
                {discount > 0 ? `K${(quantity * sellingPrice).toLocaleString()}` : ''}
              </span>
            </div>
            <span className="text-2xl font-black text-emerald-400">
              K{totalRevenue.toLocaleString()}
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading || availableStock === 0} 
              className={`w-full h-12 text-lg font-bold shadow-md ${
                isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isEditing ? "Updating..." : "Processing..."}
                </div>
              ) : (
                isEditing ? "Update Sale Record" : "Confirm Sale"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}