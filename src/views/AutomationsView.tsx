import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowDown,
  ArrowLeft,
  Play,
  Check,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { WorkflowNode } from '../types/omega.ts';
import { sounds } from '../services/soundEffects.ts';

interface AutomationItem {
  id: string;
  name: string;
  schedule: string;
  status: 'Active' | 'Paused';
  nodes: WorkflowNode[];
}

const INITIAL_AUTOMATIONS: AutomationItem[] = [
  {
    id: 'auto-morning',
    name: 'Morning setup',
    schedule: 'Every weekday · 9:00 AM',
    status: 'Active',
    nodes: [
      {
        id: 'n1',
        stepNumber: 1,
        type: 'trigger',
        subtitle: 'TRIGGER',
        name: 'Every weekday at 9:00 AM',
        status: 'settled',
        details: 'System clock schedule trigger',
      },
      {
        id: 'n2',
        stepNumber: 2,
        type: 'ai',
        subtitle: 'AI',
        name: 'Summarize unread messages & calendar',
        status: 'settled',
        details: 'Gemini Pro · Synthesizes daily priorities',
      },
      {
        id: 'n3',
        stepNumber: 3,
        type: 'condition',
        subtitle: 'CONDITION',
        name: 'If focus block is scheduled',
        status: 'settled',
        details: 'Checks calendar for deep-work blocks',
      },
      {
        id: 'n4',
        stepNumber: 4,
        type: 'action',
        subtitle: 'ACTION',
        name: 'Open VS Code & silence notifications',
        status: 'settled',
        details: 'Launches workspace and enables Do Not Disturb',
      },
    ],
  },
  {
    id: 'auto-downloads',
    name: 'Downloads organizer',
    schedule: 'When new file appears',
    status: 'Active',
    nodes: [
      {
        id: 'd1',
        stepNumber: 1,
        type: 'trigger',
        subtitle: 'TRIGGER',
        name: 'When new file appears in ~/Downloads',
        status: 'settled',
        details: 'Filesystem watcher hook',
      },
      {
        id: 'd2',
        stepNumber: 2,
        type: 'ai',
        subtitle: 'AI',
        name: 'Classify document category',
        status: 'settled',
        details: 'Determines Invoice, Report, Media, or Installer',
      },
      {
        id: 'd3',
        stepNumber: 3,
        type: 'condition',
        subtitle: 'CONDITION',
        name: 'Verify file is not currently downloading',
        status: 'settled',
        details: 'Checks file lock status',
      },
      {
        id: 'd4',
        stepNumber: 4,
        type: 'action',
        subtitle: 'ACTION',
        name: 'Move to organized destination folder',
        status: 'settled',
        details: 'Moves to ~/Documents or ~/Archives',
      },
    ],
  },
  {
    id: 'auto-backup',
    name: 'Evening project snapshot',
    schedule: 'Every weekday · 6:30 PM',
    status: 'Active',
    nodes: [
      {
        id: 'b1',
        stepNumber: 1,
        type: 'trigger',
        subtitle: 'TRIGGER',
        name: 'Every weekday at 6:30 PM',
        status: 'settled',
      },
      {
        id: 'b2',
        stepNumber: 2,
        type: 'ai',
        subtitle: 'AI',
        name: 'Draft daily changelog from git diff',
        status: 'settled',
      },
      {
        id: 'b3',
        stepNumber: 3,
        type: 'condition',
        subtitle: 'CONDITION',
        name: 'If uncommitted changes exist',
        status: 'settled',
      },
      {
        id: 'b4',
        stepNumber: 4,
        type: 'action',
        subtitle: 'ACTION',
        name: 'Save snapshot & summary to Memory',
        status: 'settled',
      },
    ],
  },
];

