// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SalesAnalytics } from '@/components/dashboard/sales-analytics';
import { SalesHistory } from '@/components/dashboard/sales-history';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Database } from '@/types/database';
import { StockHistory } from '@/components/dashboard/stock-history';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    expectedProfit: 0,
    actualProfit: 0,
    lowStockItems: 0,
  });
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Inventory
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);
      if (invError) throw invError;

      // 2. Fetch Sales (with inventory join)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, inventory(*)')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      if (salesError) throw salesError;

      // 3. Fetch Restocks (with inventory join)
      const { data: restockData, error: restockError } = await supabase
        .from('restocks')
        .select('*, inventory(*)')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });
      // Note: If the table doesn't exist yet, this might error. 
      // We catch it silently to prevent crashing if user hasn't run migration.
      if (restockError && restockError.code !== '42P01') throw restockError; 

      if (invData) {
        const totalItems = invData.length;
        const totalValue = invData.reduce((sum, item) => sum + Number(item.total_cost), 0);
        
        // Calculate Expected Profit (Active items only)
        const expectedProfit = invData
          .filter(item => item.status === 'active')
          .reduce((sum, item) => sum + Number(item.expected_profit), 0);
        
        // Calculate Actual Profit based on sales history
        const actualProfit = salesData?.reduce((sum, sale) => {
          const buyPrice = sale.inventory?.purchase_price || 0;
          return sum + ((sale.selling_price - buyPrice) * sale.quantity_sold);
        }, 0) || 0;

        const lowStockItems = invData.filter(
          item => item.quantity_remaining < item.initial_quantity * 0.2 && item.quantity_remaining > 0
        ).length;

        setStats({
          totalItems,
          totalValue,
          expectedProfit,
          actualProfit,
          lowStockItems,
        });
        
        setInventory(invData);
      }

      setSales(salesData || []);
      setRestocks(restockData || []);

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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Stats Overview */}
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
          description="Potential from current stock"
        />
        <StatsCard
          title="Actual Profit"
          value={`$${stats.actualProfit.toFixed(2)}`}
          icon={DollarSign}
          description="Realized from sales"
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <AlertCircle className="h-5 w-5" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              You have {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} running low on stock. Check your inventory to restock.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Sales History</TabsTrigger>
          <TabsTrigger value="stock-history">Stock History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Sales Analytics Chart (Spans 4 columns) */}
            <SalesAnalytics sales={sales} />
            
            {/* Unified Activity Feed (Spans 3 columns) */}
            <RecentActivities 
              sales={sales} 
              inventory={inventory} 
              restocks={restocks} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <SalesHistory sales={sales} />
        </TabsContent>

        <TabsContent value="stock-history">
          <StockHistory inventory={inventory} restocks={restocks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}