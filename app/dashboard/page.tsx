'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CategoryAnalytics } from '@/components/dashboard/category-analytics';
import { SalesAnalytics } from '@/components/dashboard/sales-analytics';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, Receipt, TrendingUp, AlertCircle, Tag, Loader2 } from 'lucide-react';

// Helper to calculate top performing category based on profit
const getCategoryPerformance = (inventory: any[], sales: any[]) => {
  if (!inventory.length || !sales.length) return 'N/A';
  
  const stats = inventory.reduce((acc: any, item: any) => {
    const catName = item.categories?.name || 'Uncategorized';
    if (!acc[catName]) acc[catName] = { profit: 0 };
    
    const itemSales = sales.filter(s => s.inventory_id === item.id);
    const profit = itemSales.reduce((sum, s) => {
      const revenue = (s.selling_price * s.quantity_sold) - (s.discount_amount || 0);
      const cost = item.purchase_price * s.quantity_sold;
      return sum + (revenue - cost);
    }, 0);
    
    acc[catName].profit += profit;
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
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Inventory
      const { data: invData } = await supabase
        .from('inventory')
        .select('*, batches(batch_name), categories(name)')
        .eq('user_id', user.id);

      // 2. Fetch Sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, inventory(*, batches(batch_name))')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });

      // 3. Fetch Restocks
      const { data: restockData } = await supabase
        .from('restocks')
        .select('*, inventory(item_name), batches(batch_name)')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });

      // 4. Fetch Expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*, inventory(item_name)')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      // 5. Fetch All Categories (for charts)
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (invData) {
        // Calculate Total Inventory Investment
        const totalValue = invData.reduce((sum, item) => sum + (Number(item.purchase_price) * item.quantity_remaining), 0);
        
        // Calculate Actual Realized Profit (Revenue - Discounts - Purchase Cost)
        const actualProfit = salesData?.reduce((sum, sale) => {
          const buyPrice = sale.inventory?.purchase_price || 0;
          const revenue = (sale.selling_price * sale.quantity_sold) - (sale.discount_amount || 0);
          const cost = buyPrice * sale.quantity_sold;
          return sum + (revenue - cost);
        }, 0) || 0;

        // Calculate Low Stock Count
        const lowStockItems = invData.filter(item => item.status === 'low_stock').length;

        // Total Expenses
        const totalExpensesAmount = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        setStats({
          totalItems: invData.length,
          totalValue,
          expectedProfit: 0, // Logic for future projected profit could go here
          actualProfit,
          lowStockItems,
          totalExpenses: totalExpensesAmount,
        });
        
        setInventory(invData);
        setAllCategories(catData || []);
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

  /**
   * Activity Stream Logic
   * Merges three distinct events into one chronological timeline for the stream.
   */
  const combinedActivities = [
    ...(sales.map(s => ({ ...s, type: 'sale' })) || []),
    ...(restocks.map(r => ({ 
      ...r, 
      type: 'restock', 
      item_name: r.inventory?.item_name, 
      created_at: r.date_added 
    })) || []),
    ...(inventory.slice(0, 5).map(i => ({ 
      ...i, 
      type: 'new_stock', 
      created_at: i.created_at 
    })) || [])
  ].sort((a, b) => 
    new Date(b.created_at || b.sale_date).getTime() - new Date(a.created_at || a.sale_date).getTime()
  ).slice(0, 25);

  const topCategory = getCategoryPerformance(inventory, sales);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-2" /> Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
      </div>

      {/* Summary Cards: 2 Columns on Mobile, 6 on Desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6">
         <StatsCard title="Inventory Items" value={stats.totalItems} icon={Package} description="Total products tracked" className="border-slate-200 bg-white font-bold" />
         <StatsCard title="Stock Value" value={`K${stats.totalValue.toLocaleString()}`} icon={DollarSign} description="Capital deployed in stock" className="border-blue-100 bg-blue-50/50 text-blue-900" />
         <StatsCard title="Gross Profit" value={`K${stats.actualProfit.toLocaleString()}`} icon={DollarSign} description="Profit before expenses" className="border-emerald-100 bg-emerald-50/50 text-emerald-900" />
         <StatsCard title="Total Expenses" value={`K${stats.totalExpenses.toLocaleString()}`} icon={Receipt} description="Overhead & operating costs" className="border-rose-100 bg-rose-50/50 text-rose-900" />
         <StatsCard title="Net Profit" value={`K${(stats.actualProfit - stats.totalExpenses).toLocaleString()}`} icon={TrendingUp} description="Profit after expenses" className="border border-emerald-100 bg-emerald-50  text-emerald-900" />
         
         <Card className="border-blue-100 bg-blue-50/30 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-900 uppercase tracking-wider">Top Category</CardTitle>
            <Tag className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-900 truncate">
              {topCategory}
            </div>
            <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">By Realized Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Low Stock */}
      {stats.lowStockItems > 0 && (
        <Card className="border-orange-200 bg-orange-50 animate-in fade-in duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <AlertCircle className="h-5 w-5" />
              Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 font-medium">
              You have {stats.lowStockItems} items with less than 50% stock remaining. Check your Stock History for restock needs.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-200/50 p-1 w-full md:w-auto grid grid-cols-2 md:inline-flex h-10 md:h-9">
          <TabsTrigger 
            value="overview" 
            className="text-xs font-bold uppercase tracking-tight transition-all 
                       data-[state=active]:bg-blue-600 
                       data-[state=active]:text-white 
                       data-[state=active]:shadow-md"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="text-xs font-bold uppercase tracking-tight transition-all 
                       data-[state=active]:bg-blue-600 
                       data-[state=active]:text-white 
                       data-[state=active]:shadow-md"
          >
            Category Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
           <div className="grid gap-4 lg:grid-cols-7">
              {/* Force charts to full width on mobile, specialized span on desktop */}
              {/* Sales Analytics provides the line chart */}
              <div className="lg:col-span-4">
                <SalesAnalytics sales={sales} expenses={expenses} />
              </div>
              {/* Activity Stream provides the live vertical feed */}
              <div className="lg:col-span-3">
                <RecentActivities activities={combinedActivities} />
              </div>
           </div>
        </TabsContent>

        <TabsContent value="analytics">
           <CategoryAnalytics inventory={inventory} sales={sales} categories={allCategories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}