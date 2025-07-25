'use client';

import React, { useState, useEffect } from 'react';
import { VistoriaLocal, LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { calculateVistoriaProgress } from '@/utils/progressCalculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  Camera,
  AlertCircle,
  Lock,
  Unlock,
  Send,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';

interface VistoriaCompletionFlowProps {
  vistoria: VistoriaLocal;
  onVistoriaUpdated: (vistoria: VistoriaLocal) => void;
  onCancel?: () => void;
}

interface CompletionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  itemsPendentes: string[];
}

interface CompletionSummary {
  totalItens: number;
  itensCompletos: number;
  itensPendentes: number;
  totalDespesas: number;
  valorTotalDespesas: number;
  totalEvidencias: number;
}

export function VistoriaCompletionFlow({ 
  vistoria, 
  onVistoriaUpdated, 
  onCancel 
}: VistoriaCompletionFlowProps) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<CompletionValidation | null>(null);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [observacoesConclusao, setObservacoesConclusao] = useState(vistoria.observacoes || '');
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Validar vistoria para conclusão
  const validateCompletion = (): CompletionValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const itemsPendentes: string[] = [];

    // Verificar se todos os itens estão concluídos
    const itensNaoConcluidos = (vistoria.itens || []).filter(item => !item.concluido);
    if (itensNaoConcluidos.length > 0) {
      errors.push(`${itensNaoConcluidos.length} item(ns) ainda não foram concluído(s)`);
      itemsPendentes.push(...itensNaoConcluidos.map(item => `${item.tipo} - ${item.categoria}`));
    }

    // Verificar se há observações obrigatórias nos itens
    const itensSemObservacoes = (vistoria.itens || []).filter(item => 
      item.concluido && (!item.observacoes || item.observacoes.trim() === '')
    );
    if (itensSemObservacoes.length > 0) {
      warnings.push(`${itensSemObservacoes.length} item(ns) concluído(s) sem observações detalhadas`);
    }

    // Verificar evidências obrigatórias
    const itensSemEvidencias = (vistoria.itens || []).filter(item => {
      const acao = item.acao?.toUpperCase();
      if (acao === 'INSTALAR' || acao === 'SUBSTITUIR') {
        const evidenciasNumeroSerie = (item.evidencias || []).filter(e => e.tipoEvidencia === 'numero_serie');
        const evidenciasLocal = (item.evidencias || []).filter(e => e.tipoEvidencia === 'local_instalacao');
        return evidenciasNumeroSerie.length === 0 || evidenciasLocal.length === 0;
      }
      if (acao === 'REMOVER' || acao === 'MANUTENCAO') {
        const evidenciasLocal = (item.evidencias || []).filter(e => e.tipoEvidencia === 'local_instalacao');
        return evidenciasLocal.length === 0;
      }
      return false;
    });

    if (itensSemEvidencias.length > 0) {
      errors.push(`${itensSemEvidencias.length} item(ns) sem evidências obrigatórias`);
    }

    // Verificar despesas sem comprovante (warning)
    const despesasSemComprovante = (vistoria.itens || [])
      .flatMap(item => item.despesas || [])
      .filter(despesa => despesa.valor > 50 && !despesa.comprovante);
    
    if (despesasSemComprovante.length > 0) {
      warnings.push(`${despesasSemComprovante.length} despesa(s) acima de R$ 50,00 sem comprovante`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      itemsPendentes
    };
  };

  // Gerar resumo da vistoria
  const generateSummary = (): CompletionSummary => {
    const itens = vistoria.itens || [];
    const todasDespesas = itens.flatMap(item => item.despesas || []);
    const todasEvidencias = itens.flatMap(item => item.evidencias || []);

    return {
      totalItens: itens.length,
      itensCompletos: itens.filter(item => item.concluido).length,
      itensPendentes: itens.filter(item => !item.concluido).length,
      totalDespesas: todasDespesas.length,
      valorTotalDespesas: todasDespesas.reduce((total, despesa) => total + despesa.valor, 0),
      totalEvidencias: todasEvidencias.length
    };
  };

  // Concluir vistoria
  const handleConcluirVistoria = async () => {
    setLoading(true);
    
    try {
      const localVistoriaService = new LocalVistoriaService();
      
      // Atualizar vistoria com dados de conclusão
      const vistoriaAtualizada: VistoriaLocal = {
        ...vistoria,
        status: 'concluida',
        dataConclusao: new Date(),
        observacoes: observacoesConclusao.trim(),
        progresso: 100,
        ultimaAtualizacao: new Date()
      };

      // Salvar no armazenamento local
      const result = await localVistoriaService.salvarVistoriaLocal(vistoriaAtualizada);
      
      if (result.success) {
        console.log('✅ [COMPLETION] Vistoria concluída com sucesso:', vistoriaAtualizada.id);
        
        // Notificar componente pai
        onVistoriaUpdated(vistoriaAtualizada);
        
        // TODO: Adicionar à fila de sincronização
        console.log('📤 [COMPLETION] Adicionando vistoria à fila de sincronização...');
        
      } else {
        throw new Error(result.error || 'Falha ao salvar conclusão');
      }
      
    } catch (error) {
      console.error('❌ [COMPLETION] Erro ao concluir vistoria:', error);
      alert('Erro ao concluir vistoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Executar validações na inicialização
  useEffect(() => {
    const validationResult = validateCompletion();
    const summaryResult = generateSummary();
    
    setValidation(validationResult);
    setSummary(summaryResult);
  }, [vistoria]);

  if (!validation || !summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted/50 rounded w-1/2" />
            <div className="h-4 bg-muted/50 rounded" />
            <div className="h-4 bg-muted/50 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const canComplete = validation.isValid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Conclusão da Vistoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Local da Vistoria</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {vistoria.local}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Data/Hora</p>
                <p className="font-medium">{new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Vistoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumo da Vistoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total de Itens</p>
              <p className="text-2xl font-bold text-blue-800">{summary.totalItens}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Concluídos</p>
              <p className="text-2xl font-bold text-green-800">{summary.itensCompletos}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Evidências</p>
              <p className="text-2xl font-bold text-purple-800">{summary.totalEvidencias}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Despesas</p>
              <p className="text-lg font-bold text-orange-800">
                {summary.valorTotalDespesas.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validações */}
      <Card className={validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
            {validation.isValid ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            Status de Validação
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              className="ml-auto"
            >
              <Eye className="w-4 h-4" />
              {showValidationDetails ? 'Ocultar' : 'Detalhes'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validation.isValid ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Vistoria pronta para conclusão</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <p className="text-sm font-medium text-orange-700">Avisos:</p>
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {showValidationDetails && validation.itemsPendentes.length > 0 && (
              <div className="mt-4 p-3 bg-white/50 rounded border">
                <p className="text-sm font-medium text-red-700 mb-2">Itens pendentes:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {validation.itemsPendentes.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observações de Conclusão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Observações Finais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="observacoes_conclusao">
              Considerações Gerais da Vistoria
            </Label>
            <textarea
              id="observacoes_conclusao"
              value={observacoesConclusao}
              onChange={(e) => setObservacoesConclusao(e.target.value)}
              placeholder="Registre observações gerais sobre a vistoria, dificuldades encontradas, condições do local, etc..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
              disabled={vistoria.status === 'concluida'}
            />
            <p className="text-xs text-gray-500">
              Opcional. Registre observações gerais sobre toda a vistoria. Máx: 1000 caracteres.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {vistoria.status === 'concluida' ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Vistoria Finalizada
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  Em Edição
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
              
              {vistoria.status !== 'concluida' && (
                <Button
                  onClick={handleConcluirVistoria}
                  disabled={!canComplete || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Concluir Vistoria
                </Button>
              )}
            </div>
          </div>
          
          {!canComplete && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">
                ⚠️ Complete todos os itens obrigatórios e corrija os erros antes de concluir a vistoria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 