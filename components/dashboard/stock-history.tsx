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
import { Database } from '@/types/database';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface StockHistoryProps {
  inventory: InventoryItem[];
  restocks: any[];
}

export function StockHistory({ inventory, restocks }: StockHistoryProps) {
  // Combine initial stocking (from inventory table) and restocking (from restocks table)
  const allStockingEvents = [
    ...inventory.map(item => ({
      id: `initial-${item.id}`,
      item_name: item.item_name,
      type: 'Initial Stock',
      quantity: item.initial_quantity,
      cost: item.purchase_price,
      date: new Date(item.created_at || item.date_added),
      badgeStyle: 'bg-emerald-100 text-emerald-800'
    })),
    ...restocks.map(restock => ({
      id: `restock-${restock.id}`,
      item_name: restock.inventory?.item_name || 'Unknown Item',
      type: 'Restock',
      quantity: restock.quantity_added,
      cost: restock.cost_per_unit,
      date: new Date(restock.date_added),
      badgeStyle: 'bg-blue-100 text-blue-800'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stocking & Restocking History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty Added</TableHead>
                <TableHead>Supplier Cost</TableHead>
                <TableHead>Total Investment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStockingEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No stocking records found.
                  </TableCell>
                </TableRow>
              ) : (
                allStockingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      {event.date.toLocaleDateString()} <span className="text-muted-foreground ml-1">{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </TableCell>
                    <TableCell className="font-medium">{event.item_name}</TableCell>
                    <TableCell>
                      <Badge className={`${event.badgeStyle} border-transparent text-[10px] uppercase font-bold`}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>+{event.quantity}</TableCell>
                    <TableCell>${Number(event.cost).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-slate-700">
                      ${(event.quantity * event.cost).toFixed(2)}
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