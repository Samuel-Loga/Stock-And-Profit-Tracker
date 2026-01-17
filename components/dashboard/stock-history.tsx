// components/dashboard/stock-history.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

interface StockHistoryProps {
  inventory: any[];
  restocks: any[];
}

export function StockHistory({ inventory, restocks }: StockHistoryProps) {
  // Combine and sort events by Date & Time
  const allStockEvents = [
    ...inventory.map(item => ({
      id: `init-${item.id}`,
      date: new Date(item.created_at),
      item_name: item.item_name,
      batch_name: item.batches?.batch_name || 'Individual Entry',
      type: 'Initial Stock',
      quantity: item.initial_quantity,
      cost: item.purchase_price,
      badgeStyle: 'bg-emerald-100 text-emerald-800'
    })),
    ...restocks.map(restock => ({
      id: `restock-${restock.id}`,
      date: new Date(restock.date_added || restock.created_at),
      item_name: restock.inventory?.item_name || 'Unknown Item',
      batch_name: restock.batches?.batch_name || 'Restock Entry',
      type: 'Restock',
      quantity: restock.quantity_added,
      cost: restock.cost_per_unit,
      badgeStyle: 'bg-blue-100 text-blue-800'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-600" />
          Stock History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed log of all inventory additions and batch restocks.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Qty Added</TableHead>
                <TableHead className="text-right">Total Investment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStockEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No stocking events recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                allStockEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-slate-50/10 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      {event.date.toLocaleDateString()}
                      <span className="text-muted-foreground ml-1">
                        {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {event.batch_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {event.item_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${event.badgeStyle} border-transparent text-[10px] uppercase font-bold`}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      +{event.quantity}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-700">
                      K{(event.quantity * event.cost).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}