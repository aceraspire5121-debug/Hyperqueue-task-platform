'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { loadStoredAuth } from '../../store/authSlice';
import {
  toggleCreateModal,
  setSearchQuery,
  setStatusFilter,
  setPriorityFilter,
  setCurrentPage,
} from '../../store/uiSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Task, TaskMetrics } from '../../types';
import { MetricsCards } from '../../components/dashboard/MetricsCards';
import { TaskTable } from '../../components/tasks/TaskTable';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Search & Filter & Pagination state from Redux UI Store
  const { searchQuery: search, statusFilter: status, priorityFilter: priority, currentPage: page } = useSelector(
    (state: RootState) => state.ui
  );

  // Initialize WebSockets for real-time live task updates
  useWebSocket(user?.id || (user as any)?._id);

  useEffect(() => {
    dispatch(loadStoredAuth());
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
    }
  }, [dispatch, router]);

  // TanStack Query: Fetch Metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<TaskMetrics>({
    queryKey: ['metrics'],
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await api.get('/tasks/metrics');
      return res.data.data;
    },
  });

  // TanStack Query: Fetch Tasks List
  const {
    data: tasksData,
    isLoading: tasksLoading,
    refetch,
  } = useQuery<{ tasks: Task[]; total: number; page: number; totalPages: number }>({
    queryKey: ['tasks', search, status, priority, page],
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await api.get('/tasks', {
        params: {
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          page,
          limit: 10,
        },
      });
      return {
        tasks: res.data.data,
        total: res.data.meta?.total || 0,
        page: res.data.meta?.page || 1,
        totalPages: res.data.meta?.totalPages || 1,
      };
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Task Execution & Automation Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time job queue monitoring powered by BullMQ & Socket.IO
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            title="Refresh Data"
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => dispatch(toggleCreateModal(true))}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create & Queue Task</span>
          </button>
        </div>
      </div>

      {/* 1. Metrics Cards Section */}
      <MetricsCards metrics={metricsData} isLoading={metricsLoading} />

      {/* 2. Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value))}
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* 3. Tasks Data Table */}
      <TaskTable tasks={tasksData?.tasks || []} isLoading={tasksLoading} />

      {/* 4. Pagination */}
      {tasksData && tasksData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Showing Page {tasksData.page} of {tasksData.totalPages} ({tasksData.total} Total Tasks)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => dispatch(setCurrentPage(Math.max(page - 1, 1)))}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 disabled:opacity-50 hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              disabled={page >= tasksData.totalPages}
              onClick={() => dispatch(setCurrentPage(Math.min(page + 1, tasksData.totalPages)))}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 disabled:opacity-50 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal />
      <TaskDetailModal />
      <EditTaskModal />
    </div>
  );
}
