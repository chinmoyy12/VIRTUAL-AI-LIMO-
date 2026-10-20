import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  Mic,
  CheckSquare,
  FolderKanban,
  Workflow,
  FileText,
  Sparkles,
  Brain,
  Cpu,
  Settings,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaModal } from './omega/OmegaTransitions.tsx';

export const CommandPaletteModal: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    dispatchGoal,
  } = useOmega();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    {
      id: 'nav-home',
      label: 'Go to Home Workspace',
      category: 'Navigation',
      icon: Home,
      run: () => setActiveView('home'),
    },
    {
      id: 'nav-talk',
      label: 'Open Talk Mode (Voice)',
      category: 'Navigation',
      icon: Mic,
      run: () => setActiveView('talk'),
    },
    {
      id: 'nav-tasks',
      label: 'Open Tasks & Plans',
      category: 'Navigation',
      icon: CheckSquare,
      run: () => setActiveView('tasks'),
    },
    {
      id: 'nav-projects',
      label: 'Open Projects',
      category: 'Navigation',
      icon: FolderKanban,
      run: () => setActiveView('projects'),
    },
    {
      id: 'nav-automations',
      label: 'Open Automations',
      category: 'Navigation',
      icon: Workflow,
      run: () => setActiveView('automations'),
    },
    {
      id: 'nav-files',
      label: 'Open Files',
      category: 'Navigation',
      icon: FileText,
      run: () => setActiveView('files'),
    },
    {
      id: 'nav-creative',
      label: 'Open Creative Studio',
      category: 'Navigation',
      icon: Sparkles,
      run: () => setActiveView('creative-studio'),
    },
    {
      id: 'nav-memory',
      label: 'Open Memory',
      category: 'Navigation',
      icon: Brain,
      run: () => setActiveView('memory'),
    },
    {
      id: 'nav-system',
      label: 'Open System Overview',
      category: 'Navigation',
      icon: Cpu,
      run: () => setActiveView('computer-control'),
    },
    {
      id: 'nav-settings',
      label: 'Open Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => setActiveView('preferences'),
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        setCommandPaletteOpen(false);
      } else if (query.trim()) {
        dispatchGoal(query.trim());
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <OmegaModal
      isOpen={commandPaletteOpen}
      onClose={() => setCommandPaletteOpen(false)}
      ariaLabel="OMEGA Command Palette"
      maxWidthClass="max-w-xl"
    >
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
        <Search className="w-4 h-4 text-[#4ADE80] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or ask OMEGA to run a goal…"
          className="w-full bg-transparent text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none"
        />
        <span className="text-[11px] font-mono-tabular text-[#636B65] px-1.5 py-0.5 rounded bg-white/[0.04]">
          ESC
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-0.5">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          const active = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => {
                item.run();
                setCommandPaletteOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                active ? 'bg-[#171F1A] text-[#EEF2EF]' : 'text-[#9BA39D] hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#4ADE80]' : 'text-[#636B65]'}`} />
                <span className="truncate font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-[#636B65]">{item.category}</span>
                {active && <CornerDownLeft className="w-3.5 h-3.5 text-[#4ADE80]" />}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && query.trim() && (
          <button
            type="button"
            onClick={() => {
              dispatchGoal(query.trim());
              setCommandPaletteOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-[#171F1A] text-xs text-[#EEF2EF] cursor-pointer"
          >
            <span>Run goal: “{query}”</span>
            <ArrowRight className="w-4 h-4 text-[#4ADE80]" />
          </button>
        )}
      </div>
    </OmegaModal>
  );
};
