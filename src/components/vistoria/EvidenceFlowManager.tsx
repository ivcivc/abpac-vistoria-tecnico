'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Alert será substituído por Card estilizado
import { MediaCapture, MediaFile } from '@/components/media/MediaCapture';
import { 
  Camera, 
  Hash, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Eye,
  Package,
  Wrench
} from 'lucide-react';

interface EvidenceFlowManagerProps {
  acao: string;
  status: string;
  onEvidenceCapture: (evidenceType: 'numero_serie' | 'local_instalacao' | 'outro', evidences: MediaFile[]) => void;
  onFlowComplete: () => void;
  readOnly: boolean;
  existingEvidences?: {
    numero_serie: MediaFile[];
    local_instalacao: MediaFile[];
    outro: MediaFile[];
  };
}

type FlowStep = 'numero_serie' | 'action_execution' | 'local_instalacao' | 'completed';

export function EvidenceFlowManager({
  acao,
  status,
  onEvidenceCapture,
  onFlowComplete,
  readOnly,
  existingEvidences = { numero_serie: [], local_instalacao: [], outro: [] }
}: EvidenceFlowManagerProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('numero_serie');
  const [completedSteps, setCompletedSteps] = useState<Set<FlowStep>>(new Set());
  
  // Estados para rastrear evidências capturadas
  const [numeroSerieEvidences, setNumeroSerieEvidences] = useState<MediaFile[]>(existingEvidences.numero_serie);
  const [localInstalacaoEvidences, setLocalInstalacaoEvidences] = useState<MediaFile[]>(existingEvidences.local_instalacao);

  const acaoUpper = acao?.toUpperCase();
  const needsSerialPhoto = ['INSTALAR', 'SUBSTITUIR'].includes(acaoUpper);
  const needsLocationPhoto = ['INSTALAR', 'SUBSTITUIR', 'REMOVER', 'MANUTENCAO'].includes(acaoUpper);

  useEffect(() => {
    // Determinar step inicial baseado no status e evidências existentes
    if (status === 'CONCLUIDO') {
      setCurrentStep('completed');
      setCompletedSteps(new Set(['numero_serie', 'action_execution', 'local_instalacao']));
    } else if (needsSerialPhoto) {
      // Para ações que precisam de foto do número de série, começar por aí
      if (numeroSerieEvidences.length > 0) {
        setCurrentStep('action_execution');
        setCompletedSteps(prev => new Set([...prev, 'numero_serie']));
      } else {
        setCurrentStep('numero_serie');
      }
    } else {
      // Para outras ações, ir direto para execução
      setCurrentStep('action_execution');
    }
  }, [status, needsSerialPhoto, numeroSerieEvidences.length]);

  const handleNumeroSerieCapture = (evidences: MediaFile[]) => {
    // Enriquecer evidências com metadados específicos
    const enrichedEvidences = evidences.map(evidence => ({
      ...evidence,
      metadados: {
        momentoCaptura: 'antes_acao' as const,
        acaoRelacionada: acaoUpper,
        stepFluxo: 'numero_serie' as const,
        equipamentoTipo: 'Localizador/Bloqueador', // Pode ser dinâmico baseado no item
        qualidadeImagem: 'boa' as const, // Por padrão, pode ser avaliado futuramente
        visibilidadeElementos: true,
        observacoesTecnico: `Foto do número de série capturada antes de ${acao.toLowerCase()}`
      }
    }));
    
    setNumeroSerieEvidences(enrichedEvidences);
    onEvidenceCapture('numero_serie', enrichedEvidences);
    
    if (enrichedEvidences.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 'numero_serie']));
      setCurrentStep('action_execution');
    }
  };

  const handleActionExecution = () => {
    setCompletedSteps(prev => new Set([...prev, 'action_execution']));
    
    if (needsLocationPhoto) {
      setCurrentStep('local_instalacao');
    } else {
      setCurrentStep('completed');
      onFlowComplete();
    }
  };

  const handleLocalInstalacaoCapture = (evidences: MediaFile[]) => {
    // Enriquecer evidências com metadados específicos
    const enrichedEvidences = evidences.map(evidence => ({
      ...evidence,
      metadados: {
        momentoCaptura: 'apos_acao' as const,
        acaoRelacionada: acaoUpper,
        stepFluxo: 'local_instalacao' as const,
        tipoLocal: 'oculto' as const, // Por padrão para equipamentos de segurança
        descricaoLocal: `Local onde o equipamento foi ${
          acaoUpper === 'INSTALAR' ? 'instalado/escondido' :
          acaoUpper === 'REMOVER' ? 'removido' :
          'trabalhado'
        }`,
        qualidadeImagem: 'boa' as const,
        visibilidadeElementos: true,
        observacoesTecnico: `Foto do local capturada após ${acao.toLowerCase()}`
      }
    }));
    
    setLocalInstalacaoEvidences(enrichedEvidences);
    onEvidenceCapture('local_instalacao', enrichedEvidences);
    
    if (enrichedEvidences.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 'local_instalacao']));
      setCurrentStep('completed');
      onFlowComplete();
    }
  };

  const getStepIcon = (step: FlowStep) => {
    if (completedSteps.has(step)) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    
    switch (step) {
      case 'numero_serie': return <Hash className="w-5 h-5" />;
      case 'action_execution': 
        switch (acaoUpper) {
          case 'INSTALAR': return <Package className="w-5 h-5" />;
          case 'SUBSTITUIR': return <Wrench className="w-5 h-5" />;
          default: return <Eye className="w-5 h-5" />;
        }
      case 'local_instalacao': return <MapPin className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStepTitle = (step: FlowStep) => {
    switch (step) {
      case 'numero_serie': return 'Foto do Número de Série';
      case 'action_execution': return `Executar ${acao}`;
      case 'local_instalacao': return 'Foto do Local de Instalação';
      case 'completed': return 'Fluxo Concluído';
    }
  };

  const getActionDescription = () => {
    switch (acaoUpper) {
      case 'INSTALAR':
        return 'Instalar o equipamento no local apropriado';
      case 'SUBSTITUIR':
        return 'Substituir o equipamento existente pelo novo';
      case 'REMOVER':
        return 'Remover o equipamento do local atual';
      case 'VERIFICAR':
        return 'Verificar o estado e funcionamento do equipamento';
      case 'MANUTENCAO':
        return 'Realizar manutenção no equipamento';
      default:
        return `Executar ${acao}`;
    }
  };

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Fluxo de Evidências - {acao}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {needsSerialPhoto && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Foto do Número de Série</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {numeroSerieEvidences.length} foto(s)
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Ação Executada</span>
              <Badge className="bg-green-100 text-green-800 text-xs">Concluído</Badge>
            </div>
            
            {needsLocationPhoto && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Foto do Local de Instalação</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {localInstalacaoEvidences.length} foto(s)
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Fluxo de Evidências - {acao}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-3">
          {needsSerialPhoto && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              currentStep === 'numero_serie' ? 'bg-blue-50 border border-blue-200' :
              completedSteps.has('numero_serie') ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {getStepIcon('numero_serie')}
              <span className="font-medium">1. Foto do Número de Série</span>
              {currentStep === 'numero_serie' && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Atual</Badge>
              )}
            </div>
          )}
          
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            currentStep === 'action_execution' ? 'bg-blue-50 border border-blue-200' :
            completedSteps.has('action_execution') ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            {getStepIcon('action_execution')}
            <span className="font-medium">
              {needsSerialPhoto ? '2.' : '1.'} Executar {acao}
            </span>
            {currentStep === 'action_execution' && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">Atual</Badge>
            )}
          </div>
          
          {needsLocationPhoto && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              currentStep === 'local_instalacao' ? 'bg-blue-50 border border-blue-200' :
              completedSteps.has('local_instalacao') ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {getStepIcon('local_instalacao')}
              <span className="font-medium">
                {needsSerialPhoto ? '3.' : '2.'} Foto do Local de Instalação
              </span>
              {currentStep === 'local_instalacao' && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Atual</Badge>
              )}
            </div>
          )}
        </div>

        {/* Current Step Content */}
        {currentStep === 'numero_serie' && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Antes de {acao.toLowerCase()}:
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      Capture uma foto clara do número de série do equipamento.
                      Esta evidência é obrigatória para prosseguir com a instalação.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <MediaCapture
              onCapture={handleNumeroSerieCapture}
              tipoEvidencia="numero_serie"
              minFotos={1}
              descricao="Foto clara do número de série do equipamento ANTES da instalação"
              fotosExistentes={numeroSerieEvidences}
              disabled={false}
            />
          </div>
        )}

        {currentStep === 'action_execution' && (
          <div className="space-y-4">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Execute a ação:
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                      {getActionDescription()}
                      {needsLocationPhoto && (
                        <span className="block mt-2">
                          Após completar a ação, você será solicitado a capturar uma foto do local.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleActionExecution}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar que a Ação Foi Executada
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {currentStep === 'local_instalacao' && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">
                      Após {acao.toLowerCase()}:
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      Capture uma foto do local onde o equipamento foi 
                      {acaoUpper === 'INSTALAR' ? ' instalado/escondido' : 
                       acaoUpper === 'REMOVER' ? ' removido' : 
                       ' trabalhado'}.
                      Esta evidência é obrigatória para concluir o item.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <MediaCapture
              onCapture={handleLocalInstalacaoCapture}
              tipoEvidencia="local_instalacao"
              minFotos={1}
              descricao={`Foto do local onde o equipamento foi ${
                acaoUpper === 'INSTALAR' ? 'instalado/escondido' :
                acaoUpper === 'REMOVER' ? 'removido' :
                'trabalhado'
              }`}
              fotosExistentes={localInstalacaoEvidences}
              disabled={false}
            />
          </div>
        )}

        {currentStep === 'completed' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Fluxo de Evidências Concluído
            </h3>
            <p className="text-green-600">
              Todas as evidências obrigatórias foram capturadas com sucesso.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 