'use client';

import { useState } from 'react';
import { 
  Menu, 
  LayoutDashboard, 
  User, 
  HelpCircle, 
  LogOut, 
  Users, 
  KeyRound,
  RefreshCcw,
  ReceiptText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import dialogs
import { NavbarRestockDialog } from '@/components/dashboard/navbar-restock-dialog';
import { ExpenseDialog } from '@/components/dashboard/expense-dialog';
import { CategoryManagerDialog } from '@/components/dashboard/category-manager-dialog';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Navbar({ onMenuClick, isSidebarOpen }: NavbarProps) {
  const router = useRouter();
  
  // State for the dialogs
  const [restockOpen, setRestockOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm h-16">
        <div className="flex h-16 items-center px-4 justify-between">
          
          {/* LEFT: Menu Toggle & System Identity */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className={`hover:bg-slate-100 text-slate-700 transition-transform duration-300 ${isSidebarOpen ? 'rotate-90 bg-slate-100' : ''}`}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center border-l pl-4 border-slate-200">
                <Link 
                href="/dashboard" 
                className="flex items-center gap-2 transition-opacity"
                >
                <div className="bg-slate-900 p-1.5 rounded-lg">
                    <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="font-black text-lg text-slate-900 tracking-tight hidden md:inline-block">
                    StockTrack
                </span>
                </Link>
            </div>
          </div>

          {/* RIGHT: Quick Actions & User Profile */}
          <div className="flex items-center gap-2">
            
            {/* Quick Action: Add Category */}
            <CategoryManagerDialog />

            {/* Quick Action: Restock */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
              onClick={() => setRestockOpen(true)}
            >
              <RefreshCcw className="h-4 w-4" />
              Restock
            </Button>

            {/* Quick Action: Add Expense */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold"
              onClick={() => setExpenseOpen(true)}
            >
              <ReceiptText className="h-4 w-4" />
              Add Expense
            </Button>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

            {/* Help Button */}
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-1 ring-2 ring-slate-100 hover:ring-blue-100 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@stocktrack.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Mobile-only menu items */}
                <DropdownMenuItem onClick={() => setRestockOpen(true)} className="md:hidden cursor-pointer text-blue-600">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  <span>Quick Restock</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExpenseOpen(true)} className="md:hidden cursor-pointer text-rose-600">
                  <ReceiptText className="mr-2 h-4 w-4" />
                  <span>Add Expense</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Users</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Reset Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Dialogs are now integrated here */}
      <NavbarRestockDialog open={restockOpen} onOpenChange={setRestockOpen} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} onSuccess={() => window.location.reload()} />
    </>
  );
}