// components/dashboard/sales-history.tsx
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

interface SalesHistoryProps {
  sales: any[];
}

export function SalesHistory({ sales }: SalesHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No sales recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => {
                  const total = sale.quantity_sold * sale.selling_price;
                  const cost = sale.inventory?.purchase_price || 0;
                  const profit = (sale.selling_price - cost) * sale.quantity_sold;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {sale.inventory?.item_name || 'Unknown Item'}
                      </TableCell>
                      <TableCell>{sale.quantity_sold}</TableCell>
                      <TableCell>K{total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={profit >= 0 ? "default" : "destructive"} className={profit >= 0 ? "bg-green-600" : ""}>
                          K{profit.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}