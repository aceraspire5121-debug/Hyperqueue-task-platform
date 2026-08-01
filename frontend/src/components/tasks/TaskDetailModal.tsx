'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setSelectedTaskId } from '../../store/uiSlice';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TaskLog, TaskStatus } from '../../types';
import { X, History, Clock, CheckCircle2, AlertTriangle, Loader2, RefreshCcw, ExternalLink, Paperclip, FileText } from 'lucide-react';

export const TaskDetailModal = () => {
  const dispatch = useDispatch();
  const { selectedTaskId } = useSelector((state: RootState) => state.ui);

  const { data: logs, isLoading } = useQuery<TaskLog[]>({
    queryKey: ['task_logs', selectedTaskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${selectedTaskId}/logs`);
      return res.data.data;
    },
    enabled: !!selectedTaskId,
  });

  // Lock background body scroll when modal is open
  React.useEffect(() => {
    if (selectedTaskId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedTaskId]);

  if (!selectedTaskId) return null;

  const renderStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case TaskStatus.FAILED:
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case TaskStatus.PROCESSING:
        return <RefreshCcw className="h-4 w-4 text-purple-400" />;
      default:
        return <Clock className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Task Execution History & Audit Logs</h2>
          </div>
          <button
            onClick={() => dispatch(setSelectedTaskId(null))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
              <p className="mt-2 text-xs text-slate-400">Loading audit history logs...</p>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="relative border-l border-slate-800 ml-4 space-y-6">
              {logs.map((log) => (
                <div key={log._id} className="relative pl-6">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-2.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                    {renderStatusIcon(log.status)}
                  </div>

                  {/* Log Content */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{log.message}</p>
                    {log.metadata && (
                      <pre className="mt-2 rounded bg-slate-950 p-2 text-[10px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-8">
              No audit logs recorded for this task yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 text-right">
          <button
            onClick={() => dispatch(setSelectedTaskId(null))}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
