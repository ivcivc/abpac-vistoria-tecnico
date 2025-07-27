'use client';

import React, { forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface AccessibleInputProps extends InputProps {
  /**
   * Texto do label associado ao input
   */
  label: string;
  
  /**
   * ID único para o input (usado para associar o label)
   * Se não fornecido, um ID aleatório será gerado
   */
  id?: string;
  
  /**
   * Mensagem de erro para exibir quando o input é inválido
   */
  errorMessage?: string;
  
  /**
   * Texto de ajuda adicional para o input
   */
  helpText?: string;
  
  /**
   * Indica se o input é obrigatório
   */
  required?: boolean;
  
  /**
   * Indica se o input está em estado de erro
   */
  hasError?: boolean;
  
  /**
   * Classe para o container do input
   */
  containerClassName?: string;
  
  /**
   * Classe para o label
   */
  labelClassName?: string;
  
  /**
   * Classe para a mensagem de erro
   */
  errorClassName?: string;
  
  /**
   * Classe para o texto de ajuda
   */
  helpTextClassName?: string;
}

/**
 * Componente de input acessível que estende o Input padrão
 * Adiciona label associado, mensagens de erro acessíveis e suporte para screen readers
 */
const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    id,
    errorMessage,
    helpText,
    required,
    hasError,
    containerClassName,
    labelClassName,
    errorClassName,
    helpTextClassName,
    className,
    ...props
  }, ref) => {
    // Gerar ID único se não fornecido
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    // ID para o texto de ajuda e mensagem de erro
    const helpTextId = `help-${inputId}`;
    const errorId = `error-${inputId}`;
    
    // Determinar se devemos mostrar mensagem de erro
    const showError = hasError && errorMessage;
    
    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label
          htmlFor={inputId}
          className={cn(
            showError && 'text-destructive',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            showError && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            [
              helpText ? helpTextId : null,
              showError ? errorId : null
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-required={required}
          required={required}
          {...props}
        />
        
        {/* Texto de ajuda */}
        {helpText && (
          <p
            id={helpTextId}
            className={cn(
              'text-sm text-muted-foreground',
              helpTextClassName
            )}
          >
            {helpText}
          </p>
        )}
        
        {/* Mensagem de erro */}
        {showError && (
          <p
            id={errorId}
            className={cn(
              'text-sm font-medium text-destructive',
              errorClassName
            )}
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export { AccessibleInput }; 