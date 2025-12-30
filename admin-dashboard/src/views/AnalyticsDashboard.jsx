import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// API functions
const API_BASE = 'https://fearless-achievement-production.up.railway.app/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

const fetchAnalytics = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/admin/analytics/${endpoint}${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

// Color palette matching Findr brand
const COLORS = {
  primary: '#17DDC0',
  primaryLight: '#E5FBF8',
  secondary: '#1a1a2e',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gray: '#6B7280'
};

const CHART_COLORS = ['#17DDC0', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

// KPI Card Component
const KPICard = ({ title, value, change, changeLabel, icon, isRevenue = false }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {isRevenue ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}% {changeLabel || 'vs last period'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Date Range Picker Component
const DateRangePicker = ({ value, onChange }) => {
  const ranges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 }
  ];
  
  return (
    <div className="flex space-x-2">
      {ranges.map(range => (
        <button
          key={range.days}
          onClick={() => onChange(range.days)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === range.days 
              ? 'bg-teal-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {action}
  </div>
);

// Main Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [bookingsData, setBookingsData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [searchesData, setSearchesData] = useState([]);
  const [aiData, setAiData] = useState(null);
  const [providersData, setProvidersData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Check if user can view revenue
  const [canViewRevenue, setCanViewRevenue] = useState(false);
  
  useEffect(() => {
    // Check permissions from stored admin data
    const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const permissions = adminData.permissions || {};
    setCanViewRevenue(permissions.analytics?.viewRevenue || false);
  }, []);
  
  useEffect(() => {
    loadAllData();
  }, [dateRange]);
  
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();
    const params = { startDate, endDate };
    
    try {
      const [
        overviewRes,
        bookingsRes,
        usersRes,
        searchesRes,
        aiRes,
        providersRes,
        transactionsRes
      ] = await Promise.all([
        fetchAnalytics('overview'),
        fetchAnalytics('bookings', params),
        fetchAnalytics('users', params),
        fetchAnalytics('searches', { ...params, limit: 10 }),
        fetchAnalytics('ai', params),
        fetchAnalytics('providers', { metric: 'bookings', limit: 5 }),
        fetchAnalytics('transactions', { ...params, limit: 10 })
      ]);
      
      setOverview(overviewRes);
      setBookingsData(bookingsRes.data || []);
      setUsersData(usersRes.data || []);
      setSearchesData(searchesRes.data || []);
      setAiData(aiRes);
      setProvidersData(providersRes);
      setTransactions(transactionsRes.transactions || []);
      
      // Load revenue if permitted
      if (canViewRevenue) {
        const revenueRes = await fetchAnalytics('revenue', params);
        setRevenueData(revenueRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadAllData();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your platform performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value={overview?.users?.total || 0}
          change={overview?.users?.growth}
          icon="👥"
        />
        <KPICard
          title="Bookings (30d)"
          value={overview?.bookings?.completed30d || 0}
          change={overview?.bookings?.growth}
          icon="📅"
        />
        {canViewRevenue && (
          <KPICard
            title="Revenue (30d)"
            value={overview?.revenue?.gross30d || 0}
            change={overview?.revenue?.growth}
            icon="💰"
            isRevenue
          />
        )}
         <KPICard
            title="Providers"
            value={overview?.providers?.total || 0}
            icon="🏥"
          />
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <SectionHeader title="Bookings Over Time" />
            {bookingsData.some(d => d.completed > 0 || d.cancelled > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Completed" />
                  <Line type="monotone" dataKey="cancelled" stroke={COLORS.danger} strokeWidth={2} dot={false} name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No booking data yet
              </div>
            )}
          </div>
        
        {/* Provider Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <SectionHeader title="Providers by Type" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={providersData?.distribution || []}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {(providersData?.distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (if permitted) */}
          {canViewRevenue && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <SectionHeader title="Revenue Over Time" />
              {revenueData.some(d => d.gross > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <Area type="monotone" dataKey="gross" stroke={COLORS.primary} fill={COLORS.primaryLight} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  No revenue data yet
                </div>
              )}
            </div>
          )}
        
        {/* Top Searches */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <SectionHeader title="Top Searches" />
            {searchesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={searchesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="query" 
                    tick={{ fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Searches" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No search data yet
              </div>
            )}
          </div>
      
      {/* AI Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <SectionHeader 
          title="AI Assistant (Clarity) Analytics"
          action={
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                Feedback Score: 
                <span className={`ml-2 font-semibold ${aiData?.summary?.feedbackScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {aiData?.summary?.feedbackScore || 0}%
                </span>
              </span>
            </div>
          }
        />
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{aiData?.summary?.conversations?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500">Conversations</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{aiData?.summary?.messages?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500">Messages</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{aiData?.summary?.documentsAnalyzed?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500">Documents Analyzed</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{aiData?.summary?.calculatorUses?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-500">Calculator Uses</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">👍 {aiData?.summary?.positiveFeedback || 0}</p>
            <p className="text-2xl font-bold text-red-600">👎 {aiData?.summary?.negativeFeedback || 0}</p>
          </div>
        </div>
        
        {/* Top Questions - Hidden until real data available */}
          {(aiData?.summary?.conversations > 0) && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Top Questions</h4>
              <div className="space-y-2">
                {(aiData?.topQuestions || []).map((q, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{q.question}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{q.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
      
      {/* Recent Transactions & Top Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <SectionHeader 
            title="Recent Transactions"
            action={
              <a href="/transactions" className="text-sm text-teal-600 hover:text-teal-700">
                View All →
              </a>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Provider</th>
                  {canViewRevenue && <th className="pb-3 font-medium">Amount</th>}
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-sm">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm font-medium">{t.provider}</td>
                    {canViewRevenue && (
                      <td className="py-3 text-sm">${t.amount?.toLocaleString()}</td>
                    )}
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={canViewRevenue ? 4 : 3} className="py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top Providers */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <SectionHeader title="Top Providers by Bookings" />
          <div className="space-y-4">
            {(providersData?.topProviders || []).map((provider, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {provider.rank}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{provider.name}</p>
                    <p className="text-sm text-gray-500">{provider.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{provider.bookings} bookings</p>
                  {canViewRevenue && provider.revenue && (
                    <p className="text-sm text-gray-500">${provider.revenue.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
            {(providersData?.topProviders || []).length === 0 && (
              <p className="text-center text-gray-500 py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
