// components/dashboard/category-analytics.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CategoryStockChart } from './category-stock-chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Target, Info } from 'lucide-react';

const CHART_COLORS = ['#0f172a', '#2563eb', '#059669', '#7c3aed', '#db2777', '#ca8a04', '#ef4444', '#f97316'];

export function CategoryAnalytics({ inventory, sales, categories }: any) {
  
  // SINGLE SOURCE OF TRUTH: Process all data and assign stable colors here
  const processedData = useMemo(() => {
    // Sort categories alphabetically FIRST to ensure stable color assignment
    const alphabeticalCats = [...categories].sort((a: any, b: any) => a.name.localeCompare(b.name));

    return alphabeticalCats.map((cat: any, index: number) => {
      const catItems = inventory.filter((item: any) => item.category_id === cat.id);
      
      const stockValue = catItems.reduce((sum: number, item: any) => 
        sum + (Number(item.quantity_remaining || 0) * Number(item.purchase_price || 0)), 0
      );

      let totalProfit = 0;
      let totalUnitsSold = 0;

      catItems.forEach((item: any) => {
        const itemSales = sales.filter((s: any) => s.inventory_id === item.id);
        itemSales.forEach((s: any) => {
          const revenue = (Number(s.selling_price) * Number(s.quantity_sold)) - (Number(s.discount_amount) || 0);
          const cost = Number(item.purchase_price) * Number(s.quantity_sold);
          totalProfit += (revenue - cost);
          totalUnitsSold += Number(s.quantity_sold);
        });
      });

      return {
        id: cat.id,
        name: cat.name,
        profit: totalProfit,
        unitsSold: totalUnitsSold,
        stockValue: stockValue,
        color: CHART_COLORS[index % CHART_COLORS.length] // Color is now locked to the category name
      };
    });
  }, [inventory, sales, categories]);

  // Sort by profit for the list display
  const profitSortedData = [...processedData].sort((a, b) => b.profit - a.profit);
  const maxProfit = Math.max(...profitSortedData.map(c => c.profit), 1);
  const topCategory = profitSortedData[0];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Pass the same processedData to the chart */}
      <CategoryStockChart data={processedData} />

      <Card className="col-span-1 border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Profit by Category</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-slate-400">
            Realized Gross Profit (K)
          </CardDescription>
        </CardHeader>
        
        <ScrollArea className="h-[350px] px-6 pb-6">
          <div className="space-y-6 pr-4">
            {profitSortedData.map((cat) => (
              <div key={cat.id} className="space-y-2 group">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {/* Inline style ensures the color matches the pie slice exactly */}
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-black text-slate-900">
                    K{cat.profit.toLocaleString()}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${(cat.profit / maxProfit) * 100}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                  <span>{cat.unitsSold} Sold</span>
                  <span>K{cat.stockValue.toLocaleString()} In Stock</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* 3. Efficiency Insights */}
      <Card className="col-span-1 border-slate-200 shadow-sm bg-slate-50/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Efficiency Insights</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-slate-400">
            Performance Strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {topCategory && topCategory.profit > 0 ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h4 className="text-emerald-900 font-bold text-sm">Top Performer</h4>
              </div>
              <p className="text-emerald-700 text-[11px] leading-relaxed">
                <strong className="text-emerald-900">{topCategory.name}</strong> is your most profitable category. 
                Focus on keeping stock levels high here to maximize your current momentum.
              </p>
            </div>
          ) : (
             <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 italic text-xs text-slate-500">
                Awaiting sales data to identify performers.
             </div>
          )}

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <h4 className="text-blue-900 font-bold text-sm">Inventory Mix</h4>
            </div>
            <p className="text-blue-700 text-[11px] leading-relaxed">
              You are managing <strong className="text-blue-900">{categories.length} categories</strong>. 
              Review categories with high stock value but low units sold to identify "dead weight" capital.
            </p>
          </div>

          <div className="p-4 bg-slate-100/50 rounded-xl border border-slate-200">
             <div className="flex items-center gap-2 mb-1">
                <Info className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Quick Tip</span>
             </div>
             <p className="text-[10px] text-slate-500 italic">
               Check the Capital Distribution chart to see which categories hold the most investment value.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}