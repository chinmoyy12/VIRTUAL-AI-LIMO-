import React from 'react';
import { Monitor, Play, Square, Pause } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';

export const ComputerControlView: React.FC = () => {
  const {
    telemetry,
    controlledApps,
    isHalted,
    isPaused,
    togglePause,
    haltOmega,
    resumeOmega,
    dispatchGoal,
  } = useOmega();

  const metrics = [
    {
      label: 'CPU',
      value: `${telemetry.cpuLoad}%`,
      detail: '16 Cores · Apple Silicon / x64 Nominal',
      percent: telemetry.cpuLoad,
    },
    {
      label: 'GPU',
      value: `${telemetry.gpuLoad}%`,
      detail: `${telemetry.gpuVramUsedGB} / ${telemetry.gpuVramTotalGB} GB VRAM · ${telemetry.gpuTemp}°C`,
      percent: telemetry.gpuLoad,
    },
    {
      label: 'RAM',
      value: `${telemetry.ramUsage}%`,
      detail: `${telemetry.ramUsedGB} / ${telemetry.ramTotalGB} GB Unified Memory`,
      percent: telemetry.ramUsage,
    },
    {
      label: 'Storage',
      value: '40%',
      detail: `${telemetry.storageUsedGB || 412} GB / ${telemetry.storageTotalGB || 1024} GB NVMe`,
      percent: 40,
    },
    {
      label: 'Network',
      value: `${telemetry.netSpeedMbps} Gb/s`,
      detail: `Latency ${telemetry.latencyMs} ms · Encrypted local socket`,
      percent: 28,
    },
    {
      label: 'Battery',
      value: `${telemetry.batteryPercent || 94}%`,
      detail: telemetry.batteryCharging ? 'Charging · AC Power Connected' : 'On Battery Power',
      percent: telemetry.batteryPercent || 94,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">System</h1>
          <p className="text-meta mt-1">
            Hardware resources and connected desktop applications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isHalted ? (
            <button type="button" onClick={resumeOmega} className="btn-primary !py-1.5 !px-3 !text-xs">
              <Play className="w-3.5 h-3.5" />
              <span>Resume Control</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                type="button"
                onClick={haltOmega}
                className="btn-destructive !py-1.5 !px-3 !text-xs"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop OMEGA</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 20 — Clean Horizontal System Metrics (No gamer gauges or circular meters) */}
      <section className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 items-center gap-3 sm:gap-6"
          >
            <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-3">
              <span className="text-sm font-semibold text-[#EEF2EF] w-20">{m.label}</span>
              <span className="font-mono-tabular text-sm font-medium text-[#4ADE80]">
                {m.value}
              </span>
            </div>

            <div className="sm:col-span-5">
              <div className="w-full h-1.5 rounded-full bg-[#181F1B] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4ADE80] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(4, m.percent))}%` }}
                />
              </div>
            </div>

            <div className="sm:col-span-4 text-xs text-[#9BA39D] sm:text-right font-mono-tabular">
              {m.detail}
            </div>
          </div>
        ))}
      </section>

      {/* Connected Applications List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-heading">Connected Applications</h2>
          <span className="text-xs text-[#636B65]">Explicit authorization active</span>
        </div>

        <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
          {controlledApps.map((app) => (
            <div
              key={app.id}
              className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#151B18] border border-white/[0.05] flex items-center justify-center text-[#9BA39D] shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#EEF2EF] truncate">{app.name}</p>
                  <p className="text-xs text-[#636B65] truncate mt-0.5">{app.windowTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#9BA39D] hidden sm:inline">
                  {app.statusLabel}
                </span>
                <button
                  type="button"
                  onClick={() => dispatchGoal(`Focus ${app.name} window (${app.windowTitle})`)}
                  className="btn-secondary !py-1 !px-2.5 !text-xs"
                >
                  Focus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
