import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Bell, Square, Play, SlidersHorizontal } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaView } from '../types/omega.ts';
import { OmegaStateIndicator } from './omega/OmegaTransitions.tsx';
import { MOTION_TOKENS } from '../motion/omegaMotion.ts';

const VIEW_LABELS: Record<OmegaView, string> = {
  home: 'Home',
  talk: 'Talk',
  tasks: 'Tasks',
  projects: 'Projects',
  automations: 'Automations',
  files: 'Files',
  'creative-studio': 'Creative Studio',
  memory: 'Memory',
  activity: 'Activity',
  'tools-and-apis': 'Tools',
  'computer-control': 'System',
  preferences: 'Settings',
};

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    sidebarCollapsed,
    activePlan,
    isHalted,
    isPaused,
    haltOmega,
    resumeOmega,
    setMobileNavOpen,
    activities,
  } = useOmega();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isWorking =
    Boolean(activePlan) &&
    (activePlan.state === 'executing' ||
      activePlan.state === 'planning' ||
      activePlan.state === 'verifying') &&
    !isHalted &&
    !isPaused;

  return (
    <header
      className={`fixed top-0 right-0 left-0 ${
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-56'
      } h-14 bg-[#0A0D0B]/75 backdrop-blur-xl border-b border-white/[0.06] z-30 px-4 sm:px-6 flex items-center justify-between gap-4 transition-[left] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]`}
    >
      {/* Left: Current workspace/page */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.04] cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span
          className="text-[15px] font-semibold text-[#EEF2EF] tracking-tight whitespace-nowrap"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {VIEW_LABELS[activeView] || 'Home'}
        </span>
      </div>

      {/* Right: Persistent Non-Intrusive OMEGA Status Indicator, Stop/Resume, Notifications, Settings */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        <OmegaStateIndicator />

        {isWorking ? (
          <button
            type="button"
            onClick={haltOmega}
            title="Emergency Stop OMEGA"
            className="btn-destructive !py-1 !px-2.5 !text-xs"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Stop OMEGA</span>
          </button>
        ) : isHalted ? (
          <button
            type="button"
            onClick={resumeOmega}
            className="btn-secondary !py-1 !px-2.5 !text-xs text-[#4ADE80]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Resume</span>
          </button>
        ) : null}

        <div className="h-4 w-px bg-white/[0.06] hidden sm:block" />

        {/* Notifications button */}
        <button
          type="button"
          onClick={() => setNotificationsOpen((prev) => !prev)}
          aria-label="Notifications"
          title="Recent system notifications"
          className="p-2 rounded-lg text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.04] transition-colors cursor-pointer relative"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={MOTION_TOKENS.fast}
              className="absolute right-0 top-12 w-80 rounded-xl glass-panel p-3 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-[#EEF2EF]">Notifications</span>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setActiveView('activity');
                  }}
                  className="text-xs text-[#4ADE80] hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-xs text-[#636B65] py-3 text-center">No recent notifications</p>
                ) : (
                  activities.slice(0, 4).map((act) => (
                    <div key={act.id} className="p-2 rounded-lg bg-[#141916]/90 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#EEF2EF] truncate">{act.title}</span>
                        <span className="text-[11px] text-[#636B65] shrink-0">{act.timeStr}</span>
                      </div>
                      <p className="text-xs text-[#9BA39D] mt-0.5 line-clamp-1">{act.details}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile / Settings button */}
        <button
          type="button"
          onClick={() => setActiveView('preferences')}
          aria-label="Open Settings"
          title="Settings & Preferences"
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-[#141916]/90 hover:bg-[#1A201D] border border-white/[0.06] text-xs font-medium text-[#EEF2EF] transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] flex items-center justify-center text-[11px] font-semibold">
            C
          </span>
          <span className="hidden sm:inline">Chinmoy</span>
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#636B65]" />
        </button>
      </div>
    </header>
  );
};
