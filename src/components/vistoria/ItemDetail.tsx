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
import { SimpleMediaCapture } from '@/components/media/SimpleMediaCapture';
import { DespesaForm } from '@/components/despesas';
import { Despesa } from '@/types/storage';
import { UploadService } from '@/services/uploadService';
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
  AlertCircle,
  Receipt,
  Plus,
  Edit,
  DollarSign
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
  
  // Estados para upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Estados para despesas
  const [despesas, setDespesas] = useState<Despesa[]>(item.despesas || []);
  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | undefined>(undefined);

  useEffect(() => {
    setEditedItem(item);
    setHasChanges(false);
    setValidationErrors({});
    // Reset das fotos quando item mudar
    setFotosNumeroSerie([]);
    setFotosLocalInstalacao([]);
    setFotosOutrasEvidencias([]);
    // Reset das despesas quando item mudar
    setDespesas(item.despesas || []);
    setShowDespesaForm(false);
    setEditingDespesa(undefined);
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

  const handleSave = async () => {
    if (!validateItem()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      console.log('🔄 ItemDetail: Iniciando salvamento com upload de evidências');

      // Fazer upload das evidências
      const [
        numeroSerieUploaded,
        localInstalacaoUploaded,
        outrasEvidenciasUploaded
      ] = await Promise.all([
        // Upload fotos do número de série
        fotosNumeroSerie.length > 0 ? 
          UploadService.processMediaFiles(fotosNumeroSerie, {
            tipo: 'evidencia',
            referencia: `item_${item.id}_numero_serie`,
            onProgress: (fileIndex, progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [`numero_serie_${fileIndex}`]: progress.percentage
              }));
            }
          }) : Promise.resolve([]),
        
        // Upload fotos do local de instalação
        fotosLocalInstalacao.length > 0 ?
          UploadService.processMediaFiles(fotosLocalInstalacao, {
            tipo: 'evidencia',
            referencia: `item_${item.id}_local_instalacao`,
            onProgress: (fileIndex, progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [`local_instalacao_${fileIndex}`]: progress.percentage
              }));
            }
          }) : Promise.resolve([]),
        
        // Upload outras evidências
        fotosOutrasEvidencias.length > 0 ?
          UploadService.processMediaFiles(fotosOutrasEvidencias, {
            tipo: 'evidencia', 
            referencia: `item_${item.id}_outras`,
            onProgress: (fileIndex, progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [`outras_${fileIndex}`]: progress.percentage
              }));
            }
          }) : Promise.resolve([])
      ]);

      console.log('✅ ItemDetail: Uploads concluídos', {
        numeroSerie: numeroSerieUploaded.length,
        localInstalacao: localInstalacaoUploaded.length,
        outras: outrasEvidenciasUploaded.length
      });

      // Criar estrutura fotos_videos para o backend (campo JSON)
      const fotosVideosBackend = [
        ...numeroSerieUploaded,
        ...localInstalacaoUploaded,
        ...outrasEvidenciasUploaded
      ];

      // Quando salvar, automaticamente marca como CONCLUIDO
      const updatedItem = {
        ...editedItem,
        status: 'CONCLUIDO',
        concluido: true,
        dataConclusao: new Date(),
        // Campo fotos_videos usado pelo backend (JSON)
        fotos_videos: fotosVideosBackend,
        // Manter referências locais para compatibilidade
        fotos_numero_serie: fotosNumeroSerie,
        fotos_local_instalacao: fotosLocalInstalacao,
        fotos_outras_evidencias: fotosOutrasEvidencias,
        // Salvar despesas
        despesas: despesas
      } as any;

      onUpdate(updatedItem);
      setHasChanges(false);
      
      console.log('✅ ItemDetail: Item salvo com evidências no backend', {
        itemId: item.id,
        evidenciasBackend: fotosVideosBackend.length,
        evidenciasLocais: fotosNumeroSerie.length + fotosLocalInstalacao.length + fotosOutrasEvidencias.length
      });

    } catch (error) {
      console.error('❌ ItemDetail: Erro durante upload de evidências', error);
      
      // Salvar mesmo com erro de upload (para não perder dados)
      const updatedItem = {
        ...editedItem,
        status: 'CONCLUIDO',
        concluido: true,
        dataConclusao: new Date(),
        // Manter apenas referências locais se upload falhou
        fotos_numero_serie: fotosNumeroSerie,
        fotos_local_instalacao: fotosLocalInstalacao,
        fotos_outras_evidencias: fotosOutrasEvidencias,
        despesas: despesas,
        // Marcar que houve erro no upload
        upload_error: error instanceof Error ? error.message : 'Erro no upload'
      } as any;

      onUpdate(updatedItem);
      setHasChanges(false);
      
      alert('Erro no upload das evidências, mas os dados foram salvos localmente. As evidências serão enviadas na próxima sincronização.');
      
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const copyToExecuted = (plannedField: string, executedField: string) => {
    const plannedValue = (editedItem as any)[plannedField];
    if (plannedValue) {
      handleFieldChange(executedField, plannedValue);
    }
  };

  // Funções para gerenciar despesas
  const handleAddDespesa = () => {
    setEditingDespesa(undefined);
    setShowDespesaForm(true);
  };

  const handleEditDespesa = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setShowDespesaForm(true);
  };

  const handleSaveDespesa = (novaDespesa: Omit<Despesa, 'id'>) => {
    const despesaComId: Despesa = {
      ...novaDespesa,
      id: editingDespesa?.id || `despesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (editingDespesa) {
      // Editando despesa existente
      setDespesas(prev => prev.map(d => d.id === editingDespesa.id ? despesaComId : d));
    } else {
      // Adicionando nova despesa
      setDespesas(prev => [...prev, despesaComId]);
    }

    setShowDespesaForm(false);
    setEditingDespesa(undefined);
    setHasChanges(true);
  };

  const handleCancelDespesa = () => {
    setShowDespesaForm(false);
    setEditingDespesa(undefined);
  };

  const handleDeleteDespesa = (despesaId: string) => {
    setDespesas(prev => prev.filter(d => d.id !== despesaId));
    setHasChanges(true);
  };

  // Função para formatar valor monetário para exibição
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular total das despesas
  const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);

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
               
               {/* Captura de foto do local de instalação - logo após o campo */}
               <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                 <div className="mb-3">
                   <h4 className="text-sm font-medium text-green-900 flex items-center gap-2">
                     <Camera className="w-4 h-4" />
                     Foto do Local de Instalação
                   </h4>
                   <p className="text-xs text-green-700 mt-1">
                     Capture uma ou mais fotos do local onde o equipamento foi instalado/escondido
                   </p>
                 </div>
                 <SimpleMediaCapture
                   onCapture={(evidences) => {
                     console.log('📸 Captura do local de instalação:', evidences);
                     setFotosLocalInstalacao(evidences);
                     setHasChanges(true);
                   }}
                   tipoEvidencia="local_instalacao"
                   minFotos={1}
                   descricao={`Capture quantas fotos/vídeos precisar do local onde o equipamento foi ${
                     acao === 'INSTALAR' ? 'instalado/escondido' :
                     acao === 'REMOVER' ? 'removido' :
                     'trabalhado'
                   }`}
                   fotosExistentes={fotosLocalInstalacao}
                   disabled={false}
                 />
               </div>
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
              
              {/* Captura de foto do número de série - logo após o campo */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Foto do Número de Série
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Capture uma ou mais fotos claras do número de série digitado acima
                  </p>
                </div>
                <SimpleMediaCapture
                  onCapture={(evidences) => {
                    console.log('📸 Captura de número de série:', evidences);
                    setFotosNumeroSerie(evidences);
                    setHasChanges(true);
                  }}
                  tipoEvidencia="numero_serie"
                  minFotos={1}
                  descricao="Capture quantas fotos/vídeos precisar do número de série do equipamento"
                  fotosExistentes={fotosNumeroSerie}
                  disabled={false}
                />
              </div>
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
             
             {/* Outras evidências opcionais - logo após as observações */}
             <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
               <div className="mb-3">
                 <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                   <Camera className="w-4 h-4" />
                   Outras Evidências
                   <Badge className="bg-gray-100 text-gray-800 text-xs">Opcional</Badge>
                 </h4>
                 <p className="text-xs text-gray-700 mt-1">
                   Capture fotos/vídeos adicionais relevantes para a vistoria
                 </p>
               </div>
               <SimpleMediaCapture
                 onCapture={(evidences) => {
                   console.log('📸 Outras evidências capturadas:', evidences);
                   setFotosOutrasEvidencias(evidences);
                   setHasChanges(true);
                 }}
                 tipoEvidencia="outro"
                 minFotos={0}
                 descricao="Fotos adicionais relevantes para a vistoria"
                 fotosExistentes={fotosOutrasEvidencias}
                 disabled={false}
               />
             </div>
           </div>
          )}
        </CardContent>
      </Card>

      {/* INDICADOR DE PROGRESSO DE UPLOAD */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Enviando evidências para o servidor...</span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(uploadProgress).map(([key, progress]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>
                        {key.includes('numero_serie') ? 'Número de Série' :
                         key.includes('local_instalacao') ? 'Local de Instalação' :
                         'Outras Evidências'} {key.split('_').pop()}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DESPESAS DO ITEM */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Despesas do Item
              <Badge className="bg-gray-100 text-gray-800 text-xs">Opcional</Badge>
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDespesa}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar Despesa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {despesas.length > 0 ? (
            <div className="space-y-4">
              {/* Lista de despesas */}
              <div className="space-y-3">
                {despesas.map((despesa) => (
                  <div 
                    key={despesa.id}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                                                     <Badge 
                             variant="outline" 
                             className="text-xs"
                           >
                             {despesa.tipo === 'SERVICO' && '🔧 Serviço'}
                             {despesa.tipo === 'MATERIAL' && '📦 Material'}
                             {despesa.tipo === 'DESLOCAMENTO' && '🚗 Deslocamento'}
                             {despesa.tipo === 'OUTROS' && '📄 Outros'}
                           </Badge>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(despesa.valor)}
                          </span>
                          {despesa.aprovada && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Aprovada
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {despesa.descricao}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(despesa.timestamp).toLocaleString('pt-BR')}
                        </p>
                        {despesa.comprovante && (
                          <div className="mt-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              📎 Comprovante anexado
                            </Badge>
                          </div>
                        )}
                      </div>
                      {!readOnly && !despesa.aprovada && (
                        <div className="flex gap-1 ml-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDespesa(despesa)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDespesa(despesa.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total das despesas */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total das Despesas:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(totalDespesas)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhuma despesa registrada para este item</p>
              {!readOnly && (
                <p className="text-xs mt-1">
                  Clique em "Adicionar Despesa" para registrar gastos relacionados a este item
                </p>
              )}
            </div>
          )}

          {/* Formulário de despesa */}
          {showDespesaForm && (
            <div className="mt-6 pt-6 border-t">
              <DespesaForm
                despesa={editingDespesa}
                vistoriaId={item.vistoriaId}
                itemId={item.id}
                onSave={handleSaveDespesa}
                onCancel={handleCancelDespesa}
                readOnly={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOTÕES DE AÇÃO */}
      {!readOnly && (
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 border rounded-lg shadow-lg">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !isFormValid() || isUploading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {Object.keys(uploadProgress).length > 0 ? 
                  `Enviando evidências... (${Math.round(Object.values(uploadProgress).reduce((acc, val) => acc + val, 0) / Object.values(uploadProgress).length)}%)` :
                  'Salvando...'
                }
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar e Concluir Item
              </>
            )}
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