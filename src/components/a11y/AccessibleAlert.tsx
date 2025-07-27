'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface AccessibleAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Título do alerta
   */
  title?: React.ReactNode;
  
  /**
   * Descrição/conteúdo do alerta
   */
  children: React.ReactNode;
  
  /**
   * Variante do alerta (determina a cor)
   */
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  
  /**
   * Ícone a ser exibido no alerta
   */
  icon?: React.ReactNode;
  
  /**
   * Indica se o alerta deve ser anunciado para leitores de tela
   */
  announce?: boolean;
  
  /**
   * Política de anúncio para leitores de tela
   */
  liveRegion?: 'polite' | 'assertive' | 'off';
  
  /**
   * Classe para o título do alerta
   */
  titleClassName?: string;
  
  /**
   * Classe para a descrição do alerta
   */
  descriptionClassName?: string;
}

/**
 * Componente de alerta acessível que estende o Alert padrão
 * Adiciona role="alert" e suporte para anúncios em leitores de tela
 */
const AccessibleAlert = forwardRef<HTMLDivElement, AccessibleAlertProps>(
  ({
    title,
    children,
    variant = 'default',
    icon,
    announce = true,
    liveRegion = 'polite',
    className,
    titleClassName,
    descriptionClassName,
    ...props
  }, ref) => {
    // Referência para o elemento de anúncio para leitores de tela
    const announceRef = useRef<HTMLDivElement>(null);
    
    // Determinar as classes com base na variante
    const variantClasses = {
      default: '',
      destructive: 'bg-destructive/15 text-destructive border-destructive/30',
      success: 'bg-green-500/15 text-green-600 border-green-500/30',
      warning: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
      info: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    };
    
    // Efeito para anunciar o alerta para leitores de tela
    useEffect(() => {
      if (announce && announceRef.current) {
        // Simular uma atualização no conteúdo para forçar o anúncio
        const content = announceRef.current.textContent;
        announceRef.current.textContent = '';
        
        // Pequeno timeout para garantir que o leitor de tela perceba a mudança
        setTimeout(() => {
          if (announceRef.current) {
            announceRef.current.textContent = content;
          }
        }, 100);
      }
    }, [announce, title, children]);
    
    return (
      <Alert
        ref={ref}
        className={cn(
          variantClasses[variant],
          className
        )}
        role="alert"
        {...props}
      >
        {/* Ícone do alerta */}
        {icon && (
          <div className="mr-3 flex-shrink-0">
            {icon}
          </div>
        )}
        
        <div className="w-full">
          {/* Título do alerta */}
          {title && (
            <AlertTitle className={cn('font-medium', titleClassName)}>
              {title}
            </AlertTitle>
          )}
          
          {/* Descrição/conteúdo do alerta */}
          <AlertDescription className={descriptionClassName}>
            {children}
          </AlertDescription>
          
          {/* Elemento para anúncio em leitores de tela */}
          {announce && liveRegion !== 'off' && (
            <div
              ref={announceRef}
              className="sr-only"
              aria-live={liveRegion}
              aria-atomic="true"
            >
              {title && `${title}: `}{typeof children === 'string' ? children : 'Alerta importante'}
            </div>
          )}
        </div>
      </Alert>
    );
  }
);

AccessibleAlert.displayName = 'AccessibleAlert';

export { AccessibleAlert }; 