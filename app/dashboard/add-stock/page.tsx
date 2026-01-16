// app/dashboard/add-stock/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchSummaryCard } from '@/components/dashboard/batch-summary-card';
import { Plus, Trash2, Package, Layers, Upload, X } from 'lucide-react';

export default function AddStockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchName, setBatchName] = useState('');
  
  // State for Batch Mode
  const [batchItems, setBatchItems] = useState([{
    tempId: Math.random(),
    item_name: '',
    description: '',
    image_url: null as string | null,
    purchase_price: '',
    selling_price: '',
    initial_quantity: '',
  }]);

  // State for Single Mode
  const [singleItem, setSingleItem] = useState({
    item_name: '',
    description: '',
    image_url: null as string | null,
    purchase_price: '',
    selling_price: '',
    initial_quantity: '',
  });

  const handleImageChange = (tempId: number | 'single', file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (tempId === 'single') {
        setSingleItem({ ...singleItem, image_url: result });
      } else {
        setBatchItems(batchItems.map(i => i.tempId === tempId ? { ...i, image_url: result } : i));
      }
    };
    reader.readAsDataURL(file);
  };

  const addItemToBatch = () => {
    setBatchItems([...batchItems, { 
      tempId: Math.random(), 
      item_name: '', 
      description: '', 
      image_url: null, 
      purchase_price: '', 
      selling_price: '', 
      initial_quantity: '' 
    }]);
  };

  const handleProcessStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const processingItems = mode === 'single' ? [singleItem] : batchItems;

      const totalInvestment = processingItems.reduce((sum, i) => sum + (parseFloat(i.purchase_price || '0') * parseInt(i.initial_quantity || '0')), 0);
      const totalRev = processingItems.reduce((sum, i) => sum + (parseFloat(i.selling_price || '0') * parseInt(i.initial_quantity || '0')), 0);

      // 1. Create Batch Record
      const { data: batch, error: batchErr } = await supabase
        .from('batches')
        .insert([{
          user_id: user.id,
          batch_name: batchName || (mode === 'single' ? `Single: ${singleItem.item_name}` : `Batch - ${new Date().toLocaleDateString()}`),
          total_investment: totalInvestment,
          expected_revenue: totalRev,
          expected_profit: totalRev - totalInvestment
        }])
        .select().single();

      if (batchErr) throw batchErr;

      // 2. Insert Inventory Items
      const inventoryData = processingItems.map(i => ({
        user_id: user.id,
        batch_id: batch.id,
        item_name: i.item_name,
        description: i.description,
        image_url: i.image_url,
        purchase_price: parseFloat(i.purchase_price),
        selling_price: parseFloat(i.selling_price),
        initial_quantity: parseInt(i.initial_quantity),
        quantity_remaining: parseInt(i.initial_quantity),
        status: 'available'
      }));

      const { error: invErr } = await supabase.from('inventory').insert(inventoryData);
      if (invErr) throw invErr;

      router.push('/dashboard/inventory');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Add Stock</h1>
        <p className="text-muted-foreground mt-1 text-sm">Upload photos and manage batch shipments effortlessly.</p>
      </div>

      <Tabs defaultValue="single" onValueChange={(v) => setMode(v as 'single' | 'batch')} className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="single" className="gap-2"><Package className="h-4 w-4" /> Single Item</TabsTrigger>
          <TabsTrigger value="batch" className="gap-2"><Layers className="h-4 w-4" /> Batch / Bulk</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form id="stock-form" onSubmit={handleProcessStock}>
              <TabsContent value="single" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle>Item Details</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <ImageUpload 
                      imagePreview={singleItem.image_url} 
                      onImageChange={(file) => handleImageChange('single', file)} 
                      onRemove={() => setSingleItem({...singleItem, image_url: null})} 
                    />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input value={singleItem.item_name} onChange={(e) => setSingleItem({...singleItem, item_name: e.target.value})} placeholder="e.g. iPhone 15" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Textarea value={singleItem.description} onChange={(e) => setSingleItem({...singleItem, description: e.target.value})} placeholder="Brief details about the condition or model..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Supplier Cost (K)</Label>
                          <Input type="number" step="0.01" value={singleItem.purchase_price} onChange={(e) => setSingleItem({...singleItem, purchase_price: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input type="number" value={singleItem.initial_quantity} onChange={(e) => setSingleItem({...singleItem, initial_quantity: e.target.value})} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-blue-600 font-bold">Selling Price (K)</Label>
                        <Input type="number" step="0.01" value={singleItem.selling_price} onChange={(e) => setSingleItem({...singleItem, selling_price: e.target.value})} className="border-blue-200" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="batch" className="mt-0 space-y-4">
                <Card>
                  <div className="p-6 border-b">
                    <Label>Batch Name / Reference</Label>
                    <Input placeholder="e.g. Supplier Delivery - Jan 15" value={batchName} onChange={(e) => setBatchName(e.target.value)} className="mt-2" />
                  </div>
                  <CardContent className="space-y-8 pt-6">
                    {batchItems.map((item, index) => (
                      <div key={item.tempId} className="p-6 border rounded-xl bg-slate-50/50 relative group space-y-6">
                        <Button variant="ghost" size="icon" onClick={() => setBatchItems(batchItems.filter(i => i.tempId !== item.tempId))} className="absolute right-2 top-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-6">
                          <ImageUpload 
                            compact 
                            imagePreview={item.image_url} 
                            onImageChange={(file) => handleImageChange(item.tempId, file)} 
                            onRemove={() => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, image_url: null} : i))} 
                          />
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label>Item #{index + 1} Name</Label>
                              <Input value={item.item_name} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, item_name: e.target.value} : i))} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input className="h-9 text-sm" value={item.description} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, description: e.target.value} : i))} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div><Label className="text-xs">Supplier Cost (K)</Label><Input type="number" step="0.01" value={item.purchase_price} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, purchase_price: e.target.value} : i))} required /></div>
                              <div><Label className="text-xs">Quantity</Label><Input type="number" value={item.initial_quantity} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, initial_quantity: e.target.value} : i))} required /></div>
                              <div><Label className="text-xs font-bold text-blue-600">Selling Price (K)</Label><Input type="number" step="0.01" value={item.selling_price} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, selling_price: e.target.value} : i))} className="border-blue-200" required /></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addItemToBatch} className="w-full border-dashed py-8 gap-2">
                      <Plus className="h-4 w-4" /> Add Item to Batch
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </div>

          <div className="space-y-6">
            <div className="sticky top-8">
              <BatchSummaryCard items={(mode === 'single' ? [singleItem] : batchItems).map(i => ({
                purchase_price: parseFloat(i.purchase_price) || 0,
                selling_price: parseFloat(i.selling_price) || 0,
                quantity: parseInt(i.initial_quantity) || 0
              }))} />
              <Button type="submit" form="stock-form" disabled={loading} className="w-full h-12 text-lg shadow-lg mt-6">
                {loading ? 'Processing...' : 'Confirm and Stock'}
              </Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

function ImageUpload({ imagePreview, onImageChange, onRemove, compact = false }: { imagePreview: string | null, onImageChange: (f: File | undefined) => void, onRemove: () => void, compact?: boolean }) {
  const sizeClass = compact ? "h-24 w-24" : "h-32 w-32";
  return (
    <div className="space-y-2">
      <Label className={compact ? "text-xs" : ""}>Item Image</Label>
      <div className="flex items-start gap-4">
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className={`${sizeClass} rounded-lg object-cover border`} />
            <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <label className={`${sizeClass} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors`}>
            <Upload className={`${compact ? 'h-4 w-4' : 'h-8 w-8'} text-muted-foreground`} />
            {!compact && <span className="text-xs text-muted-foreground mt-2">Upload Photo</span>}
            <input type="file" accept="image/*" onChange={(e) => onImageChange(e.target.files?.[0])} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}