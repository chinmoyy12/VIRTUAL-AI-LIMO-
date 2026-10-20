import React, { useState } from 'react';
import {
  ShieldCheck,
  Mic,
  FolderOpen,
  Monitor,
  Bell,
  Check,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaModal } from './omega/OmegaTransitions.tsx';
import { OmegaButton } from './omega/OmegaButton.tsx';
import { OmegaCore } from './omega/OmegaCore.tsx';

export const FirstRunModal: React.FC = () => {
  const {
    firstRunOpen,
    setFirstRunOpen,
    devicePermissions,
    updateDevicePermissions,
    logActivity,
    showToast,
  } = useOmega();

  const [localPerms, setLocalPerms] = useState(devicePermissions);
  const [requestingHardware, setRequestingHardware] = useState(false);

  const togglePerm = (key: keyof typeof localPerms) => {
    setLocalPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGrantAndConnect = async () => {
    setRequestingHardware(true);

    // Attempt non-blocking browser permission checks where supported on iOS/Android/Desktop
    try {
      if (
        localPerms.notifications &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        await Promise.race([
          Notification.requestPermission().catch(() => 'default'),
          new Promise((r) => setTimeout(r, 400)),
        ]);
      }
    } catch {
      // Ignore in sandboxed iframe environments
    }

    updateDevicePermissions(localPerms);
    try {
      localStorage.setItem('omega_permissions_onboarded', 'true');
    } catch {}

    const enabledCount = Object.values(localPerms).filter(Boolean).length;
    logActivity({
      type: 'security',
      title: 'Device & OS permissions connected',
      details: `${enabledCount}/4 capability pipelines authorized across voice, filesystem, system control, and notifications.`,
      severity: 'success',
    });
    showToast(
      'OMEGA Connected & Ready',
      `${enabledCount} permission pipelines active across this device.`,
      'success'
    );
    setRequestingHardware(false);
    setFirstRunOpen(false);
  };

  const handleSkipDefaults = () => {
    try {
      localStorage.setItem('omega_permissions_onboarded', 'true');
    } catch {}
    setFirstRunOpen(false);
    showToast('Using safe defaults', 'You can adjust permissions anytime in Settings.', 'info');
  };

  const permissionItems: Array<{
    key: keyof typeof localPerms;
    title: string;
    description: string;
    scope: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      key: 'microphone',
      title: 'Microphone & Neural Voice',
      description: 'Real-time voice commands, Talk Mode listening, and spoken responses.',
      scope: 'voice:stt · voice:tts',
      icon: Mic,
    },
    {
      key: 'filesystem',
      title: 'Workspace & Filesystem Sandbox',
      description: 'Read, organize, and generate documents in ~/Projects and ~/Documents.',
      scope: 'fs:read · fs:write',
      icon: FolderOpen,
    },
    {
      key: 'screenAndApps',
      title: 'Screen & Application Control',
      description: 'Inspect active windows, capture context frames, and run multi-step tasks.',
      scope: 'apps:launch · vision:analyze',
      icon: Monitor,
    },
    {
      key: 'notifications',
      title: 'Notifications & Background Sync',
      description: 'Non-intrusive task completion alerts and scheduled workflow triggers.',
      scope: 'system:telemetry · alerts',
      icon: Bell,
    },
  ];

  return (
    <OmegaModal
      isOpen={firstRunOpen}
      onClose={handleSkipDefaults}
      ariaLabel="OMEGA Device Permissions Setup"
      maxWidthClass="max-w-lg"
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <OmegaCore size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#4ADE80] whitespace-nowrap">
                  SYSTEM INITIALIZATION
                </span>
                <span className="text-[#636B65]">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#9BA39D] whitespace-nowrap">
                  <Laptop className="w-3 h-3" />
                  <Smartphone className="w-3 h-3" />
                  Adaptive OS
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#EEF2EF] tracking-tight mt-0.5">
                Connect OMEGA Permissions
              </h2>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#4ADE80]/10 border border-[#4ADE80]/25 text-[11px] font-mono-tabular text-[#4ADE80] whitespace-nowrap shrink-0">
            Safe Sandbox
          </span>
        </div>

        <p className="text-xs text-[#9BA39D] leading-relaxed">
          Review and authorize the device capabilities OMEGA can use to plan, execute, and verify tasks across desktop, iPad, iPhone, and Android. High-risk actions always ask for confirmation first.
        </p>

        {/* Permission Toggles */}
        <div className="rounded-xl bg-[#0D120F] border border-white/[0.06] divide-y divide-white/[0.05]">
          {permissionItems.map((item) => {
            const Icon = item.icon;
            const enabled = localPerms[item.key];
            return (
              <div
                key={item.key}
                onClick={() => togglePerm(item.key)}
                role="switch"
                aria-checked={enabled}
                aria-label={item.title}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePerm(item.key);
                  }
                }}
                className="p-3.5 flex items-center justify-between gap-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      enabled
                        ? 'bg-[#4ADE80]/12 border-[#4ADE80]/30 text-[#4ADE80]'
                        : 'bg-[#141916] border-white/[0.06] text-[#636B65]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#EEF2EF] block">
                      {item.title}
                    </span>
                    <p className="text-[11px] text-[#9BA39D] mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors flex items-center gap-1 ${
                    enabled
                      ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30'
                      : 'bg-white/[0.04] text-[#636B65] border border-white/[0.06]'
                  }`}
                >
                  {enabled && <Check className="w-3 h-3" />}
                  {enabled ? 'Allowed' : 'Off'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <OmegaButton variant="ghost" onClick={handleSkipDefaults} className="!text-xs">
            Continue with Safe Defaults
          </OmegaButton>

          <OmegaButton
            variant="primary"
            onClick={handleGrantAndConnect}
            disabled={requestingHardware}
            className="!text-xs !py-2 !px-4"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {requestingHardware ? 'Connecting Pipelines...' : 'Grant Permissions & Connect'}
            </span>
          </OmegaButton>
        </div>
      </div>
    </OmegaModal>
  );
};
