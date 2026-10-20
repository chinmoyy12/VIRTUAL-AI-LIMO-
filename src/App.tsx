import React from 'react';
import { OmegaProvider, useOmega } from './context/OmegaContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { CommandBar } from './components/CommandBar.tsx';
import { ContextPanel } from './components/ContextPanel.tsx';
import { CommandPaletteModal } from './components/CommandPaletteModal.tsx';
import { PermissionModal } from './components/PermissionModal.tsx';
import { FirstRunModal } from './components/FirstRunModal.tsx';
import { OmegaAmbientField } from './components/omega/OmegaAmbientField.tsx';
import { OmegaPageTransition, OmegaToast } from './components/omega/OmegaTransitions.tsx';

// Views
import { HomeView } from './views/HomeView.tsx';
import { TalkView } from './views/TalkView.tsx';
import { TasksView } from './views/TasksView.tsx';
import { ProjectsView } from './views/ProjectsView.tsx';
import { AutomationsView } from './views/AutomationsView.tsx';
import { FilesView } from './views/FilesView.tsx';
import { CreativeStudioView } from './views/CreativeStudioView.tsx';
import { MemoryView } from './views/MemoryView.tsx';
import { ActivityView } from './views/ActivityView.tsx';
import { ToolsSecurityView } from './views/ToolsSecurityView.tsx';
import { ComputerControlView } from './views/ComputerControlView.tsx';
import { PreferencesView } from './views/PreferencesView.tsx';

const AppContent: React.FC = () => {
  const { activeView, sidebarCollapsed } = useOmega();

  return (
    <div className="bg-[#0A0D0B] text-[#EEF2EF] min-h-screen flex flex-col relative selection:bg-[#4ADE80]/20 selection:text-[#4ADE80]">
      {/* 02 & 03 — Reactive Ambient Field Background Layer */}
      <OmegaAmbientField />

      {/* Compact Collapsible Left Navigation */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div
        className={`relative z-10 flex flex-col min-h-screen transition-[padding] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'
        }`}
      >
        {/* Minimal Top Bar */}
        <Header />

        {/* Workspace + Contextual Right Panel */}
        <div className="flex-1 flex flex-col lg:flex-row pt-14 min-h-[calc(100vh-3.5rem)]">
          <main className="flex-1 px-4 sm:px-8 pb-24 overflow-x-hidden">
            <OmegaPageTransition viewKey={activeView}>
              {activeView === 'home' && <HomeView />}
              {activeView === 'talk' && <TalkView />}
              {activeView === 'tasks' && <TasksView />}
              {activeView === 'projects' && <ProjectsView />}
              {activeView === 'automations' && <AutomationsView />}
              {activeView === 'files' && <FilesView />}
              {activeView === 'creative-studio' && <CreativeStudioView />}
              {activeView === 'memory' && <MemoryView />}
              {activeView === 'activity' && <ActivityView />}
              {activeView === 'tools-and-apis' && <ToolsSecurityView />}
              {activeView === 'computer-control' && <ComputerControlView />}
              {activeView === 'preferences' && <PreferencesView />}
            </OmegaPageTransition>
          </main>

          {/* Dynamic Contextual Right Panel (Hidden unless needed) */}
          <ContextPanel />
        </div>

        {/* Contextual Command Bar (Shown on inner workspaces) */}
        <CommandBar />
      </div>

      {/* Smooth Modals & Non-Intrusive Toast */}
      <FirstRunModal />
      <CommandPaletteModal />
      <PermissionModal />
      <OmegaToast />
    </div>
  );
};

export default function App() {
  return (
    <OmegaProvider>
      <AppContent />
    </OmegaProvider>
  );
}
