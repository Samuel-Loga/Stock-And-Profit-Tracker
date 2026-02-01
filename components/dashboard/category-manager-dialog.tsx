'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  Edit2, 
  PlusCircle, 
  Settings2, 
  Tags, 
  FileText, 
  Loader2, 
  RotateCcw,
  ListFilter
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

export function CategoryManagerDialog() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for the proper delete prompt
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");
      
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({ name, description })
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name, description, user_id: user.id }]);
        if (error) throw error;
        toast.success("New category created");
      }
      
      setName('');
      setDescription('');
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCategoryId) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', deleteCategoryId);
      if (error) throw error;
      
      toast.success("Category removed");
      setDeleteCategoryId(null);
      fetchCategories();
    } catch (err: any) {
      toast.error("Could not delete category. Ensure no items are exclusively tied to it.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  return (
    <>
      <Dialog onOpenChange={(open) => !open && resetForm()}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 font-bold text-slate-600 hover:text-slate-900">
            <Settings2 className="h-4 w-4" /> Manage Item Categories
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[500px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Tags className="h-6 w-6 text-emerald-600" />
              Category Manager
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Organize your inventory by creating and editing product groups.
            </DialogDescription>
          </DialogHeader>
          
          {/* Input Section */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Summary Box Style Header */}
            <div className="p-3 rounded-lg flex items-center justify-between bg-slate-50 border border-slate-100">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-slate-400" />
                Active Categories
              </span>
              <span className="text-lg font-black text-slate-900">
                {categories.length} Groups
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center h-5 gap-2 font-bold text-slate-700">
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-500" /> Name
                </Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Footwear" 
                  className="font-medium border-slate-300"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center h-5 gap-2 font-bold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Description
                </Label>
                <Input 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Short detail..." 
                  className="font-medium border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className={`flex-1 h-11 font-black shadow-md transition-all ${
                  editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : editingId ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
              
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11 px-3 border-slate-300" 
                  onClick={resetForm}
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400 tracking-widest"><span className="bg-white px-2">Existing Groups</span></div>
          </div>

          {/* List Section */}
          <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {categories.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-sm">No categories created yet.</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="group flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate">{cat.name}</p>
                    <p className="text-xs font-medium text-slate-500 truncate">{cat.description || "No description"}</p>
                  </div>
                  <div className="flex gap-1 ml-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" 
                      onClick={() => {
                        setEditingId(cat.id);
                        setName(cat.name);
                        setDescription(cat.description || '');
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-slate-400" 
                      onClick={() => setDeleteCategoryId(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Proper Delete Prompt */}
      <DeleteConfirmDialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Category?"
        description="This action cannot be undone. Any items currently in this category will be marked as 'Uncategorized'."
      />
    </>
  );
}