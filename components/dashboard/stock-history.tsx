// components/dashboard/stock-history.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StockHistoryProps {
  inventory: any[];
  restocks: any[];
}

export function StockHistory({ inventory, restocks }: StockHistoryProps) {
  // We want to show the batch reference if available
  const allEvents = [
    ...inventory.map(i => ({
      id: i.id,
      date: new Date(i.created_at),
      item: i.item_name,
      qty: i.initial_quantity,
      cost: i.purchase_price,
      batch: i.batches?.batch_name || 'Individual Entry', // Join required in fetch
      type: 'Initial'
    })),
    ...restocks.map(r => ({
      id: r.id,
      date: new Date(r.date_added),
      item: r.inventory?.item_name,
      qty: r.quantity_added,
      cost: r.cost_per_unit,
      batch: r.batches?.batch_name || 'Restock Entry',
      type: 'Restock'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader><CardTitle>Stocking History</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEvents.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{e.date.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{e.batch}</TableCell>
                  <TableCell>{e.item}</TableCell>
                  <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                  <TableCell>+{e.qty}</TableCell>
                  <TableCell>K{(e.qty * e.cost).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}