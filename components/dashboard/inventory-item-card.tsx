import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';
import { Database } from '@/types/database';
import { RecordSaleDialog } from './record-sale-dialog';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InventoryItemCardProps {
  item: InventoryItem;
  onUpdate: () => void;
}

export function InventoryItemCard({ item, onUpdate }: InventoryItemCardProps) {
  const [showSaleDialog, setShowSaleDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stockPercentage = (item.quantity_remaining / item.initial_quantity) * 100;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.item_name}
                className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Package className="h-10 w-10 text-slate-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg truncate">{item.item_name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.description || 'No description'}
                  </p>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stock</p>
                  <p className="font-medium">
                    {item.quantity_remaining} / {item.initial_quantity}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        stockPercentage > 50
                          ? 'bg-green-500'
                          : stockPercentage > 20
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sold</p>
                  <p className="font-medium">{item.quantity_sold} units</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                  <p className="font-medium">${Number(item.purchase_price).toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Selling Price</p>
                  <p className="font-medium">${Number(item.selling_price).toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
                  <p className="font-medium">${Number(item.total_cost).toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Actual Profit</p>
                  <p className={`font-medium ${Number(item.actual_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Number(item.actual_profit).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Added: {new Date(item.date_added).toLocaleDateString()}</span>
              </div>

              {item.quantity_remaining > 0 && (
                <Button
                  onClick={() => setShowSaleDialog(true)}
                  className="w-full mt-4"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              )}
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
    </>
  );
}
