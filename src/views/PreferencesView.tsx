import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { AmbientQuality, AmbientState } from '../motion/omegaMotion.ts';

type SettingsSection =
  | 'General'
  | 'Appearance'
  | 'AI'
  | 'Voice'
  | 'Memory'
  | 'Permissions'
  | 'Security'
  | 'Notifications'
  | 'Shortcuts'
  | 'Developer';

const SECTIONS: SettingsSection[] = [
  'General',
  'Appearance',
  'AI',
  'Voice',
  'Memory',
  'Permissions',
  'Security',
  'Notifications',
  'Shortcuts',
  'Developer',
];

const QUALITY_MODES: AmbientQuality[] = ['HIGH', 'MEDIUM', 'LOW', 'REDUCED'];

const AMBIENT_STATES: AmbientState[] = [
  'IDLE',
  'LISTENING',
  'THINKING',
  'PLANNING',
  'EXECUTING',
  'VERIFYING',
  'SUCCESS',
  'ERROR',
  'PAUSED',
  'STOPPED',
];

export const PreferencesView: React.FC = () => {
  const {
    guardActive,
    toggleGuard,
    confirmFileWrites,
    toggleConfirmFileWrites,
    sidebarCollapsed,
    toggleSidebar,
    ambientQuality,
    setAmbientQuality,
    ambientState,
    overrideAmbientState,
    setOverrideAmbientState,
    setFirstRunOpen,
    devicePermissions,
    updateDevicePermissions,
    showToast,
  } = useOmega();

  const [activeSection, setActiveSection] = useState<SettingsSection>('General');
  const [defaultModel, setDefaultModel] = useState('Gemini 2.5 Pro');
  const [voiceSpeed, setVoiceSpeed] = useState('1.0x (Natural)');
  const [autoMemory, setAutoMemory] = useState(true);
  const [quietNotifications, setQuietNotifications] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const triggerSaveFeedback = (msg = 'Preferences updated') => {
    setSavedToast(true);
    showToast(msg, undefined, 'success');
    setTimeout(() => setSavedToast(false), 1800);
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Settings</h1>
          <p className="text-meta mt-1">
            Configure OMEGA behavior, ambient field quality, models, and permission boundaries.
          </p>
        </div>

        {savedToast && (
          <span className="text-xs text-[#4ADE80] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Preferences updated
          </span>
        )}
      </div>

      {/* 21 — Two-Column Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Categories */}
        <nav
          aria-label="Settings Categories"
          className="md:col-span-3 rounded-2xl bg-[#101412]/90 border border-white/[0.06] p-2 flex md:flex-col gap-0.5 overflow-x-auto"
        >
          {SECTIONS.map((sec) => {
            const active = activeSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#18201B] text-[#EEF2EF]'
                    : 'text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.03]'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </nav>

        {/* Right Column: Settings Content */}
        <div className="md:col-span-9 rounded-2xl bg-[#101412]/90 border border-white/[0.06] p-6 flex flex-col gap-6">
          <div className="border-b border-white/[0.06] pb-4">
            <h2 className="text-heading">{activeSection}</h2>
          </div>

          {activeSection === 'General' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Operator Name</p>
                  <p className="text-xs text-[#636B65]">Used in workspace greetings and logs</p>
                </div>
                <span className="text-sm text-[#EEF2EF] font-medium">Chinmoy</span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Launch OMEGA at login</p>
                  <p className="text-xs text-[#636B65]">Keep background orchestrator ready</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerSaveFeedback('Startup preference saved')}
                  className="btn-secondary !py-1.5 !px-3 !text-xs text-[#4ADE80]"
                >
                  Enabled
                </button>
              </div>
            </div>
          )}

          {activeSection === 'Appearance' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Theme</p>
                  <p className="text-xs text-[#636B65]">Dark-first high-contrast charcoal canvas</p>
                </div>
                <span className="text-xs text-[#4ADE80] font-medium">OMEGA Dark (Active)</span>
              </div>

              {/* 36 — Ambient Field Performance Quality Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Ambient Field Quality</p>
                  <p className="text-xs text-[#636B65]">
                    Adjust reactive background particle density and motion fidelity
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUALITY_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAmbientQuality(mode);
                        triggerSaveFeedback(`Ambient quality set to ${mode}`);
                      }}
                      className={
                        ambientQuality === mode
                          ? 'btn-primary !py-1 !px-2.5 !text-xs'
                          : 'btn-secondary !py-1 !px-2.5 !text-xs'
                      }
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* 05 — Interactive Ambient State Preview */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#EEF2EF]">
                      Ambient Field State Calibration
                    </p>
                    <p className="text-xs text-[#636B65]">
                      Preview how OMEGA’s background field reacts to each operating state
                    </p>
                  </div>
                  {overrideAmbientState && (
                    <button
                      type="button"
                      onClick={() => setOverrideAmbientState(null)}
                      className="text-xs text-[#4ADE80] hover:underline cursor-pointer"
                    >
                      Reset to Automatic
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {AMBIENT_STATES.map((st) => {
                    const isCurrent = ambientState === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOverrideAmbientState(st)}
                        className={
                          isCurrent
                            ? 'btn-primary !py-1 !px-2.5 !text-[11px] font-mono-tabular'
                            : 'btn-secondary !py-1 !px-2.5 !text-[11px] font-mono-tabular'
                        }
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Compact Sidebar</p>
                  <p className="text-xs text-[#636B65]">Collapse left navigation to icon-only view</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'AI' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Primary Reasoning Model</p>
                  <p className="text-xs text-[#636B65]">
                    Used for task planning and multi-step orchestration
                  </p>
                </div>
                <select
                  aria-label="Primary Reasoning Model"
                  value={defaultModel}
                  onChange={(e) => {
                    setDefaultModel(e.target.value);
                    triggerSaveFeedback(`Model switched to ${e.target.value}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#151A17] border border-white/[0.08] text-xs text-[#EEF2EF]"
                >
                  <option>Gemini 2.5 Pro</option>
                  <option>Gemini 2.5 Flash</option>
                  <option>Local Llama-3 70B (Offline Fallback)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Offline Local Fallback</p>
                  <p className="text-xs text-[#636B65]">
                    Automatically switch to local model if offline
                  </p>
                </div>
                <span className="text-xs text-[#4ADE80]">Active</span>
              </div>
            </div>
          )}

          {activeSection === 'Voice' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Speech Cadence</p>
                  <p className="text-xs text-[#636B65]">Response pacing in Talk Mode</p>
                </div>
                <select
                  aria-label="Speech Cadence"
                  value={voiceSpeed}
                  onChange={(e) => {
                    setVoiceSpeed(e.target.value);
                    triggerSaveFeedback(`Voice cadence set to ${e.target.value}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#151A17] border border-white/[0.08] text-xs text-[#EEF2EF]"
                >
                  <option>1.0x (Natural)</option>
                  <option>1.15x (Crisp)</option>
                  <option>0.9x (Calm)</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'Memory' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Automatic Context Indexing</p>
                  <p className="text-xs text-[#636B65]">
                    Remember approved project paths and UI preferences
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAutoMemory((m) => !m);
                    triggerSaveFeedback();
                  }}
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  {autoMemory ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {(activeSection === 'Permissions' || activeSection === 'Security') && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Permission Boundary Guard</p>
                  <p className="text-xs text-[#636B65]">
                    Require explicit confirmation before sensitive actions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleGuard();
                    triggerSaveFeedback();
                  }}
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  {guardActive ? 'Active (Recommended)' : 'Bypassed'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">
                    Confirm File Deletions & Writes
                  </p>
                  <p className="text-xs text-[#636B65]">
                    Prompt before modifying or removing local files
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleConfirmFileWrites();
                    triggerSaveFeedback();
                  }}
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  {confirmFileWrites ? 'Always Ask' : 'Auto-Approve'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">
                    Device & OS Capability Setup
                  </p>
                  <p className="text-xs text-[#636B65]">
                    Review microphone, filesystem, screen control, and notification permissions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFirstRunOpen(true)}
                  className="btn-primary !py-1.5 !px-3 !text-xs"
                >
                  Configure Permissions
                </button>
              </div>

              <div className="pt-4 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: 'microphone', label: 'Microphone & Voice' },
                    { key: 'filesystem', label: 'Workspace Filesystem' },
                    { key: 'screenAndApps', label: 'Screen & App Control' },
                    { key: 'notifications', label: 'System Notifications' },
                  ] as const
                ).map((perm) => {
                  const enabled = devicePermissions[perm.key];
                  return (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() => {
                        updateDevicePermissions({
                          ...devicePermissions,
                          [perm.key]: !enabled,
                        });
                        triggerSaveFeedback(`${perm.label} ${!enabled ? 'enabled' : 'disabled'}`);
                      }}
                      className="p-3 rounded-xl bg-[#141916] border border-white/[0.06] flex items-center justify-between text-left hover:border-white/[0.12] transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#EEF2EF]">{perm.label}</span>
                      <span
                        className={`text-[11px] font-mono-tabular ${
                          enabled ? 'text-[#4ADE80]' : 'text-[#636B65]'
                        }`}
                      >
                        {enabled ? 'Allowed' : 'Off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">Calm Notification Mode</p>
                  <p className="text-xs text-[#636B65]">
                    Only notify on task completion or permission requests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuietNotifications((q) => !q);
                    triggerSaveFeedback();
                  }}
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  {quietNotifications ? 'Enabled' : 'All Events'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'Shortcuts' && (
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {[
                { label: 'Open Command Bar / Palette', keys: 'Cmd + K' },
                { label: 'Toggle Talk Mode', keys: 'Cmd + Shift + V' },
                { label: 'Emergency Stop OMEGA', keys: 'Esc / Cmd + .' },
              ].map((s) => (
                <div key={s.label} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-[#EEF2EF]">{s.label}</span>
                  <span className="font-mono-tabular text-xs text-[#9BA39D] px-2.5 py-1 rounded bg-[#151A17] border border-white/[0.06]">
                    {s.keys}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'Developer' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#EEF2EF]">
                    Schema Validation & Tool Audit
                  </p>
                  <p className="text-xs text-[#636B65]">
                    Enforce strict JSON input/output validation on all tool calls
                  </p>
                </div>
                <span className="text-xs font-mono-tabular text-[#4ADE80]">STRICT</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
