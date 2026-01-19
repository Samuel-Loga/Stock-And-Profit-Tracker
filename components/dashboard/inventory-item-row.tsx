'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Edit3, ShoppingCart, PlusCircle, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { RecordSaleDialog } from './record-sale-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { NavbarRestockDialog } from './navbar-restock-dialog';
import { DeleteItemModal } from './delete-item-modal'; // NEW
import { supabase } from '@/lib/supabase/client';

interface RowProps {
  item: any;
  onUpdate: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function InventoryItemRow({ item, onUpdate, isSelected, onToggleSelect }: RowProps) {
  const [saleOpen, setSaleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); // NEW
  const [isDeleting, setIsDeleting] = useState(false); // NEW
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Operational Intelligence: Margin Calculation
  const margin = ((item.selling_price - item.purchase_price) / item.selling_price) * 100;

  // Replacement for native confirm - handled via modal
  const handleSingleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;

      // Close modal before refreshing parent
      setDeleteOpen(false);
      onUpdate();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
      document.body.style.pointerEvents = 'auto';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-row items-center gap-2 text-[13px] whitespace-nowrap">
        <span className="font-medium text-slate-700">{date.toLocaleDateString()}</span>
        <span className="text-muted-foreground text-[11px]">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'low_stock': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <tr className={`transition-colors border-b last:border-0 ${isSelected ? 'bg-blue-50/30' : ''}`}>
      <td className="p-4 w-[50px]">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggleSelect(item.id)} 
        />
      </td>

      <td className="p-4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="h-10 w-10 rounded border overflow-hidden bg-slate-50 flex-shrink-0">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300 text-[10px]">N/A</div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 truncate max-w-[180px]">{item.item_name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate max-w-[180px]">
              {item.batches?.batch_name || 'Individual'}
            </span>
          </div>
        </div>
      </td>

      <td className="p-4">
        <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 bg-slate-50/50 uppercase">
          {item.categories?.name || 'Uncategorized'}
        </Badge>
      </td>
      
      <td className="p-4 text-right text-sm font-medium text-slate-600 whitespace-nowrap">
        K{Number(item.purchase_price).toLocaleString()}
      </td>

      <td className="p-4 text-right whitespace-nowrap">
        <div className="flex flex-col items-end">
          <span className="font-bold text-slate-900">K{Number(item.selling_price).toLocaleString()}</span>
          <span className="text-[11px] font-bold text-blue-600 tracking-tight">
            {margin.toFixed(0)}% MARGIN
          </span>
        </div>
      </td>

      <td className="p-4 text-center">
        <Badge className={`${getStatusColor(item.status)} uppercase text-[9px] font-bold border px-2 py-0.5 whitespace-nowrap pointer-events-none`}>
          {item.status.replace('_', ' ')}
        </Badge>
      </td>

      <td className="p-4 text-center whitespace-nowrap">
        <div className="flex flex-row items-center justify-center gap-1.5">
          <span className="font-bold text-slate-900">{item.quantity_remaining}</span>
          <span className="text-[12px] text-muted-foreground">of {item.initial_quantity}</span>
        </div>
      </td>

      <td className="p-4">{formatDate(item.created_at)}</td>
      <td className="p-4">{formatDate(item.updated_at || item.created_at)}</td>

      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm whitespace-nowrap" 
            onClick={() => setSaleOpen(true)}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Sale
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm whitespace-nowrap" 
            onClick={() => setRestockOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" /> Restock
          </Button>
          
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                setIsDropdownOpen(false);
                setTimeout(() => setEditOpen(true), 10);
              }}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onSelect={(e) => {
                e.preventDefault();
                setIsDropdownOpen(false);
                setTimeout(() => setDeleteOpen(true), 10);
              }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <RecordSaleDialog item={item} open={saleOpen} onOpenChange={setSaleOpen} onSuccess={onUpdate} />
        <EditItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} onSuccess={onUpdate} />
        <NavbarRestockDialog existingItem={item} open={restockOpen} onOpenChange={setRestockOpen} onSuccess={onUpdate} />
        
        {/* Single Delete Modal */}
        <DeleteItemModal 
          open={deleteOpen} 
          onOpenChange={setDeleteOpen} 
          itemName={item.item_name} 
          onConfirm={handleSingleDelete} 
          loading={isDeleting} 
        />
      </td>
    </tr>
  );
}