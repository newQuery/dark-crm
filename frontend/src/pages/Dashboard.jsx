import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, FolderKanban, Users2, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24 }}
  >
    <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-shadow duration-200">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--fg-secondary)]">{title}</p>
            <Icon size={18} className="text-[color:var(--primary)]" />
          </div>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }} data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-[color:var(--success)] mt-2">
              +{trend}% from last month
            </p>
          )}
        </>
      )}
    </Card>
  </motion.div>
);

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for real-time updates every 15 seconds
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 15000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, revenueRes, paymentsRes, activityRes] = await Promise.all([
        api.get('/metrics'),
        api.get('/charts/revenue'),
        api.get('/charts/payments'),
        api.get('/activity?limit=10')
      ]);

      setMetrics(metricsRes.data);
      setRevenueData(revenueRes.data);
      setPaymentsData(paymentsRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Dashboard</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Overview of your business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={metrics ? `$${metrics.total_revenue.toLocaleString()}` : '$0'}
          icon={DollarSign}
          trend={12}
          loading={loading}
        />
        <StatCard
          title="Active Projects"
          value={metrics?.active_projects || 0}
          icon={FolderKanban}
          loading={loading}
        />
        <StatCard
          title="Total Clients"
          value={metrics?.total_clients || 0}
          icon={Users2}
          loading={loading}
        />
        <StatCard
          title="MRR"
          value={metrics ? `$${metrics.mrr.toLocaleString()}` : '$0'}
          icon={TrendingUp}
          trend={8}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Revenue Overview</h2>
          <div className="h-64 w-full" data-testid="revenue-bar-chart">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--chart-axis)" 
                    tickLine={false} 
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--chart-axis)" 
                    tickLine={false} 
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--tooltip-bg)', 
                      color: 'var(--tooltip-fg)', 
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="revenue" fill="var(--chart-revenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Payments Trend</h2>
          <div className="h-64 w-full" data-testid="payments-line-chart">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentsData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="paymentStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-payments)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--chart-payments)" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--chart-axis)" 
                    tickLine={false} 
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--chart-axis)" 
                    tickLine={false} 
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--tooltip-bg)', 
                      color: 'var(--tooltip-fg)', 
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="url(#paymentStroke)" 
                    strokeWidth={2.4} 
                    dot={false} 
                    activeDot={{ r: 4, fill: 'var(--chart-payments)' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Recent Activity</h2>
        <div className="space-y-3" data-testid="recent-activity-list">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                data-testid={`activity-${activity.type}`}
              >
                <div className="w-2 h-2 rounded-full bg-[color:var(--primary)]"></div>
                <div className="flex-1">
                  <p className="text-sm text-[color:var(--fg-primary)]">{activity.message}</p>
                  <p className="text-xs text-[color:var(--fg-tertiary)] mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--fg-secondary)]">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}
