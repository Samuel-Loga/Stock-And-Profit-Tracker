// components/dashboard/sales-analytics.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface SalesAnalyticsProps {
  sales: any[];
}

export function SalesAnalytics({ sales }: SalesAnalyticsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Process data: Group sales by date
  const dataMap = sales.reduce((acc: any, sale) => {
    const date = new Date(sale.sale_date);
    // Format: "Jan 15"
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // Sort key: "2023-01-15"
    const sortKey = date.toISOString().split('T')[0];

    if (!acc[sortKey]) {
      acc[sortKey] = { 
        date: dateStr, 
        sortKey, 
        revenue: 0, 
        profit: 0 
      };
    }

    const revenue = Number(sale.quantity_sold) * Number(sale.selling_price);
    const cost = (Number(sale.inventory?.purchase_price) || 0) * Number(sale.quantity_sold);
    
    acc[sortKey].revenue += revenue;
    acc[sortKey].profit += (revenue - cost);
    
    return acc;
  }, {});

  // Sort by date key and convert to array
  const chartData = Object.values(dataMap).sort((a: any, b: any) => 
    a.sortKey.localeCompare(b.sortKey)
  );

  if (!isMounted) {
    return (
      <Card className="col-span-4 h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Revenue & Profit Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[350px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0f172a" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Record sales to see analytics
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}