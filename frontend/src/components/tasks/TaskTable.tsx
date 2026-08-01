'use client';

import React from 'react';
import { Task, TaskStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  RefreshCw,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSelectedTaskId } from '../../store/uiSlice';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface TaskTableProps {
  tasks: Task[];
  isLoading: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, isLoading }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const handleRetry = async (taskId: string) => {
    try {
      await api.post(`/tasks/${taskId}/retry`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    } catch (err) {
      console.error('Failed to retry task:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </span>
        );
      case TaskStatus.FAILED:
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </span>
        );
      case TaskStatus.PROCESSING:
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Processing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };
    return (
      <span
        className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${
          colors[priority] || colors.LOW
        }`}
      >
        {priority}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-2 text-sm text-slate-400">Loading live tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
        <Clock className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-base font-semibold text-white">No tasks found</h3>
        <p className="mt-1 text-sm text-slate-400">
          Create a new task or adjust your search filters to see results.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Title & Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((task) => (
              <tr key={task._id} className="transition hover:bg-slate-800/40">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{task.title}</div>
                  {task.description && (
                    <div className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                      {task.description}
                    </div>
                  )}
                  {task.failedReason && (
                    <div className="mt-1 text-xs text-rose-400">
                      Reason: {task.failedReason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{renderStatusBadge(task.status)}</td>
                <td className="px-6 py-4">{renderPriorityBadge(task.priority)}</td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(task.createdAt).toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {/* View Logs Button */}
                    <button
                      onClick={() => dispatch(setSelectedTaskId(task._id))} // jab bhi eye par click karunga, to mai redux store me
                      //state ke andar state.selectedTaskId=taks._id set kar dunga jisse Taskdetails me selectedTaskId true hoga
                      //aur uske andar fir us particular tasks ki logs fetch karke display kar di jayengi
                      title="View Task Audit Logs"
                      className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Retry Button (Only for Failed tasks) */}
                    {task.status === TaskStatus.FAILED && (
                      <button
                        onClick={() => handleRetry(task._id)}
                        title="Retry Failed Task"
                        className="rounded p-1.5 text-amber-400 transition hover:bg-amber-500/20"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(task._id)}
                      title="Delete Task"
                      className="rounded p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
