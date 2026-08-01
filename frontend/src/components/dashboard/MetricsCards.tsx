'use client';

import React from 'react';
import { TaskMetrics } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, Loader2, Layers } from 'lucide-react';

interface MetricsCardsProps {
  metrics?: TaskMetrics;
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, isLoading }) => {
  const cards = [
    {
      title: 'Total Tasks',
      value: metrics?.totalTasks ?? 0,
      icon: Layers,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Completed',
      value: metrics?.completedTasks ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Failed',
      value: metrics?.failedTasks ?? 0,
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    },
    {
      title: 'Pending Queue',
      value: metrics?.pendingTasks ?? 0,
      icon: Clock,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Processing Now',
      value: metrics?.processingTasks ?? 0,
      icon: Loader2,
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
      spin: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 backdrop-blur-md transition hover:scale-[1.02] ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <IconComponent className={`h-5 w-5 ${card.spin && card.value > 0 ? 'animate-spin' : ''}`} />
            </div>

            <div className="mt-3">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-800" />
              ) : (
                <span className="text-2xl font-bold text-white">{card.value}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
