'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { toggleCreateModal } from '../../store/uiSlice';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { X, Plus, AlertOctagon } from 'lucide-react';
import { TaskPriority } from '../../types';

export const CreateTaskModal = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isCreateModalOpen } = useSelector((state: RootState) => state.ui);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [simulateError, setSimulateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        priority,
        payload: { simulateError },
      });

      // Invalidate queries to trigger instant live refresh
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });

      // Reset form & close modal
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setSimulateError(false);
      dispatch(toggleCreateModal(false));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Create & Queue New Task</h2>
          </div>
          <button
            onClick={() => dispatch(toggleCreateModal(false))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Generate Monthly Financial PDF"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide job details or payload specs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Priority Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={TaskPriority.LOW}>LOW</option>
              <option value={TaskPriority.MEDIUM}>MEDIUM</option>
              <option value={TaskPriority.HIGH}>HIGH</option>
              <option value={TaskPriority.URGENT}>URGENT</option>
            </select>
          </div>

          {/* Simulate Worker Error Checkbox (For Testing Retries!) */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-bold text-amber-400 flex items-center space-x-1">
                  <AlertOctagon className="h-3.5 w-3.5 inline mr-1" />
                  Simulate Worker Error (For Retry Demo)
                </span>
                <p className="text-slate-400">
                  Forces worker to fail 3 times and test exponential backoff retries.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => dispatch(toggleCreateModal(false))}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Queueing...' : 'Queue Task Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
