import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';

export const ActivityView: React.FC = () => {
  const { activities } = useOmega();
  const [search, setSearch] = useState('');

  const filtered = activities.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Activity</h1>
          <p className="text-meta mt-1">
            Chronological log of completed actions, tool calls, and approvals.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter activity…"
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-48 sm:w-56"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#EEF2EF]">No matching activity</p>
            <p className="text-xs text-[#636B65] mt-1">Try clearing your search filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="px-4 sm:px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#EEF2EF] truncate">{item.title}</p>
                <p className="text-xs text-[#9BA39D] mt-0.5 truncate">{item.details}</p>
              </div>
              <span className="text-xs font-mono-tabular text-[#636B65] shrink-0">
                {item.timeStr}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
