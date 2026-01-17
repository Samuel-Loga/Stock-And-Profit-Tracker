// components/dashboard/inventory-item-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, RefreshCcw } from 'lucide-react';
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

  /**
   * UPDATED LOGIC:
   * We now check against price_updated_at (the specific price timestamp)
   * rather than updated_at (which changes on every sale or stock count update).
   */
  const isPriceRecentlyUpdated = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    // Show tag if updated within the last 24 hours
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  const stockPercentage = (item.quantity_remaining / item.initial_quantity) * 100;

  // Operational Intelligence: Progit Margin Calculation
  const margin = ((item.selling_price - item.purchase_price) / item.selling_price) * 100;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Top Image Section with Floating Badges */}
            <div className="relative h-28 w-28 flex-shrink-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="h-full w-full rounded-xl object-cover border shadow-sm" />
              ) : (
                <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center border border-dashed">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
              )}
              
              {/* MARGIN */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-blue-700 text-[10px] font-bold">
                  {margin.toFixed(1)}% MARGIN
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl truncate tracking-tight">{item.item_name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {item.description || "No description provided."}
                  </p>
                </div>
                <Badge className={`${getStatusColor(item.status)} h-6`}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stock</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {item.quantity_remaining} / {item.initial_quantity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        stockPercentage > 50 ? 'bg-green-500' : 
                        stockPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Selling Price</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      K{Number(item.selling_price).toLocaleString()}
                    </span>
                    {isPriceRecentlyUpdated(item.price_updated_at) && (
                      <Badge className="bg-blue-100 text-blue-800 border-transparent px-2 py-0 h-5 text-[10px] font-bold uppercase shrink-0">
                        Updated
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supplier Cost</p>
                  <p className="font-medium text-sm text-muted-foreground">
                    K{Number(item.purchase_price).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  onClick={() => setShowSaleDialog(true)}
                  className="flex-1"
                  size="sm"
                  disabled={item.quantity_remaining <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
                <Button
                  onClick={() => setShowRestockDialog(true)}
                  variant="outline"
                  className="flex-1"
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