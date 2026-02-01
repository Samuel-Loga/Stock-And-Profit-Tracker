// components/dashboard/recent-activities.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, Facebook, Video, UserCheck, Store, 
  RefreshCcw, PackagePlus, History, Filter,
  ShoppingCart
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Filtering Logic
  const filteredActivities = activities.filter(act => {
    // 1. Type Filter
    const matchesType = typeFilter === 'all' || act.type === typeFilter;

    // 2. Date Filter
    if (dateFilter === 'all') return matchesType;
    
    const actDate = new Date(act.created_at || act.sale_date);
    const now = new Date();
    const isToday = actDate.toDateString() === now.toDateString();
    
    if (dateFilter === 'today') return matchesType && isToday;
    if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return matchesType && actDate.toDateString() === yesterday.toDateString();
    }
    
    return matchesType;
  });

  return (
    <Card className="col-span-full lg:col-span-3 shadow-sm border-slate-200">
      <CardHeader className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Activity Stream
          </CardTitle>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-[11px] font-bold uppercase">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="sale">Sales Only</SelectItem>
              <SelectItem value="restock">Restocks</SelectItem>
              <SelectItem value="new_stock">New Inventory</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 text-[11px] font-bold uppercase">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anytime</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <ScrollArea className="h-[400px] px-6 pb-6">
        <div className="space-y-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-20">
              <Filter className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground italic">No activities match these filters.</p>
            </div>
          ) : (
            filteredActivities.map((act, index) => {
              const isSale = act.type === 'sale';
              const isRestock = act.type === 'restock';
              const isNewStock = act.type === 'new_stock';

              return (
                <div key={`${act.id}-${index}`} className="flex items-start gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full border border-slate-100 flex-shrink-0 flex items-center justify-center ${
                      isSale ? 'bg-slate-50' : isRestock ? 'bg-blue-50' : 'bg-emerald-50'
                    }`}>
                      {isSale ? (
                         act.inventory?.image_url ? (
                            <img src={act.inventory.image_url} alt="" className="h-full w-full rounded-full object-cover" />
                         ) : <ShoppingCart className="h-4 w-4 text-slate-400" />
                      ) : isRestock ? (
                        <RefreshCcw className="h-5 w-5 text-blue-600" />
                      ) : (
                        <PackagePlus className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    {isSale && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                        {getChannelIcon(act.sales_channel)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {isSale && `Sold ${act.quantity_sold}x ${act.inventory?.item_name}`}
                        {isRestock && `Restocked ${act.item_name}`}
                        {isNewStock && `Added ${act.item_name} to Inventory`}
                      </p>
                      
                      <span className={`text-[11px] font-black whitespace-nowrap ${
                        isSale ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        {isSale && `+K${((act.selling_price * act.quantity_sold) - (act.discount_amount || 0)).toLocaleString()}`}
                        {(isRestock || isNewStock) && `+${act.initial_quantity || act.quantity_added} Units`}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {isSale ? act.sales_channel : 'Internal'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleDateString([], { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })} at {new Date(act.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
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