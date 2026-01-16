'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Database } from '@/types/database';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    expectedProfit: 0,
    actualProfit: 0,
    lowStockItems: 0,
  });
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (inventory) {
        const totalItems = inventory.length;
        const totalValue = inventory.reduce((sum, item) => sum + Number(item.total_cost), 0);
        const expectedProfit = inventory
          .filter(item => item.status === 'active')
          .reduce((sum, item) => sum + Number(item.expected_profit), 0);
        const actualProfit = inventory.reduce((sum, item) => sum + Number(item.actual_profit), 0);
        const lowStockItems = inventory.filter(
          item => item.quantity_remaining < item.initial_quantity * 0.2 && item.quantity_remaining > 0
        ).length;

        setStats({
          totalItems,
          totalValue,
          expectedProfit,
          actualProfit,
          lowStockItems,
        });

        setRecentItems(inventory.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your inventory and performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          description="Active inventory items"
        />
        <StatsCard
          title="Total Investment"
          value={`$${stats.totalValue.toFixed(2)}`}
          icon={DollarSign}
          description="Total capital invested"
        />
        <StatsCard
          title="Expected Profit"
          value={`$${stats.expectedProfit.toFixed(2)}`}
          icon={TrendingUp}
          description="When all items are sold"
        />
        <StatsCard
          title="Actual Profit"
          value={`$${stats.actualProfit.toFixed(2)}`}
          icon={DollarSign}
          description="Realized from sales"
        />
      </div>

      {stats.lowStockItems > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              You have {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} running low on stock.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No items yet. Add your first stock item to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{item.item_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity_remaining} / {item.initial_quantity} remaining
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(item.selling_price).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per unit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
