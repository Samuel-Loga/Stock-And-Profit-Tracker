'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Receipt,
  Layers,
  PackagePlus
} from 'lucide-react';

// 1. Add onClose to the interface
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void; 
}

// 2. Destructure onClose here
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Add Stock', href: '/dashboard/add-stock', icon: PackagePlus },
    { name: 'Inventory Management', href: '/dashboard/inventory', icon: Package },
    { name: 'Sales History', href: '/dashboard/sales-history', icon: ShoppingCart },
    { name: 'Stock History', href: '/dashboard/stock-history', icon: Layers },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 border-r border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-left-10 duration-200">
      <div className="py-6 px-4 space-y-2">
        <div className="mb-6 px-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Navigation
          </h2>
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={onClose} // 3. This closes the menu when clicked
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 text-sm font-bold rounded-xl transition-all group",
                isActive 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors", 
                isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-600"
              )} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}