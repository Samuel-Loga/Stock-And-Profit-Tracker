// components/dashboard/sales-analytics.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SalesAnalyticsProps {
  sales: any[];
  expenses: any[];
}

export function SalesAnalytics({ sales, expenses }: SalesAnalyticsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const dataMap: any = {};

    sales.forEach(sale => {
      const date = new Date(sale.sale_date || sale.created_at);
      const sortKey = date.toISOString().split('T')[0];
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dataMap[sortKey]) {
        dataMap[sortKey] = { date: dateStr, sortKey, revenue: 0, grossProfit: 0, expenses: 0 };
      }

      const revenue = (Number(sale.quantity_sold) * Number(sale.selling_price)) - (Number(sale.discount_amount) || 0);
      const cost = (Number(sale.inventory?.purchase_price) || 0) * Number(sale.quantity_sold);
      
      dataMap[sortKey].revenue += revenue;
      dataMap[sortKey].grossProfit += (revenue - cost);
    });

    expenses.forEach(exp => {
      const date = new Date(exp.expense_date || exp.created_at);
      const sortKey = date.toISOString().split('T')[0];
      
      if (dataMap[sortKey]) {
        dataMap[sortKey].expenses += Number(exp.amount);
      }
    });

    const sortedDaily = Object.values(dataMap)
      .map((day: any) => ({
        ...day,
        netProfit: day.grossProfit - day.expenses
      }))
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));

    if (viewMode === 'cumulative') {
      let runRev = 0, runGross = 0, runNet = 0;
      return sortedDaily.map((day: any) => {
        runRev += day.revenue;
        runGross += day.grossProfit;
        runNet += day.netProfit;
        return { ...day, revenue: runRev, grossProfit: runGross, netProfit: runNet };
      });
    }

    return sortedDaily;
  }, [sales, expenses, viewMode]);

  if (!isMounted) return <div className="col-span-4 h-[450px] bg-slate-50 animate-pulse rounded-xl" />;

  return (
    <Card className="col-span-4 shadow-sm border-slate-200">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4"> 
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900">Financial Performance</CardTitle>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">
            {viewMode === 'daily' ? 'Individual Daily Totals' : 'Cumulative Running Totals'}
          </p>
        </div>

        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto">
          <TabsList className="grid w-[200px] grid-cols-2 h-8">
            <TabsTrigger value="daily" className="text-[10px] uppercase font-bold">Daily</TabsTrigger>
            <TabsTrigger value="cumulative" className="text-[10px] uppercase font-bold">Growth</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pl-0">
        <div className="h-[380px] w-full px-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                {/* Darker grid for better structure */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" // Darkened for visibility
                  fontSize={11} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={10}
                  dy={10}
                />
                <YAxis
                  stroke="#475569" // Darkened for visibility
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `K${value.toLocaleString()}`}
                />
                
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  formatter={(value: number) => [`K${value.toLocaleString()}`, '']}
                />
                
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={40} 
                  iconType="circle" 
                  wrapperStyle={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    color: '#1e293b',
                    paddingBottom: '10px'
                  }} 
                />
                
                {/* 1. Revenue (High-Contrast Slate) */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#64748b" 
                  strokeWidth={2} 
                  fill="transparent" 
                  name="Revenue" 
                  strokeDasharray="5 5" // Dotted to distinguish from profit lines
                />
                
                {/* 2. Gross Profit (Strong Emerald) */}
                <Area 
                  type="monotone" 
                  dataKey="grossProfit" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  fill="transparent" 
                  name="Gross Profit" 
                />
                
                {/* 3. Net Profit (Strong Blue) */}
                <Area 
                  type="monotone" 
                  dataKey="netProfit" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                  name="Net Profit" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 italic text-sm">
              Process transactions to generate financial trends.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}