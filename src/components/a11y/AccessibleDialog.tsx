'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { cn } from '@/lib/utils';
import { AccessibleButton } from './AccessibleButton';
import { X } from 'lucide-react';

export interface AccessibleDialogProps {
  /**
   * Título do diálogo
   */
  title: React.ReactNode;
  
  /**
   * Conteúdo do diálogo
   */
  children: React.ReactNode;
  
  /**
   * Indica se o diálogo está aberto
   */
  isOpen: boolean;
  
  /**
   * Função chamada quando o diálogo é fechado
   */
  onClose: () => void;
  
  /**
   * Conteúdo do rodapé do diálogo (botões de ação)
   */
  footer?: React.ReactNode;
  
  /**
   * Largura máxima do diálogo
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  
  /**
   * Indica se o diálogo deve fechar ao clicar fora dele
   */
  closeOnOutsideClick?: boolean;
  
  /**
   * Indica se o diálogo deve fechar ao pressionar a tecla Escape
   */
  closeOnEscape?: boolean;
  
  /**
   * Indica se o botão de fechar deve ser exibido
   */
  showCloseButton?: boolean;
  
  /**
   * ID único para o diálogo (usado para acessibilidade)
   */
  id?: string;
  
  /**
   * Descrição do diálogo para leitores de tela
   */
  description?: string;
  
  /**
   * Classe para o overlay do diálogo
   */
  overlayClassName?: string;
  
  /**
   * Classe para o container do diálogo
   */
  containerClassName?: string;
  
  /**
   * Classe para o cabeçalho do diálogo
   */
  headerClassName?: string;
  
  /**
   * Classe para o conteúdo do diálogo
   */
  contentClassName?: string;
  
  /**
   * Classe para o rodapé do diálogo
   */
  footerClassName?: string;
}

/**
 * Componente de diálogo acessível com trap de foco e suporte para navegação por teclado
 */
const AccessibleDialog = forwardRef<HTMLDivElement, AccessibleDialogProps>(
  ({
    title,
    children,
    isOpen,
    onClose,
    footer,
    maxWidth = 'md',
    closeOnOutsideClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    id,
    description,
    overlayClassName,
    containerClassName,
    headerClassName,
    contentClassName,
    footerClassName,
  }, ref) => {
    // Gerar ID único se não fornecido
    const dialogId = id || `dialog-${Math.random().toString(36).substring(2, 9)}`;
    const descriptionId = `${dialogId}-description`;
    const titleId = `${dialogId}-title`;
    
    // Estado para controlar a animação de entrada/saída
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Mapear maxWidth para classes do Tailwind
    const maxWidthClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      full: 'max-w-full',
    };
    
    // Efeito para lidar com a tecla Escape
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isOpen && closeOnEscape && e.key === 'Escape') {
          onClose();
        }
      };
      
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        // Bloquear o scroll do body quando o diálogo estiver aberto
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restaurar o scroll do body quando o diálogo for fechado
        document.body.style.overflow = '';
      };
    }, [isOpen, closeOnEscape, onClose]);
    
    // Efeito para controlar a animação
    useEffect(() => {
      if (isOpen) {
        setIsAnimating(true);
      } else {
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 200); // Duração da animação de saída
        
        return () => clearTimeout(timer);
      }
    }, [isOpen]);
    
    // Manipulador de clique no overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOutsideClick && e.target === e.currentTarget) {
        onClose();
      }
    };
    
    // Não renderizar nada se o diálogo estiver fechado e não estiver animando
    if (!isOpen && !isAnimating) {
      return null;
    }
    
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0',
          overlayClassName
        )}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      >
        <FocusTrap
          active={isOpen}
          focusTrapOptions={{
            allowOutsideClick: true,
            returnFocusOnDeactivate: true,
          }}
        >
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
              'bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full',
              'transform transition-all',
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
              maxWidthClasses[maxWidth],
              containerClassName
            )}
          >
            {/* Cabeçalho do diálogo */}
            <div className={cn(
              'flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700',
              headerClassName
            )}>
              <h2 id={titleId} className="text-lg font-medium">
                {title}
              </h2>
              
              {showCloseButton && (
                <AccessibleButton
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  ariaDescription="Fechar diálogo"
                  className="rounded-full h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </AccessibleButton>
              )}
            </div>
            
            {/* Descrição para leitores de tela */}
            {description && (
              <div id={descriptionId} className="sr-only">
                {description}
              </div>
            )}
            
            {/* Conteúdo do diálogo */}
            <div className={cn('p-4', contentClassName)}>
              {children}
            </div>
            
            {/* Rodapé do diálogo com botões de ação */}
            {footer && (
              <div className={cn(
                'p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2',
                footerClassName
              )}>
                {footer}
              </div>
            )}
          </div>
        </FocusTrap>
      </div>
    );
  }
);

AccessibleDialog.displayName = 'AccessibleDialog';

export { AccessibleDialog }; 