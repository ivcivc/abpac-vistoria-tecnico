'use client';

/**
 * Formulário Mobile de Despesas - Task 5.1
 * Otimizado para técnicos em campo com tipos pré-definidos e interface touch-friendly
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Fuel, 
  Utensils, 
  Car, 
  MapPin, 
  Receipt, 
  DollarSign,
  Calendar,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { MobileComprovanteUpload, ComprovanteFile } from './MobileComprovanteUpload';

export interface DespesaFormData {
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  vistoriaId: string;
  comprovantes: ComprovanteFile[];
}

interface MobileDespesaFormProps {
  vistoriaId: string;
  onSave: (despesa: DespesaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<DespesaFormData>;
}

// Tipos de despesas pré-definidos para técnicos
const TIPOS_DESPESA = [
  { 
    id: 'combustivel', 
    label: 'Combustível', 
    icon: Fuel, 
    color: 'bg-blue-500', 
    description: 'Gasolina, diesel, álcool'
  },
  { 
    id: 'alimentacao', 
    label: 'Alimentação', 
    icon: Utensils, 
    color: 'bg-orange-500', 
    description: 'Refeições, lanches'
  },
  { 
    id: 'pedagio', 
    label: 'Pedágio', 
    icon: Car, 
    color: 'bg-green-500', 
    description: 'Taxas de rodovia'
  },
  { 
    id: 'estacionamento', 
    label: 'Estacionamento', 
    icon: MapPin, 
    color: 'bg-purple-500', 
    description: 'Zona azul, estacionamentos'
  },
  { 
    id: 'material', 
    label: 'Material', 
    icon: Receipt, 
    color: 'bg-red-500', 
    description: 'Peças, ferramentas'
  },
  { 
    id: 'outros', 
    label: 'Outros', 
    icon: FileText, 
    color: 'bg-gray-500', 
    description: 'Outras despesas'
  }
];

export function MobileDespesaForm({
  vistoriaId,
  onSave,
  onCancel,
  isLoading = false,
  initialData
}: MobileDespesaFormProps) {
  const [formData, setFormData] = useState<DespesaFormData>({
    tipo: initialData?.tipo || '',
    valor: initialData?.valor || 0,
    descricao: initialData?.descricao || '',
    data: initialData?.data || new Date().toISOString().split('T')[0],
    vistoriaId,
    comprovantes: initialData?.comprovantes || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'tipo' | 'dados' | 'comprovante'>('tipo');

  // Formatação de valor monetário
  const formatMoney = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Converte para formato monetário
    const amount = parseFloat(numbers) / 100;
    
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValueChange = (value: string) => {
    const formatted = formatMoney(value);
    const numericValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
    
    setFormData(prev => ({ ...prev, valor: numericValue }));
    
    // Limpar erro se valor for válido
    if (numericValue > 0) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipo) {
      newErrors.tipo = 'Selecione o tipo de despesa';
    }

    if (formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (formData.valor > 10000) {
      newErrors.valor = 'Valor muito alto. Confirme o valor.';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (formData.descricao.length < 5) {
      newErrors.descricao = 'Descrição deve ter pelo menos 5 caracteres';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      setErrors({ submit: 'Erro ao salvar despesa' });
    }
  };

  const selectedTipo = TIPOS_DESPESA.find(t => t.id === formData.tipo);

  // STEP 1: Seleção do tipo
  if (step === 'tipo') {
    return (
      <Card className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nova Despesa</h2>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-700 mb-2">
              Selecione o tipo de despesa:
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TIPOS_DESPESA.map((tipo) => {
              const IconComponent = tipo.icon;
              return (
                <button
                  key={tipo.id}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, tipo: tipo.id }));
                    setStep('dados');
                  }}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${tipo.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 group-hover:text-blue-600">
                        {tipo.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tipo.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  // STEP 2: Dados da despesa
  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setStep('tipo')}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Nova Despesa</h2>
              {selectedTipo && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-4 h-4 ${selectedTipo.color} rounded`}></div>
                  <span className="text-sm text-gray-600">{selectedTipo.label}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor" className="text-sm font-medium text-gray-700">
            Valor *
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="valor"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0,00"
              value={formData.valor > 0 ? formData.valor.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) : ''}
              onChange={(e) => handleValueChange(e.target.value)}
              className={`pl-10 h-12 text-lg ${errors.valor ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.valor && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.valor}</span>
            </p>
          )}
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="data" className="text-sm font-medium text-gray-700">
            Data *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              className={`pl-10 h-12 ${errors.data ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.data && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.data}</span>
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-sm font-medium text-gray-700">
            Descrição *
          </Label>
          <Textarea
            id="descricao"
            placeholder={`Ex: ${selectedTipo?.description || 'Descreva a despesa'}`}
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            className={`min-h-20 resize-none ${errors.descricao ? 'border-red-500' : ''}`}
            maxLength={200}
          />
          <div className="flex justify-between items-center">
            {errors.descricao ? (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.descricao}</span>
              </p>
            ) : (
              <span></span>
            )}
            <span className="text-xs text-gray-500">
              {formData.descricao.length}/200
            </span>
          </div>
        </div>

        {/* Comprovantes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Comprovante (Opcional)
          </Label>
          <MobileComprovanteUpload
            onFilesChange={(files) => setFormData(prev => ({ ...prev, comprovantes: files }))}
            maxFiles={3}
            maxFileSize={10}
            disabled={isLoading}
          />
        </div>

        {/* Erro geral */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.submit}</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer com botões */}
      <div className="p-4 border-t bg-gray-50 space-y-3">
        <Button
          onClick={handleSave}
          disabled={isLoading || !formData.tipo || formData.valor <= 0 || !formData.descricao.trim()}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Salvar Despesa</span>
            </div>
          )}
        </Button>
        
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full h-12"
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}