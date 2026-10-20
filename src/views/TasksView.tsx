import React, { useState } from 'react';
import { Plus, RotateCcw, AlertCircle, CheckCircle2, Clock, Play } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { TaskPlan } from '../types/omega.ts';

type TaskSection = 'all' | 'active' | 'scheduled' | 'completed' | 'failed';

export const TasksView: React.FC = () => {
  const {
    taskHistory,
    dispatchGoal,
    retryTask,
    openContextPanel,
    setActiveView,
  } = useOmega();

  const [filter, setFilter] = useState<TaskSection>('all');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    dispatchGoal(newTaskInput.trim());
    setNewTaskInput('');
  };

  const categorize = (task: TaskPlan): Exclude<TaskSection, 'all'> => {
    if (task.state === 'executing' || task.state === 'paused' || task.state === 'planning') {
      return 'active';
    }
    if (task.state === 'idle' && task.scheduledFor) {
      return 'scheduled';
    }
    if (task.state === 'failed' || task.state === 'stopped') {
      return 'failed';
    }
    return 'completed';
  };

  const filteredTasks = taskHistory.filter((t) =>
    filter === 'all' ? true : categorize(t) === filter
  );

  const renderProgressDots = (task: TaskPlan) => {
    return (
      <div className="flex items-center gap-1" aria-label="Step progress">
        {task.steps.map((s) => (
          <span
            key={s.id}
            className={`w-1.5 h-1.5 rounded-full ${
              s.status === 'completed'
                ? 'bg-[#4ADE80]'
                : s.status === 'active'
                ? 'bg-[#4ADE80] animate-pulse'
                : s.status === 'failed'
                ? 'bg-[#F87171]'
                : 'bg-white/[0.14]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      {/* Header & Quick Task Dispatch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Tasks</h1>
          <p className="text-meta mt-1">
            Active executions, scheduled runs, and completed workflows.
          </p>
        </div>

        <form onSubmit={handleCreateTask} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="New task for OMEGA…"
            className="w-full px-3.5 py-2 rounded-lg bg-[#101412] border border-white/[0.08] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50"
          />
          <button type="submit" disabled={!newTaskInput.trim()} className="btn-primary !py-2 !px-3">
            <Plus className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </form>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#101412] border border-white/[0.06] w-fit flex-wrap">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'completed', label: 'Completed' },
            { id: 'failed', label: 'Failed' },
          ] as { id: TaskSection; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? 'bg-[#1A211D] text-[#EEF2EF]'
                : 'text-[#9BA39D] hover:text-[#EEF2EF]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List or Intentional Empty State (Section 31) */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#101412] border border-white/[0.06] p-12 text-center flex flex-col items-center gap-3">
          <h3 className="text-heading">No {filter === 'all' ? '' : filter} tasks</h3>
          <p className="text-meta max-w-sm">
            Your workspace is clear. What should we work on?
          </p>
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="btn-primary mt-2"
          >
            Ask OMEGA
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
          {filteredTasks.map((task) => {
            const cat = categorize(task);
            const completedCount = task.steps.filter((s) => s.status === 'completed').length;

            return (
              <div key={task.id} className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1 shrink-0">
                      {cat === 'active' ? (
                        <Play className="w-4 h-4 text-[#4ADE80]" />
                      ) : cat === 'scheduled' ? (
                        <Clock className="w-4 h-4 text-[#9BA39D]" />
                      ) : cat === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-[#F87171]" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#EEF2EF] truncate">
                        {task.goal}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#9BA39D] mt-1 flex-wrap">
                        <span
                          className={
                            cat === 'active'
                              ? 'text-[#4ADE80]'
                              : cat === 'failed'
                              ? 'text-[#F87171]'
                              : 'text-[#9BA39D]'
                          }
                        >
                          {cat === 'active'
                            ? 'Running'
                            : cat === 'scheduled'
                            ? task.scheduledFor || 'Scheduled'
                            : cat === 'failed'
                            ? 'Failed'
                            : 'Completed'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {completedCount}/{task.steps.length} steps
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                    {renderProgressDots(task)}
                    <button
                      type="button"
                      onClick={() => openContextPanel({ type: 'task', plan: task })}
                      className="btn-secondary !py-1.5 !px-3 !text-xs"
                    >
                      Open
                    </button>
                  </div>
                </div>

                {/* 32 — Clean Error State for Failed Tasks */}
                {cat === 'failed' && (
                  <div className="ml-7 p-3.5 rounded-xl bg-[#161213] border border-[#F87171]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#EEF2EF]">
                        OMEGA couldn’t complete that.
                      </p>
                      <p className="text-xs text-[#9BA39D] mt-0.5">
                        {task.errorMessage || 'Target application wasn’t available.'}
                      </p>
                      {expandedErrorId === task.id && (
                        <p className="text-[11px] font-mono-tabular text-[#636B65] mt-2">
                          Trace {task.traceId} · Fallback browser sandbox available.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => retryTask(task.id)}
                        className="btn-primary !py-1 !px-2.5 !text-xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => retryTask(task.id)}
                        className="btn-secondary !py-1 !px-2.5 !text-xs"
                      >
                        Try another way
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedErrorId((curr) => (curr === task.id ? null : task.id))
                        }
                        className="btn-ghost !py-1 !px-2 !text-xs"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
