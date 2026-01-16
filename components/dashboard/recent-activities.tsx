// components/dashboard/recent-activities.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, PackagePlus, RefreshCcw } from 'lucide-react';

interface RecentActivitiesProps {
  sales: any[];
  inventory: any[];
  restocks: any[];
}

export function RecentActivities({ sales, inventory, restocks }: RecentActivitiesProps) {
  // Combine all activity types
  const activities = [
    // Sales
    ...sales.map(s => ({
      type: 'sale',
      id: s.id,
      title: `Sold ${s.quantity_sold}x ${s.inventory?.item_name || 'Item'}`,
      subtitle: 'Sale',
      amount: s.quantity_sold * s.selling_price,
      date: new Date(s.sale_date),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      isPositive: true
    })),
    // New Items Created
    ...inventory.map(i => ({
      type: 'new_item',
      id: i.id,
      title: `Added Item: ${i.item_name}`,
      subtitle: `Initial Stock: ${i.initial_quantity}`,
      amount: i.initial_quantity * i.purchase_price,
      date: new Date(i.created_at),
      icon: PackagePlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      isPositive: false
    })),
    // Restocks
    ...restocks.map(r => ({
      type: 'restock',
      id: r.id,
      title: `Restocked ${r.inventory?.item_name}`,
      subtitle: `Added ${r.quantity_added} units`,
      amount: r.quantity_added * r.cost_per_unit,
      date: new Date(r.date_added), // Includes full time for logging
      icon: RefreshCcw,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      isPositive: false
    }))
  ]
  // Sort by date descending (newest first)
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 20);

  return (
    <Card className="col-span-3 h-full">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-0">
            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent activities found.
              </div>
            ) : (
              activities.map((activity, index) => (
                <div 
                  key={`${activity.type}-${activity.id}-${index}`} 
                  className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors border-b last:border-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={activity.bg}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.subtitle}</span>
                      <span>•</span>
                      <span>
                        {activity.date.toLocaleDateString()} {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className={`ml-auto font-medium text-sm ${activity.isPositive ? 'text-green-600' : 'text-slate-900'}`}>
                    {activity.isPositive ? '+' : '-'}${activity.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}