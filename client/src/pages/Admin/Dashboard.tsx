import { useState } from "react";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "./Layout";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-[#1a1b1e] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full bg-[#1a1b1e] rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  const cards = [
    { 
      label: "Total Trading Volume", 
      value: `$${stats?.totalVolume.toLocaleString()}`, 
      change: "+12.5%", 
      isUp: true, 
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    { 
      label: "Total User Count", 
      value: stats?.totalUsers.toString(), 
      change: "+4.2%", 
      isUp: true, 
      icon: UsersIcon,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      label: "Platform Net Revenue", 
      value: `$${stats?.totalRevenue.toLocaleString()}`, 
      change: "+18.3%", 
      isUp: true, 
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    { 
      label: "Active Markets", 
      value: stats?.activeMarkets.toString(), 
      change: "-2.1%", 
      isUp: false, 
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
            <p className="text-sm text-[#8e8e93] mt-1">Real-time performance metrics and analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#1a1b1e] border border-[#2a2b2e] rounded-lg text-sm font-medium hover:bg-[#2a2b2e] transition-colors">
              Export PDF
            </button>
            <button className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg text-sm hover:bg-cyan-400 transition-shadow shadow-lg shadow-cyan-500/20">
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="bg-[#1a1b1e] border border-[#2a2b2e] p-6 rounded-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <button className="text-[#8e8e93] hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#8e8e93] uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-bold text-white leading-tight">{card.value}</h3>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${card.isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {card.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.change}
                </div>
                <span className="text-[10px] text-[#48484a] font-medium">vs last period</span>
              </div>
              {/* Decorative line */}
              <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${card.color.replace('text-', 'bg-')}`} />
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#1a1b1e] border border-[#2a2b2e] rounded-xl p-8 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-white">Trading Volume Trends</h2>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#0f1115] rounded-md border border-[#2a2b2e]">
                {['1H', '1D', '1W', '1M'].map(t => (
                  <button key={t} className={`px-2 py-1 text-[10px] font-bold rounded ${t === '1W' ? 'bg-[#1a1b1e] text-white shadow-sm' : 'text-[#8e8e93]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.volumeHistory}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2e" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#48484a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    stroke="#48484a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#2a2b2e', borderRadius: '12px', fontSize: '12px', color: '#e1e1e6' }}
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Activity / Side Report */}
          <div className="bg-[#1a1b1e] border border-[#2a2b2e] rounded-xl p-8">
            <h2 className="text-lg font-bold text-white mb-6">Market Distribution</h2>
            <div className="space-y-6">
              {[
                { label: "Crypto", value: 45, color: "bg-blue-500" },
                { label: "Sports", value: 30, color: "bg-purple-500" },
                { label: "Politics", value: 15, color: "bg-emerald-500" },
                { label: "Economy", value: 10, color: "bg-amber-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8e8e93] font-medium">{item.label}</span>
                    <span className="text-white font-bold">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0f1115] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <h3 className="text-sm font-bold text-cyan-400 mb-2">Automated Optimization</h3>
              <p className="text-[10px] text-[#8e8e93] leading-relaxed">
                The matching engine is currently running at 98.4% efficiency. Global slippage protection is active for all markets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
