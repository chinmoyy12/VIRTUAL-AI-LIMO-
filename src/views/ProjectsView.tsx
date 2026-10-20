import React, { useState } from 'react';
import {
  FolderKanban,
  Code2,
  Globe,
  Terminal,
  Sparkles,
  Plus,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';

interface ProjectRow {
  id: string;
  name: string;
  path: string;
  status: 'Active' | 'Idle' | 'Archived';
  updated: string;
  type: 'code' | 'web' | 'system' | 'ai';
}

const INITIAL_PROJECTS: ProjectRow[] = [
  {
    id: 'proj-omega',
    name: 'OMEGA',
    path: '~/Projects/omega-os',
    status: 'Active',
    updated: 'Updated 5 min ago',
    type: 'ai',
  },
  {
    id: 'proj-portfolio',
    name: 'Personal Portfolio 2026',
    path: '~/Projects/portfolio-2026',
    status: 'Active',
    updated: 'Updated 18 min ago',
    type: 'web',
  },
  {
    id: 'proj-runtime',
    name: 'Local Inference Bridge',
    path: '~/Projects/inference-bridge',
    status: 'Idle',
    updated: 'Updated yesterday',
    type: 'system',
  },
  {
    id: 'proj-design',
    name: 'Desktop UI Kit',
    path: '~/Projects/desktop-ui-kit',
    status: 'Idle',
    updated: 'Updated 3 days ago',
    type: 'code',
  },
  {
    id: 'proj-docs',
    name: 'Q4 Systems Architecture Docs',
    path: '~/Documents/q4-architecture',
    status: 'Archived',
    updated: 'Updated Oct 10',
    type: 'web',
  },
];

export const ProjectsView: React.FC = () => {
  const { dispatchGoal } = useOmega();
  const [projects, setProjects] = useState<ProjectRow[]>(INITIAL_PROJECTS);
  const [search, setSearch] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const name = newProjectName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created: ProjectRow = {
      id: `proj-${Date.now()}`,
      name,
      path: `~/Projects/${slug}`,
      status: 'Active',
      updated: 'Updated just now',
      type: 'code',
    };
    setProjects((prev) => [created, ...prev]);
    setNewProjectName('');
    setCreating(false);
    dispatchGoal(`Initialize project "${name}" in ~/Projects/${slug}`);
  };

  const getIcon = (type: ProjectRow['type']) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="w-4 h-4 text-[#4ADE80]" />;
      case 'web':
        return <Globe className="w-4 h-4 text-[#9BA39D]" />;
      case 'system':
        return <Terminal className="w-4 h-4 text-[#9BA39D]" />;
      default:
        return <Code2 className="w-4 h-4 text-[#9BA39D]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Projects</h1>
          <p className="text-meta mt-1">
            Workspaces and repositories indexed by OMEGA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-48 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreating((c) => !c)}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New project</span>
          </button>
        </div>
      </div>

      {/* Inline New Project Form */}
      {creating && (
        <form
          onSubmit={handleCreateProject}
          className="rounded-xl bg-[#101412] border border-white/[0.08] p-4 flex flex-col sm:flex-row items-center gap-3"
        >
          <FolderKanban className="w-4 h-4 text-[#4ADE80] shrink-0 hidden sm:block" />
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name (e.g. NextGen Compiler)…"
            className="w-full bg-transparent text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="btn-primary !py-1.5 !px-3 !text-xs"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Compact Project Rows */}
      <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-[#EEF2EF]">No matching projects</p>
            <p className="text-xs text-[#636B65]">Try a different search term or create a new project.</p>
          </div>
        ) : (
          filtered.map((proj) => (
            <div
              key={proj.id}
              className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#151B18] border border-white/[0.05] flex items-center justify-center shrink-0">
                  {getIcon(proj.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-[#EEF2EF] truncate">
                      {proj.name}
                    </span>
                    <span className="text-xs text-[#636B65] font-mono-tabular hidden md:inline">
                      {proj.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9BA39D] mt-0.5">
                    <span
                      className={
                        proj.status === 'Active' ? 'text-[#4ADE80]' : 'text-[#9BA39D]'
                      }
                    >
                      {proj.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.updated}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    dispatchGoal(`Open project ${proj.name} (${proj.path}) in VS Code`)
                  }
                  className="btn-secondary !py-1.5 !px-3 !text-xs"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#9BA39D]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
