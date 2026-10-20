import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Mic,
  CheckSquare,
  FolderKanban,
  Workflow,
  FileText,
  Sparkles,
  Brain,
  Activity,
  Wrench,
  Cpu,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaView } from '../types/omega.ts';
import { MOTION_SPRINGS } from '../motion/omegaMotion.ts';

interface NavItem {
  id: OmegaView;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'talk', label: 'Talk', icon: Mic },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'automations', label: 'Automations', icon: Workflow },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'creative-studio', label: 'Creative', icon: Sparkles },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'tools-and-apis', label: 'Tools', icon: Wrench },
  { id: 'computer-control', label: 'System', icon: Cpu },
  { id: 'preferences', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    sidebarCollapsed,
    toggleSidebar,
    mobileNavOpen,
    setMobileNavOpen,
    activePlan,
  } = useOmega();

  const runningCount =
    activePlan &&
    (activePlan.state === 'executing' ||
      activePlan.state === 'planning' ||
      activePlan.state === 'verifying')
      ? 1
      : 0;

  const handleSelect = (id: OmegaView) => {
    setActiveView(id);
    setMobileNavOpen(false);
  };

  return (
    <>
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        aria-label="Sidebar Navigation"
        className={`fixed left-0 top-0 bottom-0 z-50 bg-[#0D110F]/85 backdrop-blur-xl border-r border-white/[0.06] flex flex-col justify-between transition-[width,transform] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand + Primary Nav */}
        <div className="flex flex-col">
          <div
            className={`h-14 flex items-center border-b border-white/[0.05] ${
              sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
            }`}
          >
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => handleSelect('home')}
                className="text-sm font-semibold tracking-wider text-[#EEF2EF] hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                <span>OMEGA</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-md text-[#636B65] hover:text-[#EEF2EF] hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="p-2 flex flex-col gap-0.5" aria-label="Primary Navigation">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative group flex items-center ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-lg text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-[#EEF2EF]'
                      : 'text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.03]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="omega-sidebar-active"
                      transition={MOTION_SPRINGS.snappy}
                      className="absolute inset-0 rounded-lg bg-[#161D19] border border-white/[0.05] -z-10"
                    />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#4ADE80]' : 'text-[#636B65] group-hover:text-[#9BA39D]'
                      }`}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>

                  {!sidebarCollapsed && item.id === 'tasks' && runningCount > 0 && (
                    <span className="text-[11px] font-mono-tabular text-[#4ADE80]">
                      {runningCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="p-2 border-t border-white/[0.05] flex flex-col gap-0.5">
          <nav aria-label="Secondary Navigation" className="flex flex-col gap-0.5">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative group flex items-center ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'
                  } rounded-lg text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-[#EEF2EF]'
                      : 'text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.03]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="omega-sidebar-active"
                      transition={MOTION_SPRINGS.snappy}
                      className="absolute inset-0 rounded-lg bg-[#161D19] border border-white/[0.05] -z-10"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#4ADE80]' : 'text-[#636B65] group-hover:text-[#9BA39D]'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
