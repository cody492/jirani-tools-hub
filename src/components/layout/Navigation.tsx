import React from 'react';
import { Search, Clock, Sliders, Layers } from 'lucide-react';
import { NavTab } from '../../types';
import { AdminPanelIcon } from '../icons/AdminPanelIcon';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  historyCount: number;
  showAdminTab?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  historyCount,
  showAdminTab = false,
}) => {
  const tabs = [
    {
      id: 'investigation' as NavTab,
      label: 'Investigation',
      icon: Search,
      badge: null,
      status: 'Active',
    },
    {
      id: 'history' as NavTab,
      label: 'Session History',
      icon: Clock,
      badge: historyCount > 0 ? historyCount.toString() : null,
      status: 'Ready',
    },
    {
      id: 'settings' as NavTab,
      label: 'Engine Architecture',
      icon: Sliders,
      badge: null,
      status: 'Roadmap',
    },
    ...(showAdminTab
      ? [
          {
            id: 'admin' as NavTab,
            label: 'Admin Panel',
            icon: AdminPanelIcon,
            badge: 'ROOT',
            status: 'Restricted',
          },
        ]
      : []),
  ];

  return (
    <nav className="border-b border-[#1b212f] bg-[#0f121a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                type="button"
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono tracking-wider uppercase rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#181d2a] text-cyan-300 border border-[#263147] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                        : 'bg-[#1a202c] text-slate-400 border border-[#252d3d]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
