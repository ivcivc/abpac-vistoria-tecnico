'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { VistoriaLocal, VistoriaItem } from '@/types/storage';

interface VistoriaCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vistoria: VistoriaLocal;
  onConfirm: (observacoes: string) => Promise<void>;
  loading?: boolean;
}

interface ItemsSummary {
  total: number;
  concluidos: number;
  pendentes: number;
  problemas: number;
  cancelados: number;
}

export function VistoriaCompletionModal({
  open,
  onOpenChange,
  vistoria,
  onConfirm,
  loading = false
}: VistoriaCompletionModalProps) {
  const [observacoes, setObservacoes] = useState('');
  const [forceComplete, setForceComplete] = useState(false);

  // Calcular resumo dos itens
  const calcularResumo = (): ItemsSummary => {
    const itens = vistoria.itens || [];
    return {
      total: itens.length,
      concluidos: itens.filter(item => item.status === 'concluido').length,
      pendentes: itens.filter(item => item.status === 'pendente').length,
      problemas: itens.filter(item => item.status === 'problema').length,
      cancelados: itens.filter(item => item.status === 'cancelado').length,
    };
  };

  const resumo = calcularResumo();
  const temItensPendentes = resumo.pendentes > 0;
  const temProblemas = resumo.problemas > 0;
  const progressoPercentual = resumo.total > 0 ? Math.round((resumo.concluidos / resumo.total) * 100) : 0;

  const handleConfirm = async () => {
    if (temItensPendentes && !forceComplete) {
      setForceComplete(true);
      return;
    }

    await onConfirm(observacoes);
  };

  const handleCancel = () => {
    setObservacoes('');
    setForceComplete(false);
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'problema': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'cancelado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'problema': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Concluir Vistoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Vistoria */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Informações da Vistoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Veículo:</span>
                  <p className="font-medium">{vistoria.veiculo?.placa} - {vistoria.veiculo?.modelo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Técnico:</span>
                  <p className="font-medium">{vistoria.tecnico?.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Local:</span>
                  <p className="font-medium">{vistoria.local}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Progresso:</span>
                  <p className="font-medium">{progressoPercentual}% concluído</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo dos Itens */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resumo dos Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{resumo.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{resumo.concluidos}</div>
                  <div className="text-xs text-muted-foreground">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{resumo.pendentes}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{resumo.problemas}</div>
                  <div className="text-xs text-muted-foreground">Problemas</div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso da Vistoria</span>
                  <span>{progressoPercentual}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressoPercentual}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas para Itens Pendentes */}
          {temItensPendentes && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Atenção: Itens Pendentes
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Existem {resumo.pendentes} item(ns) pendente(s) nesta vistoria. 
                      {!forceComplete && ' Deseja realmente concluir a vistoria?'}
                    </p>
                    {forceComplete && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
                        ⚠️ Você está forçando a conclusão com itens pendentes. 
                        Adicione uma justificativa nas observações abaixo.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas para Problemas */}
          {temProblemas && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Itens com Problema
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {resumo.problemas} item(ns) foi(ram) marcado(s) como problema. 
                      Certifique-se de que as observações estão detalhadas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Itens com Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Itens da Vistoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vistoria.itens?.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.tipo} - {item.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.numeroSerie}
                      </p>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(item.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Observações Finais */}
          <div className="space-y-3">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações Finais {forceComplete && <span className="text-red-600">*</span>}
            </Label>
            <Textarea
              id="observacoes"
              placeholder={
                forceComplete 
                  ? "Justifique por que a vistoria está sendo concluída com itens pendentes..."
                  : "Adicione observações gerais sobre a vistoria (opcional)..."
              }
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {observacoes.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          {!forceComplete && temItensPendentes ? (
            <Button 
              onClick={handleConfirm}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Processando...' : 'Forçar Conclusão'}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm}
              disabled={loading || (forceComplete && !observacoes.trim())}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Concluindo...' : 'Concluir Vistoria'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 