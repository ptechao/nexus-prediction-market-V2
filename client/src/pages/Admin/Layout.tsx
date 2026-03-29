import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut,
  Bell,
  Search
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAITranslation } from "@/hooks/useAITranslation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { translate } = useAITranslation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: ShoppingBag, label: "Market Manage", href: "/admin/markets" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: BarChart3, label: "Financial Reports", href: "/admin/reports" },
    { icon: Settings, label: "System Config", href: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-[#0f1115] text-[#e1e1e6] font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1b1e] border-r border-[#2a2b2e] flex flex-col">
        <div className="p-6">
          <Link href="/">
            <a className="flex items-center gap-3 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/50 transition-colors">
                <span className="text-cyan-400 font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                NEXUS <span className="text-xs font-medium text-cyan-500/70 ml-1">ADMIN</span>
              </span>
            </a>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-[#8e8e93] hover:bg-[#2a2b2e] hover:text-[#e1e1e6]"
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "group-hover:text-cyan-400"} transition-colors`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2a2b2e]">
          <Link href="/">
            <a className="flex items-center gap-3 px-3 py-2.5 text-[#8e8e93] hover:text-white rounded-lg hover:bg-[#2a2b2e] transition-all">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Exit Admin</span>
            </a>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 bg-[#1a1b1e]/80 backdrop-blur-md border-b border-[#2a2b2e] flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
              <input 
                placeholder="Search resources..." 
                className="w-full bg-[#0f1115] border border-[#2a2b2e] rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-[#8e8e93] hover:text-white rounded-lg hover:bg-[#2a2b2e] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1b1e]" />
            </button>
            <div className="h-8 w-[1px] bg-[#2a2b2e]" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-cyan-500/20">
                AD
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">Administrator</span>
                <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">Superuser</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-[#2a2b2e]">
          {children}
        </div>
      </main>
    </div>
  );
}
