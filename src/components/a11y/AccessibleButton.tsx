'use client';

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps extends ButtonProps {
  /**
   * Texto descritivo adicional para leitores de tela
   * Útil quando o texto do botão não é suficientemente descritivo
   */
  ariaDescription?: string;
  
  /**
   * Indica se o botão controla um elemento expandível
   */
  ariaExpanded?: boolean;
  
  /**
   * ID do elemento que o botão controla (para aria-controls)
   */
  ariaControls?: string;
  
  /**
   * Indica se o botão está pressionado (para botões toggle)
   */
  ariaPressed?: boolean;
  
  /**
   * Classe para o estado de foco aprimorado
   */
  focusClassName?: string;
}

/**
 * Componente de botão acessível que estende o Button padrão
 * Adiciona suporte aprimorado para leitores de tela e navegação por teclado
 */
const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    children, 
    ariaDescription,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    focusClassName,
    ...props 
  }, ref) => {
    // Estado para controlar o foco via teclado
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);
    
    // Manipuladores de eventos para detectar foco via teclado vs mouse
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
      
      // Permitir ativação com espaço e enter
      if ((e.key === ' ' || e.key === 'Enter') && props.onClick) {
        e.preventDefault();
        props.onClick(e as any);
      }
      
      // Chamar o manipulador onKeyDown original se existir
      props.onKeyDown?.(e);
    };
    
    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };
    
    return (
      <Button
        ref={ref}
        className={cn(
          // Aplicar classe de foco visível quando navegando por teclado
          isFocusVisible && (focusClassName || 'ring-2 ring-offset-2 ring-primary'),
          className
        )}
        aria-describedby={ariaDescription ? `desc-${props.id || Math.random().toString(36).substring(2, 9)}` : undefined}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {children}
        
        {/* Descrição acessível apenas para leitores de tela */}
        {ariaDescription && (
          <span 
            id={`desc-${props.id || Math.random().toString(36).substring(2, 9)}`}
            className="sr-only"
          >
            {ariaDescription}
          </span>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton }; 