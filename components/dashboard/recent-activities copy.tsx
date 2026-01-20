// components/dashboard/recent-activities.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Facebook, 
  Video, 
  UserCheck, 
  Store, 
  RefreshCcw, 
  PackagePlus,
  ArrowUpRight,
  ShoppingBag,
  History
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper for Sales Channels
const getChannelIcon = (channel: string) => {
  switch (channel?.toLowerCase()) {
    case 'whatsapp': return <MessageSquare className="h-3 w-3 text-emerald-500" />;
    case 'facebook': return <Facebook className="h-3 w-3 text-blue-600" />;
    case 'tiktok': return <Video className="h-3 w-3 text-pink-500" />;
    case 'referral': return <UserCheck className="h-3 w-3 text-purple-500" />;
    default: return <Store className="h-3 w-3 text-slate-500" />;
  }
};

export function RecentActivities({ activities }: { activities: any[] }) {
  return (
    <Card className="col-span-full lg:col-span-3 shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Activity Stream
        </CardTitle>
      </CardHeader>
      
      {/* Fixed height scroll pane to prevent card stretching */}
      <ScrollArea className="h-[450px] px-6 pb-6">
        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground italic">No activities yet.</p>
            </div>
          ) : (
            activities.map((act, index) => {
              const isSale = act.type === 'sale';
              const isRestock = act.type === 'restock';
              const isNewStock = act.type === 'new_stock';

              return (
                <div key={`${act.id}-${index}`} className="flex items-start gap-4 group">
                  {/* Icon/Image Section */}
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full border border-slate-100 flex-shrink-0 flex items-center justify-center ${
                      isSale ? 'bg-slate-50' : isRestock ? 'bg-blue-50' : 'bg-emerald-50'
                    }`}>
                      {isSale ? (
                         act.inventory?.image_url ? (
                            <img src={act.inventory.image_url} alt="" className="h-full w-full rounded-full object-cover" />
                         ) : <ShoppingBag className="h-4 w-4 text-slate-400" />
                      ) : isRestock ? (
                        <RefreshCcw className="h-5 w-5 text-blue-600" />
                      ) : (
                        <PackagePlus className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    {/* Overlay Channel Icon for Sales Only */}
                    {isSale && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                        {getChannelIcon(act.sales_channel)}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {isSale && `Sold ${act.quantity_sold}x ${act.inventory?.item_name}`}
                        {isRestock && `Restocked ${act.item_name}`}
                        {isNewStock && `Added ${act.item_name} to Inventory`}
                      </p>
                      
                      {/* Price/Qty Indicator */}
                      <span className={`text-[11px] font-black whitespace-nowrap ${
                        isSale ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        {isSale && `+K${((act.selling_price * act.quantity_sold) - (act.discount_amount || 0)).toLocaleString()}`}
                        {(isRestock || isNewStock) && `+${act.initial_quantity || act.quantity_added} Units`}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {isSale ? `via ${act.sales_channel || 'Direct'}` : 'Warehouse Ops'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {act.notes && (
                      <div className="mt-2 p-2 bg-slate-50/50 rounded-lg border border-slate-100 italic text-[11px] text-slate-500 line-clamp-2">
                        "{act.notes}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}