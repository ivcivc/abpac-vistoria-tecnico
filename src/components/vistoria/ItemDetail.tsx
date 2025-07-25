'use client';

import React, { useState, useEffect } from 'react';
import { VistoriaItem } from '@/types/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from './StatusBadge';
import { MediaCapture, MediaFile } from '@/components/media/MediaCapture';
import { EvidenceFlowManager } from './EvidenceFlowManager';
import { 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Wrench, 
  Eye,
  Trash2,
  Camera,
  Hash,
  Tag,
  MapPin,
  FileText,
  Copy,
  AlertCircle
} from 'lucide-react';

interface ItemDetailProps {
  item: VistoriaItem;
  readOnly: boolean;
  onUpdate: (item: VistoriaItem) => void;
}

export function ItemDetail({ item, readOnly, onUpdate }: ItemDetailProps) {
  const [editedItem, setEditedItem] = useState<VistoriaItem>(item);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estados para rastrear fotos capturadas
  const [fotosNumeroSerie, setFotosNumeroSerie] = useState<MediaFile[]>([]);
  const [fotosLocalInstalacao, setFotosLocalInstalacao] = useState<MediaFile[]>([]);
  const [fotosOutrasEvidencias, setFotosOutrasEvidencias] = useState<MediaFile[]>([]);

  useEffect(() => {
    setEditedItem(item);
    setHasChanges(false);
    setValidationErrors({});
    // Reset das fotos quando item mudar
    setFotosNumeroSerie([]);
    setFotosLocalInstalacao([]);
    setFotosOutrasEvidencias([]);
  }, [item]);

  const handleFieldChange = (field: string, value: any) => {
    if (readOnly) return;

    const updatedItem = { ...editedItem, [field]: value };
    setEditedItem(updatedItem);
    setHasChanges(true);

    // Limpar erro de validação do campo quando ele for alterado
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const validateItem = (): boolean => {
    const errors: Record<string, string> = {};

    // Validações para INSTALAR
    if ((editedItem as any).acao === 'INSTALAR') {
      if (!(editedItem as any).numero_serie_executado?.trim()) {
        errors.numero_serie_executado = 'Número de série executado é obrigatório para instalações';
      }
      if (!(editedItem as any).local_instalacao_executado?.trim()) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório para instalações';
      }
    }

    // Validações para SUBSTITUIR
    if ((editedItem as any).acao === 'SUBSTITUIR') {
      if (!(editedItem as any).numero_serie_executado?.trim()) {
        errors.numero_serie_executado = 'Número de série do novo equipamento é obrigatório para substituições';
      }
      if (!(editedItem as any).local_instalacao_executado?.trim()) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório para substituições';
      }
    }

    // Validações para REMOVER e MANUTENCAO
    if ((editedItem as any).acao === 'REMOVER' || (editedItem as any).acao === 'MANUTENCAO') {
      if (!(editedItem as any).local_instalacao_executado?.trim()) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório';
      }
    }

    // Validação de observações do técnico (sempre obrigatórias)
    if (!(editedItem as any).observacoes_tecnico?.trim()) {
      errors.observacoes_tecnico = 'Observações do técnico são obrigatórias';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Verifica se todos os campos obrigatórios estão preenchidos
  const isFormValid = (): boolean => {
    const acao = (editedItem as any).acao?.toUpperCase();
    
    // Observações do técnico são sempre obrigatórias
    if (!(editedItem as any).observacoes_tecnico?.trim()) {
      return false;
    }

    // Validações específicas por ação
    if (acao === 'INSTALAR' || acao === 'SUBSTITUIR') {
      if (!(editedItem as any).numero_serie_executado?.trim()) {
        return false;
      }
      if (!(editedItem as any).local_instalacao_executado?.trim()) {
        return false;
      }
      // Validar fotos obrigatórias para INSTALAR/SUBSTITUIR
      if (fotosNumeroSerie.length < 1) {
        return false;
      }
      if (fotosLocalInstalacao.length < 1) {
        return false;
      }
    }

    if (acao === 'REMOVER' || acao === 'MANUTENCAO') {
      if (!(editedItem as any).local_instalacao_executado?.trim()) {
        return false;
      }
      // Validar foto obrigatória do local para REMOVER/MANUTENCAO
      if (fotosLocalInstalacao.length < 1) {
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateItem()) {
      return;
    }

    // Quando salvar, automaticamente marca como CONCLUIDO
    const updatedItem = {
      ...editedItem,
      status: 'CONCLUIDO',
      concluido: true,
      dataConclusao: new Date(),
      // Salvar referências das fotos capturadas
      fotos_numero_serie: fotosNumeroSerie,
      fotos_local_instalacao: fotosLocalInstalacao,
      fotos_outras_evidencias: fotosOutrasEvidencias
    } as any;

    onUpdate(updatedItem);
    setHasChanges(false);
  };

  const copyToExecuted = (plannedField: string, executedField: string) => {
    const plannedValue = (editedItem as any)[plannedField];
    if (plannedValue) {
      handleFieldChange(executedField, plannedValue);
    }
  };

  const getActionIcon = (acao: string) => {
    switch (acao?.toUpperCase()) {
      case 'VERIFICAR': return <Eye className="w-4 h-4" />;
      case 'INSTALAR': return <Package className="w-4 h-4" />;
      case 'SUBSTITUIR': return <Wrench className="w-4 h-4" />;
      case 'REMOVER': return <Trash2 className="w-4 h-4" />;
      case 'MANUTENCAO': return <Wrench className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getActionLabel = (acao: string) => {
    switch (acao?.toUpperCase()) {
      case 'VERIFICAR': return 'Verificar';
      case 'INSTALAR': return 'Instalar';
      case 'SUBSTITUIR': return 'Substituir';
      case 'REMOVER': return 'Remover';
      case 'MANUTENCAO': return 'Manutenção';
      default: return acao;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; color: string }> = {
      'PENDENTE': { label: 'Pendente', variant: 'secondary', color: 'text-gray-600 bg-gray-100' },
      'EM_EXECUCAO': { label: 'Em Execução', variant: 'default', color: 'text-blue-600 bg-blue-100' },
      'CONCLUIDO': { label: 'Concluído', variant: 'default', color: 'text-green-600 bg-green-100' },
      'APROVADO': { label: 'Aprovado', variant: 'default', color: 'text-emerald-600 bg-emerald-100' },
      'REQUER_CORRECAO': { label: 'Requer Correção', variant: 'destructive', color: 'text-red-600 bg-red-100' },
    };

    const config = statusMap[status] || statusMap['PENDENTE'];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const itemData = editedItem as any;
  const acao = itemData.acao?.toUpperCase();
  const needsPlannedLocation = ['REMOVER', 'MANUTENCAO', 'SUBSTITUIR'].includes(acao);

  return (
    <div className="space-y-6">
      {/* Header do Item */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getActionIcon(acao)}
              <span>{getActionLabel(acao)} {itemData.tipo || 'Equipamento'}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(itemData.status_item || itemData.status || 'PENDENTE')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações básicas do equipamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fabricante</Label>
              <p className="text-sm font-medium">
                {typeof editedItem.fabricante === 'object' 
                  ? (editedItem.fabricante as any)?.nome || (editedItem.fabricante as any)?.descricao || 'Fabricante'
                  : editedItem.fabricante
                }
              </p>
            </div>
            <div>
              <Label>Equipamento</Label>
              <div className="mt-1">
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <Tag className="w-3 h-3" />
                  {typeof editedItem.categoria === 'object' 
                    ? (editedItem.categoria as any)?.descricao || (editedItem.categoria as any)?.nome || 'LOCALIZADOR'
                    : editedItem.categoria || 'LOCALIZADOR'
                  }
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. INSTRUÇÕES PARA O TÉCNICO */}
      {itemData.observacoes_planejadas && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <FileText className="w-5 h-5" />
              Instruções para a Vistoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-sm whitespace-pre-wrap font-medium text-blue-900">
                {itemData.observacoes_planejadas}
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ⚠️ Leia atentamente as instruções antes de iniciar a vistoria
            </p>
          </CardContent>
        </Card>
      )}

      {/* 2. LOCALIZAÇÃO DO EQUIPAMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localização do Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 3. Local Planejado (somente para REMOVER, MANUTENCAO, SUBSTITUIR) */}
          {needsPlannedLocation && itemData.local_instalacao_planejado && (
            <div className="bg-gray-50 p-4 rounded border">
              <Label className="text-sm font-medium text-gray-700">
                Local Onde o Equipamento Foi Instalado/Escondido
              </Label>
              <p className="text-sm font-medium mt-1 text-gray-900">
                {itemData.local_instalacao_planejado}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                📍 Localização original do equipamento no veículo
              </p>
            </div>
          )}

          {/* 4. Local Executado (editável) */}
          {!readOnly && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="local_instalacao_executado">
                  {acao === 'INSTALAR' ? 'Local Onde Instalou o Equipamento' : 'Local Onde Executou a Ação'} *
                </Label>
                {needsPlannedLocation && itemData.local_instalacao_planejado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToExecuted('local_instalacao_planejado', 'local_instalacao_executado')}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                )}
              </div>
              <Input
                id="local_instalacao_executado"
                value={itemData.local_instalacao_executado || ''}
                onChange={(e) => handleFieldChange('local_instalacao_executado', e.target.value)}
                placeholder={acao === 'INSTALAR' 
                  ? "Ex: Debaixo do painel, lado direito, próximo ao pedal"
                  : "Descreva onde executou a ação"
                }
                className={validationErrors.local_instalacao_executado ? 'border-red-500' : ''}
                maxLength={255}
              />
              {validationErrors.local_instalacao_executado && (
                <p className="text-sm text-red-600">{validationErrors.local_instalacao_executado}</p>
              )}
              <p className="text-xs text-gray-500">
                📸 <strong>IMPORTANTE:</strong> Tire foto do equipamento e do local onde foi instalado/escondido
              </p>
            </div>
          )}

          {/* Modo somente leitura */}
          {readOnly && itemData.local_instalacao_executado && (
            <div>
              <Label>Local de Instalação Executado</Label>
              <p className="text-sm font-medium bg-gray-50 p-2 rounded border">
                {itemData.local_instalacao_executado}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. NÚMERO DE SÉRIE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Número de Série do Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Número de série planejado (referência) */}
          {itemData.numero_serie_planejado && (
            <div className="bg-gray-50 p-4 rounded border">
              <Label className="text-sm font-medium text-gray-700">
                Número de Série Planejado (Referência)
              </Label>
              <p className="text-sm font-medium mt-1 text-gray-900 font-mono">
                {itemData.numero_serie_planejado}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                🏷️ Número de série do equipamento planejado
              </p>
            </div>
          )}

          {/* Número de série executado (editável) */}
          {!readOnly && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="numero_serie_executado">
                  Número de Série Executado *
                </Label>
                {itemData.numero_serie_planejado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToExecuted('numero_serie_planejado', 'numero_serie_executado')}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                )}
              </div>
              <Input
                id="numero_serie_executado"
                value={itemData.numero_serie_executado || ''}
                onChange={(e) => handleFieldChange('numero_serie_executado', e.target.value.trim().toUpperCase())}
                placeholder="Digite o número de série do equipamento"
                className={validationErrors.numero_serie_executado ? 'border-red-500' : ''}
                maxLength={30}
              />
              {validationErrors.numero_serie_executado && (
                <p className="text-sm text-red-600">{validationErrors.numero_serie_executado}</p>
              )}
              <p className="text-xs text-gray-500">
                📸 <strong>IMPORTANTE:</strong> Tire foto do número de série do equipamento
              </p>
            </div>
          )}

          {/* Modo somente leitura */}
          {readOnly && itemData.numero_serie_executado && (
            <div>
              <Label>Número de Série Executado</Label>
              <p className="text-sm font-medium bg-green-50 p-2 rounded border border-green-200 font-mono">
                {itemData.numero_serie_executado}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. OBSERVAÇÕES DO TÉCNICO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Observações do Técnico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readOnly ? (
            <div>
              <Label>Considerações do Técnico</Label>
              <p className="text-sm mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                {itemData.observacoes_tecnico || 'Nenhuma observação registrada'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="observacoes_tecnico">
                Suas Considerações (Dificuldades, Detalhes Relevantes) *
              </Label>
              <textarea
                id="observacoes_tecnico"
                value={itemData.observacoes_tecnico || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('observacoes_tecnico', e.target.value)}
                placeholder="Descreva dificuldades encontradas, detalhes importantes, condições do veículo, etc..."
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.observacoes_tecnico ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              {validationErrors.observacoes_tecnico && (
                <p className="text-sm text-red-600">{validationErrors.observacoes_tecnico}</p>
              )}
              <p className="text-xs text-gray-500">
                Obrigatório. Registre suas considerações sobre a execução. Máx: 500 caracteres.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FLUXO DE EVIDÊNCIAS ESPECÍFICAS */}
      <EvidenceFlowManager
        acao={itemData.acao || 'INSTALAR'}
        status={itemData.status_item || itemData.status || 'PENDENTE'}
        onEvidenceCapture={(evidenceType, evidences) => {
          console.log(`📸 Evidências ${evidenceType} capturadas:`, evidences);
          
          if (evidenceType === 'numero_serie') {
            setFotosNumeroSerie(evidences);
          } else if (evidenceType === 'local_instalacao') {
            setFotosLocalInstalacao(evidences);
          } else if (evidenceType === 'outro') {
            setFotosOutrasEvidencias(evidences);
          }
          
          setHasChanges(true);
        }}
        onFlowComplete={() => {
          console.log('✅ Fluxo de evidências concluído');
          setHasChanges(true);
        }}
        readOnly={readOnly}
        existingEvidences={{
          numero_serie: fotosNumeroSerie,
          local_instalacao: fotosLocalInstalacao,
          outro: fotosOutrasEvidencias
        }}
      />

      {/* OUTRAS EVIDÊNCIAS (OPCIONAL) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Outras Evidências
            <Badge className="bg-gray-100 text-gray-800 text-xs">Opcional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MediaCapture
            onCapture={(fotos: MediaFile[]) => {
              console.log('📸 Outras evidências capturadas:', fotos);
              setFotosOutrasEvidencias(fotos);
              setHasChanges(true);
            }}
            tipoEvidencia="outro"
            minFotos={0}
            descricao="Fotos adicionais relevantes para a vistoria"
            disabled={readOnly}
            fotosExistentes={fotosOutrasEvidencias}
          />
        </CardContent>
      </Card>

      {/* BOTÕES DE AÇÃO */}
      {!readOnly && (
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 border rounded-lg shadow-lg">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !isFormValid()}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Salvar e Concluir Item
          </Button>
        </div>
      )}

      {/* INFORMAÇÕES DE STATUS */}
      {itemData.status_item === 'CONCLUIDO' && itemData.dataConclusao && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Item concluído em:</span>
              <span>{new Date(itemData.dataConclusao).toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 