'use client';

import React, { useState } from 'react';
import { 
  AccessibleButton, 
  AccessibleInput, 
  AccessibleAlert,
  AccessibleCard
} from '@/components/a11y';

export default function Page() {
  const [showAlert, setShowAlert] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Acessibilidade (Task 23)</h1>
      <p className="mb-6">Esta página demonstra os componentes acessíveis implementados na Task 23.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Seção de botões acessíveis */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Botões Acessíveis</h2>
          <div className="space-y-4">
            <AccessibleButton 
              ariaDescription="Este botão exibe um alerta informativo"
              onClick={() => setShowAlert(true)}
            >
              Mostrar Alerta
            </AccessibleButton>
            
            <AccessibleButton 
              variant="outline"
              ariaDescription="Este botão tem uma descrição acessível para leitores de tela"
            >
              Botão com ARIA
            </AccessibleButton>
            
            <AccessibleButton 
              variant="secondary"
              ariaPressed={true}
              ariaDescription="Este botão demonstra o estado pressionado"
            >
              Botão Pressionado
            </AccessibleButton>
          </div>
        </div>
        
        {/* Seção de inputs acessíveis */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Campos de Texto Acessíveis</h2>
          <div className="space-y-4">
            <AccessibleInput
              label="Nome completo"
              placeholder="Digite seu nome"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helpText="Este campo tem instruções acessíveis"
            />
            
            <AccessibleInput
              label="Email"
              type="email"
              placeholder="exemplo@email.com"
              hasError={inputValue.length > 0 && !inputValue.includes('@')}
              errorMessage="Email inválido. Deve conter @."
              required
            />
          </div>
        </div>
      </div>
      
      {/* Alertas acessíveis */}
      {showAlert && (
        <div className="mt-6">
          <AccessibleAlert
            title="Alerta Acessível"
            onClose={() => setShowAlert(false)}
          >
            Este é um alerta acessível que pode ser lido por leitores de tela.
          </AccessibleAlert>
        </div>
      )}
      
      {/* Cards acessíveis */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AccessibleCard
          title="Card Acessível"
          interactive
          ariaLabel="Card com informações sobre acessibilidade"
          onClick={() => alert('Card clicado!')}
        >
          <p>Este card pode ser navegado por teclado e ativado com Enter ou Espaço.</p>
        </AccessibleCard>
        
        <AccessibleCard
          title="Card Informativo"
          ariaLabel="Card com dicas de acessibilidade"
        >
          <p>Este card tem atributos ARIA para melhor suporte a leitores de tela.</p>
        </AccessibleCard>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-medium text-blue-700 mb-2">Recursos de Acessibilidade Implementados</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-600">
          <li>Navegação completa por teclado (Tab, Enter, Espaço)</li>
          <li>Atributos ARIA para leitores de tela</li>
          <li>Mensagens de erro acessíveis</li>
          <li>Foco visual aprimorado</li>
          <li>Contraste de cores adequado (WCAG AA)</li>
          <li>Estrutura semântica correta</li>
        </ul>
      </div>
    </div>
  );
} 