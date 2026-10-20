import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { MemoryCategory, MemoryItem } from '../types/omega.ts';

const CATEGORIES: { id: 'all' | MemoryCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'projects', label: 'Projects' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'saved_knowledge', label: 'Saved Knowledge' },
];

export const MemoryView: React.FC = () => {
  const { memories, addMemory, updateMemory, deleteMemory } = useOmega();
  const [activeCategory, setActiveCategory] = useState<'all' | MemoryCategory>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCat, setNewCat] = useState<MemoryCategory>('preferences');

  const filtered = memories
    .filter((m) => (activeCategory === 'all' ? true : m.category === activeCategory))
    .filter(
      (m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase())
    );

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    updateMemory(id, editTitle.trim(), editContent.trim());
    setEditingId(null);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addMemory({
      category: newCat,
      title: newTitle.trim(),
      content: newContent.trim() || 'Remembered context for future tasks.',
    });
    setNewTitle('');
    setNewContent('');
    setAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Memory</h1>
          <p className="text-meta mt-1">
            Personal knowledge, preferences, and context remembered by OMEGA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memory…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-44 sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Remember</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#101412] border border-white/[0.06] w-fit flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-[#1A211D] text-[#EEF2EF]'
                : 'text-[#9BA39D] hover:text-[#EEF2EF]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {adding && (
        <form
          onSubmit={handleAddMemory}
          className="rounded-2xl bg-[#101412] border border-white/[0.08] p-5 flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What should OMEGA remember? (e.g. Prefers dark UI)"
              className="w-full px-3 py-2 rounded-lg bg-[#151A17] border border-white/[0.07] text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50"
              autoFocus
            />
            <select
              aria-label="Memory category"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as MemoryCategory)}
              className="px-3 py-2 rounded-lg bg-[#151A17] border border-white/[0.07] text-xs text-[#EEF2EF] focus:outline-none"
            >
              <option value="personal">Personal</option>
              <option value="projects">Projects</option>
              <option value="preferences">Preferences</option>
              <option value="conversations">Conversations</option>
              <option value="saved_knowledge">Saved Knowledge</option>
            </select>
          </div>
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Additional context (optional)…"
            className="w-full px-3 py-2 rounded-lg bg-[#151A17] border border-white/[0.07] text-xs text-[#9BA39D] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="btn-primary !py-1.5 !px-3.5 !text-xs"
            >
              Save memory
            </button>
          </div>
        </form>
      )}

      {/* Clean List of Memories */}
      <div className="rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-[#EEF2EF]">No memories in this category</p>
            <p className="text-xs text-[#636B65]">
              Add a note or preference so OMEGA can tailor future work.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col gap-2">
              {editingId === item.id ? (
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#151A17] border border-white/[0.1] text-sm text-[#EEF2EF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#151A17] border border-white/[0.1] text-xs text-[#9BA39D] focus:outline-none"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="btn-primary !py-1 !px-3 !text-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-ghost !py-1 !px-2.5 !text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#EEF2EF]">{item.title}</h3>
                    <p className="text-xs text-[#9BA39D] mt-0.5">{item.content}</p>
                    <span className="text-[11px] text-[#636B65] mt-1 inline-block">
                      {item.relativeTime || `Saved ${item.dateAdded}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="btn-secondary !py-1 !px-2.5 !text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMemory(item.id)}
                      className="btn-ghost !py-1 !px-2.5 !text-xs hover:!text-[#F87171]"
                    >
                      Forget
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
