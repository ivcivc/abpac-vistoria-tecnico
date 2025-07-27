'use client';

import React, { forwardRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  /**
   * ID único da aba
   */
  id: string;
  
  /**
   * Título/rótulo da aba
   */
  label: React.ReactNode;
  
  /**
   * Conteúdo da aba
   */
  content: React.ReactNode;
  
  /**
   * Indica se a aba está desabilitada
   */
  disabled?: boolean;
  
  /**
   * Ícone opcional para a aba
   */
  icon?: React.ReactNode;
}

export interface AccessibleTabsProps {
  /**
   * Lista de abas a serem exibidas
   */
  tabs: TabItem[];
  
  /**
   * ID da aba selecionada inicialmente
   */
  defaultTabId?: string;
  
  /**
   * Orientação das abas (horizontal ou vertical)
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Função chamada quando uma aba é selecionada
   */
  onTabChange?: (tabId: string) => void;
  
  /**
   * Classe para o container das abas
   */
  className?: string;
  
  /**
   * Classe para a lista de abas
   */
  tabListClassName?: string;
  
  /**
   * Classe para cada aba
   */
  tabClassName?: string;
  
  /**
   * Classe para a aba ativa
   */
  activeTabClassName?: string;
  
  /**
   * Classe para o painel de conteúdo
   */
  panelClassName?: string;
  
  /**
   * ID único para o componente (usado para acessibilidade)
   */
  id?: string;
}

/**
 * Componente de abas acessível com suporte para navegação por teclado
 * e roles ARIA apropriados
 */
const AccessibleTabs = forwardRef<HTMLDivElement, AccessibleTabsProps>(
  ({
    tabs,
    defaultTabId,
    orientation = 'horizontal',
    onTabChange,
    className,
    tabListClassName,
    tabClassName,
    activeTabClassName,
    panelClassName,
    id,
  }, ref) => {
    // Gerar ID único se não fornecido
    const tabsId = id || `tabs-${Math.random().toString(36).substring(2, 9)}`;
    
    // Estado para controlar a aba ativa
    const [activeTabId, setActiveTabId] = useState<string>(
      defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
    );
    
    // Encontrar o índice da aba ativa
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTabId);
    
    // Manipulador para selecionar uma aba
    const selectTab = useCallback((tabId: string) => {
      if (tabs.find(tab => tab.id === tabId && !tab.disabled)) {
        setActiveTabId(tabId);
        onTabChange?.(tabId);
      }
    }, [tabs, onTabChange]);
    
    // Manipulador para navegação por teclado
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const tabsCount = tabs.length;
      const nonDisabledTabs = tabs.filter(tab => !tab.disabled);
      const currentIndex = nonDisabledTabs.findIndex(tab => tab.id === activeTabId);
      
      if (orientation === 'horizontal') {
        // Navegação horizontal (esquerda/direita)
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % nonDisabledTabs.length;
          selectTab(nonDisabledTabs[nextIndex].id);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + nonDisabledTabs.length) % nonDisabledTabs.length;
          selectTab(nonDisabledTabs[prevIndex].id);
        }
      } else {
        // Navegação vertical (cima/baixo)
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % nonDisabledTabs.length;
          selectTab(nonDisabledTabs[nextIndex].id);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + nonDisabledTabs.length) % nonDisabledTabs.length;
          selectTab(nonDisabledTabs[prevIndex].id);
        }
      }
      
      // Navegação para a primeira/última aba
      if (e.key === 'Home') {
        e.preventDefault();
        selectTab(nonDisabledTabs[0].id);
      } else if (e.key === 'End') {
        e.preventDefault();
        selectTab(nonDisabledTabs[nonDisabledTabs.length - 1].id);
      }
    }, [tabs, activeTabId, orientation, selectTab]);
    
    // Renderizar o conteúdo da aba ativa
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    
    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          className
        )}
      >
        {/* Lista de abas */}
        <div
          role="tablist"
          aria-orientation={orientation}
          className={cn(
            'flex',
            orientation === 'horizontal' 
              ? 'flex-row border-b border-slate-200 dark:border-slate-700' 
              : 'flex-col border-r border-slate-200 dark:border-slate-700',
            tabListClassName
          )}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const tabId = `${tabsId}-tab-${tab.id}`;
            const panelId = `${tabsId}-panel-${tab.id}`;
            
            return (
              <button
                key={tab.id}
                id={tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={tab.disabled}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  'flex items-center px-4 py-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
                  orientation === 'horizontal'
                    ? 'border-b-2 -mb-px'
                    : 'border-r-2 -mr-px',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300',
                  tab.disabled && 'opacity-50 cursor-not-allowed',
                  tabClassName,
                  isActive && activeTabClassName
                )}
                onClick={() => !tab.disabled && selectTab(tab.id)}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Painel de conteúdo da aba ativa */}
        {activeTab && (
          <div
            id={`${tabsId}-panel-${activeTab.id}`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${activeTab.id}`}
            tabIndex={0}
            className={cn(
              'p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
              panelClassName
            )}
          >
            {activeTab.content}
          </div>
        )}
      </div>
    );
  }
);

AccessibleTabs.displayName = 'AccessibleTabs';

export { AccessibleTabs }; 