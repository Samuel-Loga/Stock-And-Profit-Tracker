// components/dashboard/category-analytics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CategoryAnalytics({ inventory, sales }: { inventory: any[], sales: any[] }) {
  // Aggregate data by category
  const categoryData = inventory.reduce((acc: any, item: any) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = { profit: 0, unitsSold: 0, stockValue: 0 };
    }
    
    // Calculate realized profit from sales for this item
    const itemSales = sales.filter(s => s.inventory_id === item.id);
    const itemProfit = itemSales.reduce((sum, s) => 
      sum + ((s.selling_price - item.purchase_price) * s.quantity_sold), 0
    );

    acc[category].profit += itemProfit;
    acc[category].unitsSold += itemSales.reduce((sum, s) => sum + s.quantity_sold, 0);
    acc[category].stockValue += (item.quantity_remaining * item.purchase_price);
    
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryData)
    .sort(([, a]: any, [, b]: any) => b.profit - a.profit);

  const maxProfit = Math.max(...sortedCategories.map(([, data]: any) => data.profit), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Profit by Category</CardTitle>
          <CardDescription>Realized profit from items sold in each category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedCategories.map(([name, data]: any) => (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">{name}</span>
                <span className="font-black text-slate-900">K{data.profit.toLocaleString()}</span>
              </div>
              <Progress value={(data.profit / maxProfit) * 100} className="h-2" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                {data.unitsSold} Units Sold • K{data.stockValue.toLocaleString()} On Hand
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Efficiency Insights</CardTitle>
          <CardDescription>How categories are performing relative to stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-2">
            {sortedCategories.slice(0, 1).map(([name]) => (
              <div key={name} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h4 className="text-emerald-900 font-bold text-sm">Top Performer: {name}</h4>
                <p className="text-emerald-700 text-xs mt-1">
                  This category is currently generating your highest realized profit. Consider increasing your stock levels here.
                </p>
              </div>
            ))}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-blue-900 font-bold text-sm">Inventory Distribution</h4>
              <p className="text-blue-700 text-xs mt-1">
                You have {Object.keys(categoryData).length} active categories. Diverse stock reduces risk but requires more management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}