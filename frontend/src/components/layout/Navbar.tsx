'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { toggleCreateModal } from '../../store/uiSlice';
import { Activity, LogOut, Plus, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth); // kaunsa user logged in hai uski details mang raha hai state.auth se

  const handleLogout = () => {
    dispatch(logout()); //ye kah raha hai redux store me ki user ko logged out, isauthenticated false kardo usne logout kr lia
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">HyperQueue Engine</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
              Task Automation & Job Engine
            </span>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center space-x-4">
          {/* Create Task Button */}
          <button
            onClick={() => dispatch(toggleCreateModal(true))} // ye redux store me info bhej raha hai ki toggleCreateModal true kardo user ne createtask par click kar dia hai
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>

          {/* User Profile Badge */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">
              {user.role === 'ADMIN' ? (
                <ShieldCheck className="h-4 w-4 text-amber-400" />
              ) : (
                <UserIcon className="h-4 w-4 text-blue-400" />
              )}
              <span className="font-semibold text-white">{user.name}</span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                {user.role}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
