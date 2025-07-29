'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X,
  FileText,
  MapPin,
  User,
  Car,
  Calendar,
  ArrowLeft,
  Send,
  Loader2
} from 'lucide-react';
import { VistoriaLocal } from '@/types/storage';

interface MobileVistoriaCompletionProps {
  open: boolean;
  vistoria: VistoriaLocal;
  onConfirm: (observacoes: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ItemsSummary {
  total: number;
  concluidos: number;
  pendentes: number;
  problemas: number;
  cancelados: number;
}

export function MobileVistoriaCompletion({
  open,
  vistoria,
  onConfirm,
  onCancel,
  loading = false
}: MobileVistoriaCompletionProps) {
  const [observacoes, setObservacoes] = useState('');
  const [currentStep, setCurrentStep] = useState<'summary' | 'observations' | 'confirmation'>('summary');

  if (!open) return null;

  // Calcular resumo dos itens
  const calcularResumo = (): ItemsSummary => {
    const itens = vistoria.itens || [];
    return {
      total: itens.length,
      concluidos: itens.filter(item => 
        item.status === 'concluido' || item.concluido === true
      ).length,
      pendentes: itens.filter(item => 
        item.status === 'pendente' || (!item.concluido && item.status !== 'problema')
      ).length,
      problemas: itens.filter(item => item.status === 'problema').length,
      cancelados: itens.filter(item => item.status === 'cancelado').length,
    };
  };

  const resumo = calcularResumo();
  const progresso = resumo.total > 0 ? Math.round((resumo.concluidos / resumo.total) * 100) : 0;
  const temPendentes = resumo.pendentes > 0 || resumo.problemas > 0;

  const handleNext = () => {
    if (currentStep === 'summary') {
      setCurrentStep('observations');
    } else if (currentStep === 'observations') {
      setCurrentStep('confirmation');
    }
  };

  const handleBack = () => {
    if (currentStep === 'observations') {
      setCurrentStep('summary');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('observations');
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(observacoes);
    } catch (error) {
      console.error('Erro ao concluir vistoria:', error);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'summary': return 'Resumo da Vistoria';
      case 'observations': return 'Observações Finais';
      case 'confirmation': return 'Confirmar Conclusão';
      default: return 'Conclusão';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'summary': return '1/3';
      case 'observations': return '2/3';
      case 'confirmation': return '3/3';
      default: return '1/3';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="shadow-xl">
          {/* Header Mobile */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={currentStep === 'summary' ? onCancel : handleBack}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  {currentStep === 'summary' ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                </Button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{getStepTitle()}</h2>
                  <p className="text-sm text-gray-500">Passo {getStepNumber()}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Vistoria #{vistoria.id}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-600">Progresso</span>
                <span className="text-xs font-medium text-gray-900">{progresso}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Summary */}
            {currentStep === 'summary' && (
              <>
                {/* Informações da Vistoria */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {vistoria.cidade || 'Local não informado'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {vistoria.veiculo || 'Veículo não informado'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {vistoria.tecnico || 'Técnico não informado'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Resumo dos Itens - Visual Simplificado */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Resumo dos Itens ({resumo.total})
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Concluídos */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-green-700">{resumo.concluidos}</div>
                        <div className="text-xs text-green-600">Concluídos</div>
                      </div>

                      {/* Pendentes */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                        <Clock className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-orange-700">{resumo.pendentes}</div>
                        <div className="text-xs text-orange-600">Pendentes</div>
                      </div>

                      {/* Problemas (se houver) */}
                      {resumo.problemas > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-red-700">{resumo.problemas}</div>
                          <div className="text-xs text-red-600">Problemas</div>
                        </div>
                      )}

                      {/* Cancelados (se houver) */}
                      {resumo.cancelados > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                          <X className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-gray-700">{resumo.cancelados}</div>
                          <div className="text-xs text-gray-600">Cancelados</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alerta se há itens pendentes */}
                  {temPendentes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Atenção</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Há {resumo.pendentes + resumo.problemas} item(s) não concluído(s). 
                            Você pode finalizar mesmo assim, mas será necessário justificar.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Observations */}
            {currentStep === 'observations' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {temPendentes ? 'Justificativa Obrigatória' : 'Observações Finais'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {temPendentes 
                      ? 'Explique por que alguns itens não foram concluídos:'
                      : 'Adicione observações gerais sobre a vistoria (opcional):'
                    }
                  </p>
                  
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder={temPendentes 
                      ? "Ex: Peça não disponível no estoque, será providenciada..."
                      : "Ex: Vistoria realizada sem intercorrências..."
                    }
                    className="min-h-[120px] text-base"
                    required={temPendentes}
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {observacoes.length}/500 caracteres
                    </span>
                    {temPendentes && observacoes.length < 10 && (
                      <span className="text-xs text-red-500">
                        Justificativa obrigatória
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirmar Conclusão</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      A vistoria será marcada como concluída e enviada para o servidor.
                    </p>
                  </div>

                  {/* Resumo Final */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de itens:</span>
                      <span className="font-medium">{resumo.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Concluídos:</span>
                      <span className="font-medium text-green-600">{resumo.concluidos}</span>
                    </div>
                    {resumo.pendentes > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pendentes:</span>
                        <span className="font-medium text-orange-600">{resumo.pendentes}</span>
                      </div>
                    )}
                    {resumo.problemas > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Problemas:</span>
                        <span className="font-medium text-red-600">{resumo.problemas}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Progresso:</span>
                      <span className="text-blue-600">{progresso}%</span>
                    </div>
                  </div>

                  {observacoes && (
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-900 mb-2">Observações:</h4>
                      <p className="text-sm text-blue-800">{observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer com Botões - Fixo */}
          <div className="border-t bg-gray-50 p-4 rounded-b-lg">
            <div className="flex gap-3">
              {currentStep === 'summary' && (
                <>
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    Continuar
                  </Button>
                </>
              )}

              {currentStep === 'observations' && (
                <>
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading || (temPendentes && observacoes.length < 10)}
                  >
                    Revisar
                  </Button>
                </>
              )}

              {currentStep === 'confirmation' && (
                <>
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Finalizar Vistoria
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 