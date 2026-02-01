'use client';

import { useState, useEffect } from 'react';
import { 
  Menu, 
  LayoutDashboard, 
  HelpCircle, 
  LogOut, 
  Users, 
  KeyRound,
  RefreshCcw,
  ReceiptText,
  Sun,
  Moon,
  Tags
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
import { useTheme } from 'next-themes';
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
  const { theme, setTheme } = useTheme();
  
  const [userData, setUserData] = useState({ 
    name: 'Loading...', 
    email: 'Fetching user...',
    avatar_url: null 
  });

  const [restockOpen, setRestockOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          name: profile.full_name || 'Admin User',
          email: profile.email || user.email || 'admin@stocktrack.com',
          avatar_url: profile.avatar_url
        });
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Loading...') return 'AD';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm h-16">
        <div className="flex h-16 items-center px-4 justify-between">
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className={`hover:bg-accent transition-transform duration-300 ${isSidebarOpen ? 'rotate-90 bg-accent' : ''}`}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center border-l pl-4 border-border">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg">
                  <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-black text-lg text-foreground tracking-tight hidden md:inline-block uppercase">
                  StockTrack
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <CategoryManagerDialog />
              <Button 
                variant="ghost" size="sm" 
                className="gap-2 text-blue-500 hover:text-blue-600 font-bold"
                onClick={() => setRestockOpen(true)}
              >
                <RefreshCcw className="h-4 w-4" /> Restock
              </Button>
              <Button 
                variant="ghost" size="sm" 
                className="gap-2 text-rose-500 hover:text-rose-600 font-bold"
                onClick={() => setExpenseOpen(true)}
              >
                <ReceiptText className="h-4 w-4" /> Add Expense
              </Button>
            </div>

            <div className="h-6 w-px bg-border mx-2 hidden md:block" />

            {/* Theme Toggler */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-emerald-50 rounded-full">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-1 ring-2 ring-border transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userData.avatar_url || ''} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {getInitials(userData.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal py-3 px-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-bold text-foreground leading-none">
                      {userData.name}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground leading-none truncate">
                      {userData.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                
                {/* Mobile Logic Integration */}
                <div className="md:hidden">
                  <DropdownMenuItem onClick={() => setRestockOpen(true)} className="py-2.5 px-3 cursor-pointer text-blue-500 font-bold">
                    <RefreshCcw className="mr-3 h-4 w-4" /> <span>Quick Restock</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpenseOpen(true)} className="py-2.5 px-3 cursor-pointer text-rose-500 font-bold">
                    <ReceiptText className="mr-3 h-4 w-4" /> <span>Add Expense</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                </div>
                
                <DropdownMenuItem className="py-2.5 px-3 cursor-pointer font-medium">
                  <Users className="mr-3 h-4 w-4" /> <span>Manage Users</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5 px-3 cursor-pointer font-medium">
                  <KeyRound className="mr-3 h-4 w-4" /> <span>Reset Password</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1" />
                
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="py-2.5 px-3 text-rose-500 font-bold cursor-pointer focus:text-rose-600 focus:bg-rose-50"
                >
                  <LogOut className="mr-3 h-4 w-4" /> <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <NavbarRestockDialog open={restockOpen} onOpenChange={setRestockOpen} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} onSuccess={() => window.location.reload()} />
    </>
  );
}