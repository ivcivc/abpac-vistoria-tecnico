'use client';

import React, { forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AccessibleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Título do card
   */
  title?: React.ReactNode;
  
  /**
   * Descrição do card
   */
  description?: React.ReactNode;
  
  /**
   * Conteúdo do card
   */
  children?: React.ReactNode;
  
  /**
   * Conteúdo do rodapé do card
   */
  footer?: React.ReactNode;
  
  /**
   * Indica se o card é interativo (clicável)
   */
  interactive?: boolean;
  
  /**
   * Função chamada quando o card é clicado (se interactive=true)
   */
  onClick?: () => void;
  
  /**
   * Classe para o título do card
   */
  titleClassName?: string;
  
  /**
   * Classe para a descrição do card
   */
  descriptionClassName?: string;
  
  /**
   * Classe para o conteúdo do card
   */
  contentClassName?: string;
  
  /**
   * Classe para o rodapé do card
   */
  footerClassName?: string;
  
  /**
   * Role ARIA para o card
   */
  role?: string;
}

/**
 * Componente de card acessível que estende o Card padrão
 * Adiciona estrutura semântica correta e suporte para leitores de tela
 */
const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  ({
    title,
    description,
    children,
    footer,
    interactive,
    onClick,
    className,
    titleClassName,
    descriptionClassName,
    contentClassName,
    footerClassName,
    role,
    ...props
  }, ref) => {
    // Determinar o role apropriado baseado nas props
    const cardRole = role || (interactive ? 'button' : 'region');
    
    // Manipulador de clique para cards interativos
    const handleClick = () => {
      if (interactive && onClick) {
        onClick();
      }
    };
    
    // Manipulador de teclado para cards interativos
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
      
      // Chamar o manipulador onKeyDown original se existir
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };
    
    return (
      <Card
        ref={ref}
        className={cn(
          interactive && 'cursor-pointer hover:shadow-md transition-shadow',
          className
        )}
        role={cardRole}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        aria-label={interactive && typeof title === 'string' ? title : undefined}
        {...props}
      >
        {/* Cabeçalho do card com título e descrição */}
        {(title || description) && (
          <CardHeader>
            {title && (
              <CardTitle className={titleClassName}>
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className={descriptionClassName}>
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        
        {/* Conteúdo principal do card */}
        {children && (
          <CardContent className={contentClassName}>
            {children}
          </CardContent>
        )}
        
        {/* Rodapé do card */}
        {footer && (
          <CardFooter className={footerClassName}>
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';

export { AccessibleCard }; 