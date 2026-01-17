// components/dashboard/inventory-item-row.tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/lib/supabase/client';

export function InventoryItemRow({ item, onUpdate }: { item: any, onUpdate: () => void }) {
  const [saleOpen, setSaleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${item.item_name}"? This will remove all history for this item.`)) return;
    const { error } = await supabase.from('inventory').delete().eq('id', item.id);
    if (!error) onUpdate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-row gap-2 text-[13px] leading-tight whitespace-nowrap">
        <span className="font-medium text-slate-700">{date.toLocaleDateString()}</span>
        <span className="text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

  // Profit margin calculation
  const margin = ((item.selling_price - item.purchase_price) / item.selling_price) * 100;

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
      {/* Product Column - Takes up most space */}
      <td className="p-4 w-1/4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="h-10 w-10 rounded border overflow-hidden bg-slate-50 flex-shrink-0">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300 text-[10px]">N/A</div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 truncate block">{item.item_name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate block">
              {item.batches?.batch_name || 'Individual'}
            </span>
          </div>
        </div>
      </td>
      
      {/* Financial Columns - Right aligned for professional look */}
      <td className="p-4 text-center text-sm font-medium text-slate-600 whitespace-nowrap">
        K{Number(item.purchase_price).toLocaleString()}
      </td>

      <td className="p-4 text-center font-bold text-slate-900 whitespace-nowrap">
        <div className="flex flex-col items-end">
          <span className="font-bold text-slate-900">K{Number(item.selling_price).toLocaleString()}</span>
          <span className="text-[10px] font-bold text-blue-600 tracking-tight">
            {margin.toFixed(0)}% MARGIN
          </span>
        </div>
      </td>

      <td className="p-4 px-6 text-center">
        <Badge className={`${getStatusColor(item.status)} uppercase text-[9px] font-bold border px-2 py-0.5 whitespace-nowrap`}>
          {item.status.replace('_', ' ')}
        </Badge>
      </td>

      <td className="p-4 text-center whitespace-nowrap">
        <div className="flex flex-row gap-1 items-center">
          <span className="font-bold">{item.quantity_remaining}</span>
          <span className="text-[13px] text-muted-foreground">of {item.initial_quantity}</span>
        </div>
      </td>

      <td className="p-4">{formatDate(item.created_at)}</td>
      <td className="p-4">{formatDate(item.updated_at || item.created_at)}</td>

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm" 
            onClick={() => setSaleOpen(true)}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Sale
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm" 
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
              
              <DropdownMenuItem 
                className="text-red-600" 
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(false);
                  setTimeout(() => handleDelete(), 10);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* MODALS */}
        <RecordSaleDialog 
          item={item} 
          open={saleOpen} 
          onOpenChange={setSaleOpen} 
          onSuccess={onUpdate} 
        />
        <EditItemDialog 
          item={item} 
          open={editOpen} 
          onOpenChange={setEditOpen} 
          onSuccess={onUpdate} 
        />
        <NavbarRestockDialog 
          existingItem={item} 
          open={restockOpen} 
          onOpenChange={setRestockOpen} 
          onSuccess={onUpdate} 
        />
      </td>
    </tr>
  );
}