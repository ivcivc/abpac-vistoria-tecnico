'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaCapture, MediaFile } from '@/components/media/MediaCapture';
import { Despesa } from '@/types/storage';
import { 
  DollarSign,
  Receipt, 
  FileText,
  Camera,
  Trash2,
  Save,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DespesaFormProps {
  despesa?: Despesa; // Para edição
  vistoriaId: string;
  itemId: string;
  onSave: (despesa: Omit<Despesa, 'id'>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

type TiposDespesa = 'SERVICO' | 'MATERIAL' | 'DESLOCAMENTO' | 'OUTROS';

const TIPOS_OPTIONS: { value: TiposDespesa; label: string; icon: string }[] = [
  { value: 'SERVICO', label: 'Serviço', icon: '🔧' },
  { value: 'MATERIAL', label: 'Material', icon: '📦' },
  { value: 'DESLOCAMENTO', label: 'Deslocamento', icon: '🚗' },
  { value: 'OUTROS', label: 'Outros', icon: '📄' }
];

export function DespesaForm({
  despesa,
  vistoriaId,
  itemId,
  onSave,
  onCancel,
  readOnly = false
}: DespesaFormProps) {
  const [tipo, setTipo] = useState<TiposDespesa>(despesa?.tipo || 'SERVICO');
  const [valor, setValor] = useState<string>(despesa?.valor ? formatCurrency(despesa.valor) : '');
  const [descricao, setDescricao] = useState<string>(despesa?.descricao || '');
  const [comprovantes, setComprovantes] = useState<MediaFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Função para formatar valor monetário
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Função para converter string monetária em número
  function parseCurrency(value: string): number {
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, '');
    // Substitui vírgula por ponto para conversão
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  // Função para validar formato monetário enquanto digita
  function handleValorChange(inputValue: string) {
    // Remove caracteres não numéricos exceto vírgula e ponto
    let cleaned = inputValue.replace(/[^\d,.-]/g, '');
    
    // Aplica formatação básica
    if (cleaned) {
      const numericValue = parseCurrency(cleaned);
      if (!isNaN(numericValue) && numericValue >= 0) {
        setValor(cleaned);
        setHasChanges(true);
        
        // Remove erro de validação se valor for válido
        if (validationErrors.valor) {
          const newErrors = { ...validationErrors };
          delete newErrors.valor;
          setValidationErrors(newErrors);
        }
      }
    } else {
      setValor('');
      setHasChanges(true);
    }
  }

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validação de tipo (sempre obrigatória)
    if (!tipo) {
      errors.tipo = 'Tipo é obrigatório';
    }

    // Validação de valor
    if (!valor.trim()) {
      errors.valor = 'Valor é obrigatório';
    } else {
      const numericValue = parseCurrency(valor);
      if (isNaN(numericValue) || numericValue <= 0) {
        errors.valor = 'Valor deve ser um número positivo válido';
      }
    }

    // Validação de descrição
    if (!descricao.trim()) {
      errors.descricao = 'Descrição é obrigatória';
    } else if (descricao.trim().length < 3) {
      errors.descricao = 'Descrição deve ter pelo menos 3 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Verificar se form é válido em tempo real
  const isFormValid = (): boolean => {
    return !!tipo && 
           valor.trim().length > 0 && 
           parseCurrency(valor) > 0 && 
           descricao.trim().length >= 3;
  };

  // Manipular salvamento
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const numericValue = parseCurrency(valor);

    const novaDespesa: Omit<Despesa, 'id'> = {
      itemId,
      vistoriaId,
      tipo,
      valor: numericValue,
      descricao: descricao.trim(),
      timestamp: new Date(),
      comprovante: comprovantes.length > 0 ? convertToEvidencia(comprovantes[0]) : undefined
    };

    onSave(novaDespesa);
  };

  // Converter MediaFile para Evidencia
  const convertToEvidencia = (mediaFile: MediaFile) => {
    return {
      id: mediaFile.id,
      itemId,
      tipo: mediaFile.tipo,
      url: mediaFile.url,
      localUrl: mediaFile.localUrl || mediaFile.url,
      tamanho: mediaFile.tamanho || 0,
      timestamp: new Date(),
      descricao: `Comprovante - ${tipo}`,
      tipoEvidencia: 'outro' as const,
      metadados: {
        momentoCaptura: 'outro' as const,
        acaoRelacionada: 'DESPESA',
        observacoesTecnico: `Comprovante de despesa: ${descricao}`
      }
    };
  };

  // Manipular mudanças nos campos
  const handleFieldChange = (field: string, value: any) => {
    setHasChanges(true);
    
    // Limpar erro de validação quando campo for alterado
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          {despesa ? 'Editar Despesa' : 'Nova Despesa'}
          {despesa?.aprovada && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Aprovada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_OPTIONS.map((opcao) => (
              <Button
                key={opcao.value}
                type="button"
                variant={tipo === opcao.value ? "default" : "outline"}
                className={`h-12 flex items-center gap-2 ${
                  tipo === opcao.value ? 'bg-blue-600 text-white' : ''
                }`}
                onClick={() => {
                  setTipo(opcao.value);
                  handleFieldChange('tipo', opcao.value);
                }}
                disabled={readOnly}
              >
                <span className="text-lg">{opcao.icon}</span>
                <span className="text-sm font-medium">{opcao.label}</span>
              </Button>
            ))}
          </div>
          {validationErrors.tipo && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.tipo}
            </p>
          )}
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="valor"
              type="text"
              value={valor}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="Ex: 50,00"
              className={`pl-10 ${validationErrors.valor ? 'border-red-500' : ''}`}
              disabled={readOnly}
            />
          </div>
          {validationErrors.valor && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.valor}
            </p>
          )}
          <p className="text-xs text-gray-500">
            💡 Digite apenas números. Ex: 50,00 ou 50.50
          </p>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              handleFieldChange('descricao', e.target.value);
            }}
            placeholder="Descreva a despesa detalhadamente..."
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.descricao ? 'border-red-500' : ''
            }`}
            maxLength={200}
            disabled={readOnly}
          />
          {validationErrors.descricao && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.descricao}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {descricao.length}/200 caracteres
          </p>
        </div>

        {/* Comprovante (Opcional) */}
        {!readOnly && (
          <div className="space-y-2">
            <Label>Comprovante</Label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Foto do Comprovante
                  <Badge className="bg-gray-100 text-gray-800 text-xs">Opcional</Badge>
                </h4>
                <p className="text-xs text-gray-700 mt-1">
                  Capture a foto da nota fiscal, recibo ou comprovante da despesa
                </p>
              </div>
              <MediaCapture
                onCapture={(evidences) => {
                  console.log('📸 Comprovante capturado:', evidences);
                  setComprovantes(evidences);
                  setHasChanges(true);
                }}
                tipoEvidencia="outro"
                minFotos={0}
                descricao="Capture o comprovante da despesa (nota fiscal, recibo, etc.)"
                fotosExistentes={comprovantes}
                disabled={false}
              />
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        {!readOnly && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !isFormValid()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {despesa ? 'Atualizar Despesa' : 'Salvar Despesa'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Preview de valor formatado */}
        {valor && parseCurrency(valor) > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Valor: {formatCurrency(parseCurrency(valor))}
              </span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
} 