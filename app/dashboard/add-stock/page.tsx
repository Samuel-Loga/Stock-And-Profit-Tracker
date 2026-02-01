'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchSummaryCard } from '@/components/dashboard/batch-summary-card';
import { Plus, Trash2, Package, Layers, Upload, X, Tag, Info, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AddStockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchName, setBatchName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) {
        setCategories(data);
        if (data.length > 0) setSelectedCategoryId(data[0].id);
      }
    };
    fetchCats();
  }, []);

  // --- VALIDATION HELPERS ---
  const preventNegative = (e: React.KeyboardEvent) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  const validateValue = (val: string) => {
    if (val === "") return ""; // Allow clearing the field
    const num = parseFloat(val);
    return num >= 1 ? val : "1"; // Force minimum of 1
  };

  // --- STATE MANAGEMENT ---
  const [batchItems, setBatchItems] = useState([{
    tempId: Math.random(),
    item_name: '',
    description: '',
    image_url: null as string | null,
    purchase_price: '',
    selling_price: '',
    initial_quantity: '',
  }]);

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
    if (file.size > 5 * 1024 * 1024) return alert('Image size should be less than 5MB');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (tempId === 'single') setSingleItem({ ...singleItem, image_url: result });
      else setBatchItems(batchItems.map(i => i.tempId === tempId ? { ...i, image_url: result } : i));
    };
    reader.readAsDataURL(file);
  };

  const addItemToBatch = () => {
    setBatchItems([...batchItems, { 
      tempId: Math.random(), item_name: '', description: '', image_url: null, 
      purchase_price: '', selling_price: '', initial_quantity: '' 
    }]);
  };

const handleProcessStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");
      const processingItems = mode === 'single' ? [singleItem] : batchItems;
      
      // Final sanity check before DB submission
      const isValid = processingItems.every(i => 
        parseFloat(i.purchase_price) >= 1 && 
        parseFloat(i.selling_price) >= 1 && 
        parseInt(i.initial_quantity) >= 1
      );

      if (!isValid) throw new Error("All quantities and prices must be at least 1");

      const totalInvestment = processingItems.reduce((sum, i) => sum + (parseFloat(i.purchase_price) * parseInt(i.initial_quantity)), 0);
      const totalRev = processingItems.reduce((sum, i) => sum + (parseFloat(i.selling_price) * parseInt(i.initial_quantity)), 0);

      const { data: batch, error: batchErr } = await supabase.from('batches').insert([{
        user_id: user.id,
        batch_name: batchName || (mode === 'single' ? `Single: ${singleItem.item_name}` : `Batch - ${new Date().toLocaleDateString()}`),
        category_id: selectedCategoryId,
        total_investment: totalInvestment,
        expected_revenue: totalRev,
        expected_profit: totalRev - totalInvestment
      }]).select().single();

      if (batchErr) throw batchErr;

      const inventoryData = processingItems.map(i => ({
        user_id: user.id,
        batch_id: batch.id,
        item_name: i.item_name,
        description: i.description,
        image_url: i.image_url,
        category_id: selectedCategoryId,
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

  const labelStyle = "text-xs font-medium uppercase tracking-wider text-slate-800";
  const inputStyle = "h-11 font-medium text-slate-900 border-slate-300 focus-visible:ring-slate-950 transition-all";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-2" /> Loading stock setup...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Refined Header */}
      <div className="space-y-2 border-b border-slate-200 pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Add Stock</h1>
        <p className="text-slate-600 font-medium text-base flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Manage shipments and track incoming inventory value.
        </p>
      </div>

      <Tabs defaultValue="single" onValueChange={(v) => setMode(v as 'single' | 'batch')} className="space-y-8">
        
        {/* 2. Unified Action Bar: Tabs + Category Select */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <TabsList className="bg-slate-100 p-1 rounded-full h-12 w-full max-w-md border border-slate-200">
            <TabsTrigger value="single" className="rounded-full gap-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md text-slate-500">
              <Package className="h-4 w-4" /> Single Item
            </TabsTrigger>
            <TabsTrigger value="batch" className="rounded-full gap-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md text-slate-500">
              <Layers className="h-4 w-4" /> Batch / Bulk
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 w-full md:w-auto px-2">
            <Label className="hidden lg:block text-[11px] font-bold uppercase text-slate-500 tracking-widest whitespace-nowrap">
              Assign Category
            </Label>
            <div className="w-full md:w-64">
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-300 font-medium text-slate-900 rounded-xl focus:ring-2 focus:ring-slate-950">
                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="font-medium">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <form id="stock-form" onSubmit={handleProcessStock}>
              <TabsContent value="single" className="mt-0 outline-none">
                <Card className="border-slate-200 shadow-lg overflow-hidden border-t-4 border-t-slate-900">
                  <div className="p-8 bg-slate-50 border-b border-slate-200">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-950">Product Specifications</CardTitle>
                      <CardDescription className="text-slate-600 font-medium tracking-tight">Standard details for a single inventory unit.</CardDescription>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-8 bg-white">
                    <div className="flex flex-col md:flex-row gap-8">
                      <ImageUpload 
                        imagePreview={singleItem.image_url} 
                        onImageChange={(file) => handleImageChange('single', file)} 
                        onRemove={() => setSingleItem({...singleItem, image_url: null})} 
                      />
                      <div className="flex-1 space-y-6">
                        <div> 
                          <Label className={labelStyle}>Item Name</Label>
                          <Input value={singleItem.item_name} onChange={(e) => setSingleItem({...singleItem, item_name: e.target.value})} placeholder="e.g. iPhone 15 Pro Max" className={cn(inputStyle, "border-blue-200")} required />
                        </div>

                        <div className="space-y-2">
                          <Label className={labelStyle}>Description (Optional)</Label>
                          <Textarea value={singleItem.description} onChange={(e) => setSingleItem({...singleItem, description: e.target.value})} placeholder="Add specs, color, or condition..." className={cn(inputStyle, "border-blue-200")} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100">
                          <div className="space-y-2">
                            <Label className={labelStyle}>Supplier Cost (K)</Label>
                            <Input type="number" step="0.01" min="1" onKeyDown={preventNegative} value={singleItem.purchase_price} onChange={(e) => setSingleItem({...singleItem, purchase_price: validateValue(e.target.value)})} className={cn(inputStyle, "border-blue-200")} required />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelStyle}>Quantity</Label>
                            <Input type="number" min="1" onKeyDown={preventNegative} value={singleItem.initial_quantity} onChange={(e) => setSingleItem({...singleItem, initial_quantity: validateValue(e.target.value)})} className={cn(inputStyle, "border-blue-200")} required />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelStyle}>Selling Price (K)</Label>
                            <Input type="number" step="0.01" min="1" onKeyDown={preventNegative} value={singleItem.selling_price} onChange={(e) => setSingleItem({...singleItem, selling_price: validateValue(e.target.value)})} className="h-10 bg-blue-50 border-blue-200 text-blue-950 font-medium" required />
                          </div>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="batch" className="mt-0 outline-none space-y-6">
                <Card className="border-slate-200 shadow-lg bg-white border-t-4 border-t-slate-900">
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-950">Multiple Items</CardTitle>
                      <CardDescription className="text-slate-600 font-medium tracking-tight">Bulk entry for multiple inventory items.</CardDescription>
                    </div>
                    <div className="min-w-[320px]">
                      <Label className={labelStyle}>Batch Name</Label>
                      <Input placeholder="e.g. Dubai Import, etc." value={batchName} onChange={(e) => setBatchName(e.target.value)} className={cn(inputStyle, "border-blue-200")} />
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {batchItems.map((item, index) => (
                      <div key={item.tempId} className="group relative border-2 border-slate-100 rounded-3xl bg-white p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                        <Button variant="ghost" type="button" size="icon" onClick={() => setBatchItems(batchItems.filter(i => i.tempId !== item.tempId))} className="absolute right-4 top-4 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col md:flex-row gap-6">
                          <ImageUpload compact imagePreview={item.image_url} onImageChange={(file) => handleImageChange(item.tempId, file)} onRemove={() => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, image_url: null} : i))} />
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className={labelStyle}>Item #{index + 1} Name</Label>
                                <Input value={item.item_name} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, item_name: e.target.value} : i))} className={cn(inputStyle, "border-blue-200")} required />
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelStyle}>Description (Optional)</Label>
                                <Input value={item.description} onChange={(e) => setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, description: e.target.value} : i))} className={cn(inputStyle, "border-blue-200")} />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="space-y-1">
                                <Label className={labelStyle}>Supplier Cost (K)</Label>
                                <Input type="number" step="0.01" min="1" onKeyDown={preventNegative} value={item.purchase_price} 
                                  onChange={(e) => { 
                                    const val = validateValue(e.target.value);
                                    setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, purchase_price: val} : i))
                                  }} 
                                  className={cn(inputStyle, "border-blue-200")} required />
                              </div>
                              <div className="space-y-1">
                                <Label className={labelStyle}>Quantity</Label>
                                <Input type="number" min="1" onKeyDown={preventNegative} value={item.initial_quantity} 
                                  onChange={(e) => {
                                    const val = validateValue(e.target.value);
                                    setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, initial_quantity: val} : i))
                                  }}
                                  className={cn(inputStyle, "border-blue-200")} required />
                              </div>
                              <div className="space-y-1">
                                <Label className={labelStyle}>Selling Price (K)</Label>
                                <Input type="number" step="0.01" min="1" onKeyDown={preventNegative} value={item.selling_price} 
                                  onChange={(e) => { 
                                    const val = validateValue(e.target.value);
                                    setBatchItems(batchItems.map(i => i.tempId === item.tempId ? {...i, selling_price: val} : i))
                                  }}
                                className="h-10 bg-blue-50 border-blue-200 text-blue-950 font-medium" required />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addItemToBatch} className="w-full border-dashed border-2 border-slate-300 py-12 gap-3 text-slate-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all rounded-3xl">
                      <div className="p-3 rounded-full bg-slate-200 group-hover:bg-blue-200">
                        <Plus className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-sm uppercase tracking-[0.1em]">Append New Item to Batch</span>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-6 sticky top-10 md:top-24">
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="shadow-xl rounded-3xl border border-slate-200 overflow-hidden ring-4 ring-slate-50">
                  <BatchSummaryCard items={(mode === 'single' ? [singleItem] : batchItems).map(i => ({
                    purchase_price: parseFloat(i.purchase_price) || 0,
                    selling_price: parseFloat(i.selling_price) || 0,
                    quantity: parseInt(i.initial_quantity) || 0
                  }))} />
              </div>
              
              <Button type="submit" form="stock-form" disabled={loading} className="w-full h-16 text-lg font-bold shadow-xl mt-8 bg-slate-950 hover:bg-slate-900 text-white transition-all transform hover:-translate-y-1 active:scale-95 gap-3 rounded-2xl border-b-4 border-slate-800">
                {loading ? 'Processing...' : (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    Confirm Inventory
                    <ChevronRight className="h-5 w-5 ml-auto opacity-80" />
                  </>
                )}
              </Button>
            </div>
            
            <Card className="bg-blue-50 border-blue-200 shadow-sm">
              <CardContent className="p-5 flex gap-4">
                <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-blue-900 font-bold text-sm mb-1">Important Note</h4>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    New inventory is tagged with "Available" status by default. The calculations used include gross revenue and projected ROI. This ensures your "Cost vs Price" ratio is profitable before commitment.
                    </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

function ImageUpload({ imagePreview, onImageChange, onRemove, compact = false }: { imagePreview: string | null, onImageChange: (f: File | undefined) => void, onRemove: () => void, compact?: boolean }) {
  const sizeClass = compact ? "h-28 w-28" : "h-40 w-40";
  return (
    <div className="space-y-3 flex-shrink-0 group">
      <Label className="text-xs font-medium uppercase tracking-wider text-slate-800">Product Image</Label>
      <div className="flex items-start gap-4">
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className={`${sizeClass} rounded-2xl object-cover border-4 border-white shadow-lg`} />
            <button type="button" onClick={onRemove} className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600 shadow-md border-4 border-white transition-transform hover:scale-110"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <label className={`${sizeClass} border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all bg-slate-50 text-slate-500`}>
            <Upload className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} mb-3 opacity-70 group-hover:opacity-100 transition-opacity`} />
            <span className="text-[11px] font-extrabold uppercase tracking-tight">Add Photo</span>
            <input type="file" accept="image/*" onChange={(e) => onImageChange(e.target.files?.[0])} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}