'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

export default function AddStockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    purchase_price: '',
    selling_price: '',
    initial_quantity: '',
    date_added: new Date().toISOString().split('T')[0],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const purchasePrice = parseFloat(formData.purchase_price);
      const sellingPrice = parseFloat(formData.selling_price);
      const quantity = parseInt(formData.initial_quantity);

      if (sellingPrice < purchasePrice) {
        alert('Selling price should be greater than or equal to purchase price');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('inventory').insert([
        {
          user_id: user.id,
          item_name: formData.item_name,
          description: formData.description,
          image_url: imagePreview,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          initial_quantity: quantity,
          quantity_remaining: quantity,
          date_added: formData.date_added,
        },
      ]);

      if (error) throw error;

      router.push('/dashboard/inventory');
    } catch (error: any) {
      console.error('Error adding stock:', error);
      alert(error.message || 'Failed to add stock item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Stock</h1>
        <p className="text-muted-foreground mt-1">
          Add a new item to your inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="h-32 w-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-2">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. Max size: 5MB
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="e.g., iPhone 14 Pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_added">Date Added *</Label>
                <Input
                  id="date_added"
                  name="date_added"
                  type="date"
                  value={formData.date_added}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                placeholder="Brief description of the item"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price ($) *</Label>
                <Input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_quantity">Quantity *</Label>
                <Input
                  id="initial_quantity"
                  name="initial_quantity"
                  type="number"
                  min="1"
                  value={formData.initial_quantity}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="0"
                />
              </div>
            </div>

            {formData.purchase_price && formData.selling_price && formData.initial_quantity && (
              <Card className="bg-slate-50">
                <CardContent className="pt-6">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-medium">
                        ${(parseFloat(formData.purchase_price) * parseInt(formData.initial_quantity)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Revenue:</span>
                      <span className="font-medium">
                        ${(parseFloat(formData.selling_price) * parseInt(formData.initial_quantity)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Expected Profit:</span>
                      <span className="font-bold text-green-600">
                        ${((parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)) * parseInt(formData.initial_quantity)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding...' : 'Add Stock Item'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
