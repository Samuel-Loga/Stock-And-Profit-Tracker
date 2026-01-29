// components/dashboard/category-stock-chart.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { cn } from '@/lib/utils';

// Interface updated to accept the unified data prop
interface CategoryStockChartProps {
  data: {
    id: string | number;
    name: string;
    profit: number;
    unitsSold: number;
    stockValue: number;
    color: string;
  }[];
}

export function CategoryStockChart({ data }: CategoryStockChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // We sort by stockValue for the visual layout, but use the pre-assigned colors
  const chartData = [...data]
    .filter(d => d.stockValue >= 0)
    .sort((a, b) => b.stockValue - a.stockValue);

  const totalCapital = chartData.reduce((sum, entry) => sum + entry.stockValue, 0);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={innerRadius - 6} outerRadius={innerRadius} fill={fill} opacity={0.3} />
      </g>
    );
  };

  return (
    <Card className="col-span-1 border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Capital Distribution</CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Value of Current Stock</CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex h-[350px] w-full">
          {/* Left: Pie Chart */}
          <div className="flex-1 h-full relative min-w-[50%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex === null ? undefined : activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={2}
                  dataKey="stockValue"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${entry.id}`} 
                      fill={entry.color} // CRITICAL: Uses stable color from parent
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percentage = totalCapital > 0 ? ((d.stockValue / totalCapital) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{d.name}</p>
                          <p className="text-sm font-black">K{d.stockValue.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-400 font-bold">{percentage}% of Total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 font-black text-sm">Total</text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 font-bold text-[10px]">K{totalCapital.toLocaleString()}</text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Vertical Scrollable Legend */}
          <div className="w-[40%] max-w-[180px] border-l border-slate-100 bg-slate-50/50 h-full overflow-y-auto text-[11px] p-3 space-y-1">
              {chartData.map((entry, index) => {
                 const isActive = activeIndex === index;
                 const isZero = entry.stockValue === 0;

                 return (
                  <div 
                    key={entry.id}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer",
                      isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : ""
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className={cn("truncate font-medium", isActive ? "text-slate-900" : "text-slate-600")}>{entry.name}</span>
                    </div>
                    {!isZero && <span className="font-bold ml-1">{((entry.stockValue / totalCapital) * 100).toFixed(0)}%</span>}
                  </div>
                 )
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}