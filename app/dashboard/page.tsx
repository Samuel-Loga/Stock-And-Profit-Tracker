// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryAnalytics } from '@/components/dashboard/category-analytics';
import { SalesAnalytics } from '@/components/dashboard/sales-analytics';
import { SalesHistory } from '@/components/dashboard/sales-history';
import { StockHistory } from '@/components/dashboard/stock-history';
import { ExpensesTable } from '@/components/dashboard/expenses-table';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, Receipt, TrendingUp, AlertCircle, Tag } from 'lucide-react';
import { CategoryStockChart } from '@/components/dashboard/category-stock-chart';
import { Database } from '@/types/database';

// Keep this helper outside the component
const getCategoryPerformance = (inventory: any[], sales: any[]) => {
  if (!inventory.length || !sales.length) return 'N/A';
  
  const stats = inventory.reduce((acc: any, item: any) => {
    // This now works because we fetch categories(name) in the main loader
    const catName = item.categories?.name || 'Uncategorized';
    if (!acc[catName]) acc[catName] = { profit: 0, salesCount: 0 };
    
    const itemSales = sales.filter(s => s.inventory_id === item.id);
    const profit = itemSales.reduce((sum, s) => 
      sum + ((s.selling_price - item.purchase_price) * s.quantity_sold), 0
    );
    
    acc[catName].profit += profit;
    acc[catName].salesCount += itemSales.length;
    return acc;
  }, {});

  const sorted = Object.entries(stats).sort((a: any, b: any) => b[1].profit - a[1].profit);
  return sorted.length > 0 ? sorted[0][0] : 'N/A';
};

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

  // Unified Effect
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Inventory with BOTH Batch AND Category information
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*, batches(batch_name), categories(name)') // Join both here!
        .eq('user_id', user.id);
      if (invError) throw invError;

      // 2. Fetch Sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, inventory(*, batches(batch_name))')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      if (salesError) throw salesError;

      // 3. Fetch Restocks
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
        const totalValue = invData.reduce((sum, item) => sum + Number(item.purchase_price * item.quantity_remaining || 0), 0);
        
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
          totalItems: invData.length,
          totalValue,
          expectedProfit,
          actualProfit,
          lowStockItems,
          totalExpenses: totalExpensesAmount,
        });
        
        // SETTING STATE ONCE WITH FULL DATA
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

  const topCategory = getCategoryPerformance(inventory, sales);

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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
         <StatsCard title="Inventory Items" value={stats.totalItems} icon={Package} description="Total products tracked" />
         <StatsCard title="Total Investment" value={`K${stats.totalValue.toLocaleString()}`} icon={DollarSign} description="Capital deployed in stock" />
         <StatsCard title="Gross Profit" value={`K${stats.actualProfit.toLocaleString()}`} icon={DollarSign} description="Profit before expenses" />
         <StatsCard title="Total Expenses" value={`K${stats.totalExpenses.toLocaleString()}`} icon={Receipt} description="Operating overheads" />
         <StatsCard title="Net Profit" value={`K${(stats.actualProfit - stats.totalExpenses).toLocaleString()}`} icon={TrendingUp} description="Actual profit after expenses" />
         
         {/* CARD FOR TOP CATEGORY */}
         <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-900 uppercase tracking-wider">Top Category</CardTitle>
            <Tag className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-900">
              {loading ? "..." : topCategory}
            </div>
            <p className="text-xs text-blue-600 font-bold mt-1 uppercase">
              By Realized Profit
            </p>
          </CardContent>
        </Card>
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

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {inventory.length > 0 ? (
          <CategoryStockChart inventory={inventory} />
        ) : (
          <Card className="lg:col-span-2 flex items-center justify-center p-10 border-dashed">
            <div className="text-center">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No inventory data found for charts.</p>
            </div>
          </Card>
        )}
        
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Operational Velocity</CardTitle></CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <p className="text-sm text-blue-600 font-bold">Velocity data active.</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add sales to see velocity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Category Analytics</TabsTrigger>
          <TabsTrigger value="sales-history">Sales History</TabsTrigger>
          <TabsTrigger value="stock-history">Stock History</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* Tab 1: Analytics & Recent Activities */}
        <TabsContent value="overview">
           <div className="grid gap-4 lg:grid-cols-7">
              <SalesAnalytics sales={sales} />
              <RecentActivities sales={sales} inventory={inventory} restocks={restocks} />
           </div>
        </TabsContent>

        {/* Tab 2: Category Analytics */}
        <TabsContent value="analytics">
           <CategoryAnalytics inventory={inventory} sales={sales} />
        </TabsContent>

        {/* Tab 3: Sales History */}
        <TabsContent value="sales-history">
          <SalesHistory sales={sales} onRefresh={loadDashboardData} />
        </TabsContent>

        {/* Tab 4: Stock History */}
        <TabsContent value="stock-history">
          <StockHistory inventory={inventory} restocks={restocks} />
        </TabsContent>

        {/* Tab 5: Expenses */}
        <TabsContent value="expenses">
          <ExpensesTable expenses={expenses} onRefresh={loadDashboardData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}