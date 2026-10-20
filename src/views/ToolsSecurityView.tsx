import React, { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';

export const ToolsSecurityView: React.FC = () => {
  const { tools, toggleToolEnabled, toggleToolConfirmation } = useOmega();
  const [search, setSearch] = useState('');

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Tools</h1>
          <p className="text-meta mt-1">
            Capabilities and permission rules for OMEGA tool execution.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-48 sm:w-56"
          />
        </div>
      </div>

      {/* Clean List of Tools & Permissions */}
      <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {filtered.map((tool) => (
          <div
            key={tool.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-[#EEF2EF]">{tool.name}</h3>
                <span className="text-xs text-[#636B65]">·</span>
                <span
                  className={`text-xs ${
                    tool.riskLevel === 'high'
                      ? 'text-[#F87171]'
                      : tool.riskLevel === 'medium'
                      ? 'text-[#FBBF24]'
                      : 'text-[#9BA39D]'
                  }`}
                >
                  {tool.riskLevel} risk
                </span>
              </div>
              <p className="text-xs text-[#9BA39D] mt-1">{tool.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => toggleToolConfirmation(tool.id)}
                className="btn-secondary !py-1 !px-2.5 !text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>{tool.requiresConfirmation ? 'Ask permission' : 'Auto-allow'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleToolEnabled(tool.id)}
                className={`btn-ghost !py-1 !px-2.5 !text-xs ${
                  tool.enabled ? 'text-[#4ADE80]' : 'text-[#636B65]'
                }`}
              >
                {tool.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
