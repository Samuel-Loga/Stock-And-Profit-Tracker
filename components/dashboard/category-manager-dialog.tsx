// components/dashboard/category-manager-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, Plus, Settings2 } from 'lucide-react';

export function CategoryManagerDialog() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (editingId) {
      await supabase.from('categories').update({ name, description }).eq('id', editingId);
    } else {
      await supabase.from('categories').insert([{ name, description, user_id: user?.id }]);
    }
    
    setName('');
    setDescription('');
    setEditingId(null);
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure? Items in this category will be moved to 'Uncategorized'.")) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" /> Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Category Manager</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Footwear" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
            </div>
          </div>
          <Button type="submit" className="w-full">
            {editingId ? 'Update Category' : 'Add New Category'}
          </Button>
        </form>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div>
                <p className="font-bold text-sm text-slate-900">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setEditingId(cat.id);
                  setName(cat.name);
                  setDescription(cat.description);
                }}>
                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => deleteCategory(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}