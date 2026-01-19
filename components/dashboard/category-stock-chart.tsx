// components/dashboard/category-stock-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

const COLORS = ['#0f172a', '#2563eb', '#16a34a', '#db2777', '#ca8a04', '#7c3aed'];

export function CategoryStockChart({ inventory }: { inventory: any[] }) {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No inventory data available
      </div>
    );
  }

  // 1. Debug log to see if data is actually arriving (Check browser console)
  console.log("Chart received inventory:", inventory);

  // 2. Safely aggregate data
  const dataMap = inventory.reduce((acc: any, item: any) => {
    const catName = item.categories?.name || 'Uncategorized';
    const value = Number(item.quantity_remaining || 0) * Number(item.purchase_price || 0);
    
    if (value > 0) {
      acc[catName] = (acc[catName] || 0) + value;
    }
    return acc;
  }, {});

  const chartData = Object.entries(dataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value);

  // 3. Fallback if no valid data for bars
  if (chartData.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader><CardTitle>Capital Distribution</CardTitle></CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic">
          Insufficient data for stock distribution.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Capital Distribution</CardTitle>
        <CardDescription>Total Kwacha value of current stock by category.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={100}
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs">
                      <p className="font-bold">{payload[0].payload.name}</p>
                      <p>Value: K{Number(payload[0].value).toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}