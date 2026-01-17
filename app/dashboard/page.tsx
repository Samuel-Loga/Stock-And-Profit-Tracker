'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SalesAnalytics } from '@/components/dashboard/sales-analytics';
import { SalesHistory } from '@/components/dashboard/sales-history';
import { StockHistory } from '@/components/dashboard/stock-history';
import { ExpensesTable } from '@/components/dashboard/expenses-table';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import { Database } from '@/types/database';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    expectedProfit: 0,
    actualProfit: 0,
    lowStockItems: 0,
    totalExpenses: 0,
  });
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Inventory with Batch information
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*, batches(batch_name)')
        .eq('user_id', user.id);
      if (invError) throw invError;

      // 2. Fetch Sales with Inventory and Batch details
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, inventory(*, batches(batch_name))')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      if (salesError) throw salesError;

      // 3. Fetch Restocks with Inventory and Batch details
      const { data: restockData, error: restockError } = await supabase
        .from('restocks')
        .select('*, inventory(item_name), batches(batch_name)')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });
      if (restockError && restockError.code !== '42P01') throw restockError;

      // 4. Fetch Expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*, inventory(item_name)')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });
      if (expenseError) throw expenseError;

      if (invData) {
        // Stats Calculations
        const totalItems = invData.length;
        const totalValue = invData.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
        
        // Expected Profit from remaining stock (Revenue - Cost)
        const expectedProfit = invData
          .filter(item => item.status !== 'completed')
          .reduce((sum, item) => {
             const profitPerUnit = item.selling_price - item.purchase_price;
             return sum + (profitPerUnit * item.quantity_remaining);
          }, 0);
        
        // Actual Profit realized from historical sales
        const actualProfit = salesData?.reduce((sum, sale) => {
          const buyPrice = sale.inventory?.purchase_price || 0;
          return sum + ((sale.selling_price - buyPrice) * sale.quantity_sold);
        }, 0) || 0;

        // Count items using the new logic (Remaining <= 50% of Initial)
        const lowStockItems = invData.filter(
          item => item.status === 'low_stock'
        ).length;

        const totalExpensesAmount = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        setStats({
          totalItems,
          totalValue,
          expectedProfit,
          actualProfit,
          lowStockItems,
          totalExpenses: totalExpensesAmount,
        });
        
        setInventory(invData);
      }

      setSales(salesData || []);
      setRestocks(restockData || []);
      setExpenses(expenseData || []);

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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Inventory Items"
          value={stats.totalItems}
          icon={Package}
          description="Total products tracked"
        />
        <StatsCard
          title="Total Investment"
          value={`K${stats.totalValue.toLocaleString()}`} 
          icon={DollarSign}
          description="Capital deployed in stock"
        />
        <StatsCard
          title="Gross Profit"
          value={`K${stats.actualProfit.toLocaleString()}`}
          icon={DollarSign}
          description="Profit before expenses"
        />
        <StatsCard
          title="Total Expenses"
          value={`K${stats.totalExpenses.toLocaleString()}`}
          icon={Receipt}
          description="Operating overheads"
        />
        <StatsCard
          title="Net Profit"
          value={`K${(stats.actualProfit - stats.totalExpenses).toLocaleString()}`} // Actual Profit minus Expenses
          icon={TrendingUp}
          description="Actual profit after expenses"
        />
      </div>

      {/* Alerts for Low Stock */}
      {stats.lowStockItems > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              You have {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} running low (50% or less remaining).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Primary Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Analytics</TabsTrigger>
          <TabsTrigger value="sales-history">Sale History</TabsTrigger>
          <TabsTrigger value="stock-history">Stock History</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Analytics & Recent Activities */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <SalesAnalytics sales={sales} />
            <RecentActivities 
              sales={sales} 
              inventory={inventory} 
              restocks={restocks} 
            />
          </div>
        </TabsContent>
        
        {/* Tab 2: Detailed Sales Log */}
        <TabsContent value="sales-history">
          <SalesHistory sales={sales} onRefresh={loadDashboardData} />
        </TabsContent>

        {/* Tab 3: Detailed Stocking Log */}
        <TabsContent value="stock-history">
          <StockHistory inventory={inventory} restocks={restocks} />
        </TabsContent>

        <TabsContent value="expenses"> {/* NEW TAB CONTENT */}
          <ExpensesTable expenses={expenses} onRefresh={loadDashboardData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}