export const AutomationsView: React.FC = () => {
  const { logActivity } = useOmega();
  const [automations, setAutomations] = useState<AutomationItem[]>(INITIAL_AUTOMATIONS);
  const [search, setSearch] = useState('');
  const [builderMode, setBuilderMode] = useState(false);
  const [activeAutomation, setActiveAutomation] = useState<AutomationItem>(INITIAL_AUTOMATIONS[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n2');
  const [testRunning, setTestRunning] = useState(false);
  const [testDone, setTestDone] = useState(false);

  const filtered = automations.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.schedule.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick(760);
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' } : a
      )
    );
  };

  const handleOpenBuilder = (item?: AutomationItem) => {
    if (item) {
      setActiveAutomation(item);
      setSelectedNodeId(item.nodes[0]?.id || '');
    } else {
      const fresh: AutomationItem = {
        id: `auto-${Date.now()}`,
        name: 'Custom workflow',
        schedule: 'On demand or schedule',
        status: 'Active',
        nodes: [
          { id: 'c1', stepNumber: 1, type: 'trigger', subtitle: 'TRIGGER', name: 'When triggered by schedule or hotkey', status: 'settled' },
          { id: 'c2', stepNumber: 2, type: 'ai', subtitle: 'AI', name: 'Analyze current screen & active workspace', status: 'settled' },
          { id: 'c3', stepNumber: 3, type: 'condition', subtitle: 'CONDITION', name: 'Verify safe execution permissions', status: 'settled' },
          { id: 'c4', stepNumber: 4, type: 'action', subtitle: 'ACTION', name: 'Execute target system action', status: 'settled' },
        ],
      };
      setAutomations((prev) => [fresh, ...prev]);
      setActiveAutomation(fresh);
      setSelectedNodeId('c1');
    }
    setBuilderMode(true);
    setTestDone(false);
  };

  const handleRunWorkflowTest = () => {
    setTestRunning(true);
    setTestDone(false);
    sounds.playPulse();
    setTimeout(() => {
      setTestRunning(false);
      setTestDone(true);
      sounds.playSuccess();
      logActivity({
        type: 'orchestration',
        title: `Verified automation: ${activeAutomation.name}`,
        details: 'All 4 workflow nodes executed cleanly.',
        severity: 'success',
      });
    }, 900);
  };

  const selectedNode = activeAutomation.nodes.find((n) => n.id === selectedNodeId);

  // 17 — Dedicated Automation Builder Workspace
  if (builderMode) {
    return (
      <div className="max-w-5xl mx-auto w-full py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBuilderMode(false)}
              className="btn-ghost !py-1.5 !px-2.5 !text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Automations</span>
            </button>
            <span className="text-[#636B65]">/</span>
            <input
              type="text"
              value={activeAutomation.name}
              onChange={(e) => {
                const val = e.target.value;
                setActiveAutomation((prev) => ({ ...prev, name: val }));
                setAutomations((list) =>
                  list.map((a) => (a.id === activeAutomation.id ? { ...a, name: val } : a))
                );
              }}
              aria-label="Automation name"
              className="bg-transparent text-heading focus:outline-none border-b border-transparent focus:border-[#4ADE80]/50"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {testDone && (
              <span className="text-xs text-[#4ADE80] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            <button
              type="button"
              onClick={handleRunWorkflowTest}
              disabled={testRunning}
              className="btn-primary !py-1.5 !px-3.5 !text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testRunning ? 'Running…' : 'Test workflow'}</span>
            </button>
          </div>
        </div>

        {/* Large calm canvas + minimal node inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 rounded-2xl bg-[#0D110F] border border-white/[0.06] min-h-[480px] p-8 sm:p-12 flex flex-col items-center justify-center">
            {activeAutomation.nodes.map((node, idx) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <React.Fragment key={node.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full max-w-sm rounded-xl p-4 text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#151D18] border-[#4ADE80]/45 shadow-lg'
                        : 'bg-[#121714] border-white/[0.07] hover:border-white/[0.14]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase tracking-wider text-[#4ADE80]">
                      <span>{node.subtitle}</span>
                      <span className="text-[#636B65]">0{idx + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-[#EEF2EF] mt-1">{node.name}</p>
                  </button>

                  {idx < activeAutomation.nodes.length - 1 && (
                    <div className="py-2 flex flex-col items-center text-[#636B65]">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Minimal Node Step Editor */}
          <div className="lg:col-span-4 rounded-2xl bg-[#101412] border border-white/[0.06] p-5 flex flex-col gap-4">
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#636B65]">
              {selectedNode?.subtitle || 'STEP'} CONFIGURATION
            </span>
            {selectedNode && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9BA39D]">Step instruction</label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveAutomation((prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, name: val } : n
                        ),
                      }));
                    }}
                    className="px-3 py-2 rounded-lg bg-[#151A17] border border-white/[0.08] text-xs text-[#EEF2EF] focus:outline-none focus:border-[#4ADE80]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9BA39D]">Schedule / Trigger</label>
                  <input
                    type="text"
                    value={activeAutomation.schedule}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveAutomation((prev) => ({ ...prev, schedule: val }));
                      setAutomations((list) =>
                        list.map((a) =>
                          a.id === activeAutomation.id ? { ...a, schedule: val } : a
                        )
                      );
                    }}
                    className="px-3 py-2 rounded-lg bg-[#151A17] border border-white/[0.08] text-xs text-[#EEF2EF] focus:outline-none focus:border-[#4ADE80]/50"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 16 — Clean Automations List Page
  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Automations</h1>
          <p className="text-meta mt-1">
            Scheduled routines and event-driven workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search automations…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-48 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => handleOpenBuilder()}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create automation</span>
          </button>
        </div>
      </div>

      {/* Simple Clean List */}
      <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenBuilder(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleOpenBuilder(item);
            }}
            className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#EEF2EF] truncate">{item.name}</h3>
              <p className="text-xs text-[#9BA39D] mt-0.5">{item.schedule}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={(e) => toggleStatus(item.id, e)}
                className={`text-xs font-medium cursor-pointer ${
                  item.status === 'Active' ? 'text-[#4ADE80]' : 'text-[#636B65]'
                }`}
              >
                {item.status}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenBuilder(item);
                }}
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
