'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackagePlus, Search } from 'lucide-react';
import { Database } from '@/types/database';
import { InventoryItemCard } from '@/components/dashboard/inventory-item-card';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, statusFilter]);

  const loadInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your stock items and record sales
          </p>
        </div>
        <Link href="/dashboard/add-stock">
          <Button>
            <PackagePlus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <PackagePlus className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {items.length === 0 ? 'No items yet' : 'No items found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {items.length === 0
              ? 'Add your first stock item to get started'
              : 'Try adjusting your search or filters'}
          </p>
          {items.length === 0 && (
            <Link href="/dashboard/add-stock">
              <Button>
                <PackagePlus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onUpdate={loadInventory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
