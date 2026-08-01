'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { toggleCreateModal } from '../../store/uiSlice';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { X, Plus, AlertOctagon, Calendar, Clock, Zap, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { TaskPriority } from '../../types';

export const CreateTaskModal = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isCreateModalOpen } = useSelector((state: RootState) => state.ui);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulateError, setSimulateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock background body scroll when modal is open
  React.useEffect(() => {
    if (isCreateModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  // Preset Shortcuts (1-Click Delays) - Synchronized with Local Timezone!
  const setPresetInMinutes = (mins: number) => {
    const d = new Date(Date.now() + mins * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
  };

  const setPresetTomorrow9AM = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime('09:00');
  };

  const clearSchedule = () => {
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate PDF or Image
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setErrorMsg('Only PDF documents and Images are allowed!');
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let finalScheduledAt: string | undefined = undefined;
      if (scheduleDate && scheduleTime) {
        const [year, month, day] = scheduleDate.split('-').map(Number);
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        const scheduledObj = new Date(year, month - 1, day, hours, minutes, 0);
        finalScheduledAt = scheduledObj.toISOString();
      }

      // Send real FormData to Express backend (Express Multer + Cloudinary Stream Upload!)
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('priority', priority);
      if (finalScheduledAt) formData.append('scheduledAt', finalScheduledAt);
      formData.append('payload', JSON.stringify({ simulateError }));
      if (selectedFile) formData.append('file', selectedFile);

      await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Invalidate queries to trigger instant live refresh
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });

      // Reset form & close modal
      setTitle('');
      setDescription('');
      setPriority(TaskPriority.MEDIUM);
      setScheduleDate('');
      setScheduleTime('');
      setSelectedFile(null);
      setSimulateError(false);
      dispatch(toggleCreateModal(false));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Create & Queue New Task</h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleCreateModal(false))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(85vh-130px)]">
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

          {/* Real File Input Dropzone (PDF Documents / Images) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                <span>Attach Input File (PDF Document or Image)</span>
              </span>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Remove File
                </button>
              )}
            </label>

            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-3 transition ${
                  selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-400'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center space-x-2 text-xs">
                    {selectedFile.type === 'application/pdf' ? (
                      <FileText className="h-4 w-4 text-purple-400" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                    )}
                    <span className="font-semibold text-white">{selectedFile.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs">
                    <Paperclip className="h-4 w-4 text-blue-400" />
                    <span>Click to Browse & Upload File (PDF or Image)</span>
                  </div>
                )}
              </label>
            </div>
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

          {/* Schedule Execution Time (Interactive Visual Picker & Shortcuts) */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
                <Calendar className="h-3.5 w-3.5" />
                <span>Schedule Execution Time (Optional)</span>
              </label>
              {(scheduleDate || scheduleTime) && (
                <button
                  type="button"
                  onClick={clearSchedule}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                >
                  Clear Schedule
                </button>
              )}
            </div>

            {/* 1-Click Quick Presets */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => setPresetInMinutes(5)}
                className="flex items-center space-x-1 rounded bg-blue-500/10 border border-blue-500/30 px-2 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
              >
                <Zap className="h-3 w-3 text-amber-400" />
                <span>+5 Mins</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetInMinutes(60)}
                className="flex items-center space-x-1 rounded bg-blue-500/10 border border-blue-500/30 px-2 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
              >
                <Clock className="h-3 w-3 text-blue-400" />
                <span>+1 Hour</span>
              </button>
              <button
                type="button"
                onClick={setPresetTomorrow9AM}
                className="flex items-center space-x-1 rounded bg-blue-500/10 border border-blue-500/30 px-2 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
              >
                <Calendar className="h-3 w-3 text-purple-400" />
                <span>Tomorrow 9 AM</span>
              </button>
            </div>

            {/* Visual Date & Time Pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">Pick Date:</span>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">Pick Time:</span>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Scheduled Time Badge Preview */}
            {scheduleDate && scheduleTime && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                <span>
                  Will execute on:{' '}
                  <strong>
                    {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                  </strong>
                </span>
              </div>
            )}
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
