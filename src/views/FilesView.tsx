import React, { useState } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  Search,
  ArrowUpDown,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { FileItem } from '../types/omega.ts';

const FOLDERS: FileItem['folder'][] = [
  'Home',
  'Desktop',
  'Documents',
  'Downloads',
  'Projects',
];

export const FilesView: React.FC = () => {
  const {
    files,
    selectedFile,
    selectFile,
    deleteFile,
    addFile,
    requestPermission,
    logActivity,
  } = useOmega();

  const [activeFolder, setActiveFolder] = useState<'All' | FileItem['folder']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'code' | 'doc'>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [newFileModal, setNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const filteredFiles = files
    .filter((f) => (activeFolder === 'All' ? true : f.folder === activeFolder))
    .filter((f) => (typeFilter === 'all' ? true : f.type === typeFilter))
    .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const isPdf = name.endsWith('.pdf');
    const isCode = name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.json');
    addFile({
      name,
      folder: activeFolder === 'All' ? 'Documents' : activeFolder,
      type: isPdf ? 'pdf' : isCode ? 'code' : 'doc',
      size: '12 KB',
      modified: 'Just now',
      pages: isPdf ? 4 : undefined,
      summary: `Newly created document "${name}" indexed by OMEGA in ${
        activeFolder === 'All' ? 'Documents' : activeFolder
      }.`,
    });
    setNewFileName('');
    setNewFileModal(false);
  };

  const handleDeleteWithPermission = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    requestPermission(
      `Delete file "${file.name}"`,
      `This will permanently remove ${file.name} (${file.size}) from ${file.folder}.`,
      'high',
      () => {
        deleteFile(file.id);
        logActivity({
          type: 'security',
          title: `Deleted ${file.name}`,
          details: `Approved by user and removed from ${file.folder}`,
          severity: 'warning',
        });
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-6 flex flex-col gap-6">
      {/* Top Bar: Title + Search, Sort, Filter, New */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Files</h1>
          <p className="text-meta mt-1">
            Select any file to inspect or ask OMEGA in the context panel.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#636B65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#101412] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50 w-44 sm:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortAsc((s) => !s)}
            className="btn-secondary !py-1.5 !px-2.5 !text-xs"
            title="Sort by name"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort</span>
          </button>

          <select
            aria-label="Filter file type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'pdf' | 'code' | 'doc')}
            className="px-2.5 py-1.5 rounded-lg bg-[#151A17] border border-white/[0.07] text-xs text-[#EEF2EF] focus:outline-none cursor-pointer"
          >
            <option value="all">Filter: All</option>
            <option value="pdf">PDF</option>
            <option value="code">Code</option>
            <option value="doc">Documents</option>
          </select>

          <button
            type="button"
            onClick={() => setNewFileModal((v) => !v)}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {newFileModal && (
        <form
          onSubmit={handleCreateFile}
          className="rounded-xl bg-[#101412] border border-white/[0.08] p-4 flex items-center gap-3"
        >
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name (e.g. Q1_Strategy_Notes.pdf)…"
            className="w-full bg-transparent text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setNewFileModal(false)}
            className="btn-ghost !py-1.5 !px-3 !text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newFileName.trim()}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            Create
          </button>
        </form>
      )}

      {/* Professional File Manager Layout: Folder Sidebar + File List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Folder Sidebar */}
        <nav
          aria-label="File Folders"
          className="md:col-span-3 rounded-2xl bg-[#101412] border border-white/[0.06] p-2 flex md:flex-col gap-1 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveFolder('All')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFolder === 'All'
                ? 'bg-[#18201B] text-[#EEF2EF]'
                : 'text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.03]'
            }`}
          >
            <Folder className={`w-4 h-4 ${activeFolder === 'All' ? 'text-[#4ADE80]' : 'text-[#636B65]'}`} />
            <span>All Files</span>
          </button>

          {FOLDERS.map((folder) => {
            const active = activeFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#18201B] text-[#EEF2EF]'
                    : 'text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.03]'
                }`}
              >
                <Folder className={`w-4 h-4 ${active ? 'text-[#4ADE80]' : 'text-[#636B65]'}`} />
                <span>{folder}</span>
              </button>
            );
          })}
        </nav>

        {/* Main Files & Folders List */}
        <div className="md:col-span-9 rounded-2xl bg-[#101412] border border-white/[0.06] divide-y divide-white/[0.05]">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-[#EEF2EF]">No files in this view</p>
              <p className="text-xs text-[#636B65]">Select another folder or create a new file.</p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => selectFile(file)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') selectFile(file);
                  }}
                  className={`px-4 py-3.5 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#151E18]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#151B18] border border-white/[0.05] flex items-center justify-center shrink-0">
                      {file.type === 'code' ? (
                        <FileCode className="w-4 h-4 text-[#4ADE80]" />
                      ) : (
                        <FileText
                          className={`w-4 h-4 ${
                            file.type === 'pdf' ? 'text-[#4ADE80]' : 'text-[#9BA39D]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#EEF2EF] truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#9BA39D] mt-0.5">
                        <span>{file.folder}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{file.size}</span>
                        {file.pages && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{file.pages} pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#636B65] font-mono-tabular hidden sm:inline mr-2">
                      {file.modified}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFile(file);
                      }}
                      className="btn-secondary !py-1 !px-2.5 !text-xs"
                    >
                      <Sparkles className="w-3 h-3 text-[#4ADE80]" />
                      <span>Ask OMEGA</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteWithPermission(file, e)}
                      aria-label={`Delete ${file.name}`}
                      title="Delete file (requires permission)"
                      className="p-1.5 rounded-lg text-[#636B65] hover:text-[#F87171] hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
