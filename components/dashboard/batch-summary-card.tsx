// components/dashboard/batch-summary-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';

interface BatchSummaryProps {
  items: {
    purchase_price: number;
    selling_price: number;
    quantity: number;
  }[];
}

export function BatchSummaryCard({ items }: BatchSummaryProps) {
  const totalInvestment = items.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);
  const totalRevenue = items.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const expectedProfit = totalRevenue - totalInvestment;
  const roi = totalInvestment > 0 ? (expectedProfit / totalInvestment) * 100 : 0;

  return (
    <Card className="bg-slate-900 text-white border-none shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-400" />
          Batch Oversight
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Investment</p>
            <p className="text-2xl font-bold">${totalInvestment.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Exp. Profit</p>
            <p className="text-2xl font-bold text-green-400">${expectedProfit.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Potential Revenue</p>
            <p className="text-lg font-semibold">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">ROI</p>
            <p className="text-lg font-semibold text-blue-400">{roi.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}