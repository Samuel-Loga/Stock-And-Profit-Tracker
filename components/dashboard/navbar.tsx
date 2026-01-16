'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Package, LogOut, LayoutDashboard, PackagePlus, ShoppingCart } from 'lucide-react';
import { signOut } from '@/lib/auth';

export function Navbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-slate-900 p-2 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">StockTrack</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/add-stock">
                <Button variant="ghost" size="sm" className="gap-2">
                  <PackagePlus className="h-4 w-4" />
                  Add Stock
                </Button>
              </Link>
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Inventory
                </Button>
              </Link>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
