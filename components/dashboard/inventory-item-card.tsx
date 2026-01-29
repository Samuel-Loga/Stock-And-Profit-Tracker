// components/dashboard/inventory-item-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, RefreshCcw, Timer, Tag, Layers } from 'lucide-react';
import { Database } from '@/types/database';
import { RecordSaleDialog } from './record-sale-dialog';
import { RestockDialog } from './restock-dialog';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InventoryItemCardProps {
  item: InventoryItem;
  onUpdate: () => void;
}

export function InventoryItemCard({ item, onUpdate }: InventoryItemCardProps) {
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 hover:bg-green-100/80';
      case 'low_stock': return 'bg-orange-100 text-orange-800 hover:bg-orange-100/80';
      case 'completed': return 'bg-slate-100 text-slate-800 hover:bg-slate-100/80';
      default: return 'bg-slate-100 text-slate-800 hover:bg-slate-100/80';
    }
  };

  const isPriceRecentlyUpdated = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  const stockPercentage = (item.quantity_remaining / item.initial_quantity) * 100;

  // Operational Intelligence: Profit Margin Calculation
  const margin = ((item.selling_price - item.purchase_price) / item.selling_price) * 100;

  // Turnover Intelligence
  const daysSinceAdded = Math.max((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24), 1);
  const unitsSold = item.initial_quantity - item.quantity_remaining;
  const velocity = unitsSold / daysSinceAdded;
  const daysToEmptyBatch = velocity > 0 ? Math.round(item.initial_quantity / velocity) : 'N/A';

  return (
    <>
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Top Image Section with Floating Badges */}
            <div className="relative h-28 w-28 flex-shrink-0 mx-auto md:mx-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="h-full w-full rounded-xl object-cover border shadow-sm" />
              ) : (
                <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center border border-dashed">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
              )}
              
              {/* MARGIN BADGE - Styled to be more visible */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap uppercase pointer-events-none">
                {margin.toFixed(0)}% Margin
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-xl truncate tracking-tight">{item.item_name}</h3>
                    {/* CATEGORY TAG */}
                    <Badge variant="outline" className="h-5 text-[10px] gap-1 px-2 text-slate-500 border-slate-200 pointer-events-none">
                      <Tag className="h-2.5 w-2.5" />
                      {(item as any).categories?.name || 'Uncategorized'}
                    </Badge>
                  </div>
                  
                  {/* BATCH NAME & TURNOVER SUMMARY */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {(item as any).batches?.batch_name || 'Individual Batch'}
                    </span>
                    {daysToEmptyBatch !== 'N/A' && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <Timer className="h-3 w-3" />
                        Sells in ~{daysToEmptyBatch} days
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description || "No description provided."}
                  </p>
                </div>
                {/* STATUS IN CAPS */}
                <Badge className={`${getStatusColor(item.status)} h-6 uppercase font-bold text-[10px] tracking-wider pointer-events-none`}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* STATS GRID - Expanded to 4 columns to include Turnover Avg */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 border-t pt-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Stock</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {item.quantity_remaining} <span className="text-slate-400 font-normal">/ {item.initial_quantity}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 border">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        stockPercentage > 50 ? 'bg-green-500' : 
                        stockPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Selling Price</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      K{Number(item.selling_price).toLocaleString()}
                    </span>
                    {isPriceRecentlyUpdated(item.price_updated_at) && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Price updated recently" />
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Supplier Cost</p>
                  <p className="font-bold text-sm text-slate-500">
                    K{Number(item.purchase_price).toLocaleString()}
                  </p>
                </div>

                {/* TURNOVER AVG STAT */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Turnover Avg</p>
                  <p className="font-bold text-sm text-blue-600">
                    {daysToEmptyBatch === 'N/A' ? '—' : `${daysToEmptyBatch} Days`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  onClick={() => setShowSaleDialog(true)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                  size="sm"
                  disabled={item.quantity_remaining <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
                <Button
                  onClick={() => setShowRestockDialog(true)}
                  variant="outline"
                  className="flex-1 border-slate-200"
                  size="sm"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Restock
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RecordSaleDialog
        item={item}
        open={showSaleDialog}
        onOpenChange={setShowSaleDialog}
        onSuccess={onUpdate}
      />

      <RestockDialog
        item={item}
        open={showRestockDialog}
        onOpenChange={setShowRestockDialog}
        onSuccess={onUpdate}
      />
    </>
  );
}