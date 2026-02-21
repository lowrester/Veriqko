import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { stats } from '@/api/stats'
import { AnalyticsView } from './AnalyticsView'
import { useAuthStore } from '@/stores/authStore'
import { STATUS_LABELS, formatDate } from '@/types'
import {
  Clipboard,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCw,
  LayoutDashboard,
  BarChart,
  Smartphone
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'analytics'>('overview')

  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: stats.getDashboard,
    refetchInterval: 30000, // Poll every 30 seconds
  })

  // Default empty state
  const statsData = dashboardData?.counts || { total: 0, in_progress: 0, completed: 0, failed: 0 }
  const metrics = dashboardData?.metrics || { yield_rate: 0 }
  const recentJobs = dashboardData?.recent_activity || []

  return (
    <div className="space-y-4">
      {/* Welcome & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-text-secondary">Here is your overview for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'analytics'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <BarChart className="w-4 h-4" />
              Analytics
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-full hover:bg-bg-secondary transition-all ${isRefetching ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RotateCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsView />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={Clipboard}
              label="Total Jobs"
              value={statsData.total}
              color="blue"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={statsData.in_progress}
              color="yellow"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={statsData.completed}
              color="green"
            />
            <StatCard
              icon={AlertCircle}
              label="Failed"
              value={statsData.failed}
              color="red"
            />
            <StatCard
              icon={TrendingUp}
              label="Pass Rate"
              value={`${metrics.yield_rate}%`}
              color="purple"
            />
          </div>

          {/* Quick actions */}
          <div className="card">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/jobs/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Job
              </Link>
              <Link to="/jobs" className="btn-secondary flex items-center gap-2">
                View All Jobs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
              <Link
                to="/jobs"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>

            {error ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <p className="font-medium">Kunde inte hämta händelser</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activity yet.{' '}
                <Link to="/jobs/new" className="text-blue-600 hover:underline">
                  Start processing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/job/${job.id}/run`}
                    className="flex items-center justify-between p-3 -mx-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 group border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center group-hover:bg-brand-light transition-colors">
                        <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-primary transition-colors">
                          {job.serial_number}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {job.brand} {job.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {job.sla_status && job.sla_status !== 'none' && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border tracking-tighter ${job.sla_status === 'critical'
                          ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                          : job.sla_status === 'warning'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                          SLA
                        </span>
                      )}
                      {job.picea_mdm_locked && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-lg border border-red-200 tracking-tighter animate-pulse">
                          MDM LOCK
                        </span>
                      )}
                      {(job.status === 'completed' && (!job.picea_verify_status || job.picea_verify_status !== 'SUCCESS' || !job.picea_erase_confirmed)) && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 font-black px-2 py-0.5 rounded-lg border border-orange-200 tracking-tighter">
                          BYPASSED
                        </span>
                      )}
                      <span className={`badge-${job.status} px-3 py-1 text-[11px] font-bold uppercase tracking-wider`}>
                        {STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] || job.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400 hidden sm:block">
                        {formatDate(job.updated_at)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  return (
    <div className="card hover:shadow-md transition-all duration-300 border-none bg-white/60 backdrop-blur-sm p-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  )
}
