'use client';

import React, { useState, useEffect } from 'react';
import { VistoriaItem } from '@/types/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleMediaCapture, MediaFile } from '@/components/media/SimpleMediaCapture';
import { DespesaForm } from '@/components/despesas';
import { Despesa } from '@/types/storage';
import { UploadService } from '@/services/uploadService';
import { DespesaService } from '@/services/despesas/DespesaService';
// Remover useAuth para evitar erro - usar token diretamente se necessário
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
  Receipt,
  Plus,
  Edit,
  X
} from 'lucide-react';

interface ItemEditModalProps {
  item: VistoriaItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedItem: VistoriaItem) => void;
}

export function ItemEditModal({ item, open, onClose, onSave }: ItemEditModalProps) {
  const [editedItem, setEditedItem] = useState<VistoriaItem>(item || {} as VistoriaItem);
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
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | undefined>(undefined);

  // Token será obtido do localStorage se necessário
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (item) {
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
    }
  }, [item]);

  const handleFieldChange = (field: string, value: any) => {
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
    console.log('🚀 ItemEditModal.handleSave: INICIANDO');
    
    if (!validateItem()) {
      console.log('❌ ItemEditModal.handleSave: Validação falhou');
      return;
    }

    console.log('✅ ItemEditModal.handleSave: Validação passou, definindo estados');
    setIsUploading(true);
    setUploadProgress({});

    try {
      console.log('🔄 ItemEditModal.handleSave: Iniciando salvamento com upload de evidências', {
        fotosNumeroSerie: fotosNumeroSerie.length,
        fotosLocalInstalacao: fotosLocalInstalacao.length,
        fotosOutrasEvidencias: fotosOutrasEvidencias.length
      });

      console.log('📤 ItemEditModal.handleSave: Iniciando uploads em paralelo...');

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
            referencia: `item_${item?.id}_numero_serie`,
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
            referencia: `item_${item?.id}_local_instalacao`,
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
            referencia: `item_${item?.id}_outras`,
            onProgress: (fileIndex, progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [`outras_${fileIndex}`]: progress.percentage
              }));
            }
          }) : Promise.resolve([])
      ]);

      console.log('🎉 ItemEditModal.handleSave: Promise.all concluído!');
      console.log('✅ ItemEditModal.handleSave: Uploads concluídos', {
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

      onSave(updatedItem);
      setHasChanges(false);
      onClose();
      
      console.log('✅ ItemEditModal: Item salvo com evidências no backend', {
        itemId: item?.id,
        evidenciasBackend: fotosVideosBackend.length,
        evidenciasLocais: fotosNumeroSerie.length + fotosLocalInstalacao.length + fotosOutrasEvidencias.length
      });

    } catch (error) {
      console.error('💥 ItemEditModal.handleSave: ERRO CAPTURADO no catch:', error);
      console.error('❌ ItemEditModal.handleSave: Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
      
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

      onSave(updatedItem);
      setHasChanges(false);
      onClose();
      
      alert('Erro no upload das evidências, mas os dados foram salvos localmente. As evidências serão enviadas na próxima sincronização.');
      
    } finally {
      console.log('🏁 ItemEditModal.handleSave: FINALLY - Limpando estados');
      setIsUploading(false);
      setUploadProgress({});
      console.log('✅ ItemEditModal.handleSave: Estados limpos, função concluída');
    }
  };

  const copyToExecuted = (plannedField: string, executedField: string) => {
    const plannedValue = (editedItem as any)[plannedField];
    if (plannedValue) {
      handleFieldChange(executedField, plannedValue);
    }
  };

  // Funções para gerenciar despesas simplificadas
  const handleAddDespesa = () => {
    setEditingDespesa(undefined);
    setShowDespesaForm(true);
  };

  const handleEditDespesa = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setShowDespesaForm(true);
  };

  const handleSaveDespesa = async (novaDespesa: Omit<Despesa, 'id'>) => {
    try {
      console.log('🔄 ItemEditModal.handleSaveDespesa: Salvando despesa', novaDespesa);
      
      let despesaComId: Despesa;
      
      // Se temos token, tentar salvar no backend primeiro
      if (token) {
        console.log('🔄 ItemEditModal.handleSaveDespesa: Enviando para o backend...');
        const result = await DespesaService.adicionarDespesa(
          (item as any)?.vistoriaId,
          novaDespesa,
          token
        );
        
        if (result.success && result.despesa) {
          console.log('✅ ItemEditModal.handleSaveDespesa: Salvo no backend com sucesso', result);
          
          // Converter do formato do backend para o formato do frontend
          despesaComId = DespesaService.convertFromBackend(result.despesa);
          
          console.log('✅ ItemEditModal.handleSaveDespesa: Despesa convertida', despesaComId);
        } else {
          console.warn('⚠️ ItemEditModal.handleSaveDespesa: Erro no backend, salvando localmente', result.error);
          // Fallback para salvar localmente
          despesaComId = {
            ...novaDespesa,
            id: editingDespesa?.id || `despesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
      } else {
        // Sem token, salvar localmente
        console.log('🔄 ItemEditModal.handleSaveDespesa: Salvando localmente (sem token)');
        despesaComId = {
          ...novaDespesa,
          id: editingDespesa?.id || `despesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

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
      
    } catch (error) {
      console.error('❌ ItemEditModal.handleSaveDespesa: Erro ao salvar despesa', error);
      alert('Erro ao salvar despesa. Tente novamente.');
    }
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

  if (!open || !item) return null;

  const itemData = editedItem as any;
  const acao = itemData.acao?.toUpperCase();
  const needsPlannedLocation = ['REMOVER', 'MANUTENCAO', 'SUBSTITUIR'].includes(acao);

  return (
    <>
      {/* Overlay otimizado para mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 touch-none"
        onClick={onClose}
      />
      
      {/* Modal COMPLETAMENTE OTIMIZADO PARA MOBILE */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Container que ocupa toda a tela no mobile, modal centralizado no desktop */}
        <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl sm:rounded-lg shadow-xl overflow-hidden flex flex-col">
          
          {/* Header FIXO - otimizado para touch */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getActionIcon(acao)}
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {getActionLabel(acao)} {itemData.tipo || 'Equipamento'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {typeof editedItem.categoria === 'object' 
                    ? (editedItem.categoria as any)?.descricao || 'Equipamento'
                    : editedItem.categoria
                  } - {typeof editedItem.fabricante === 'object' 
                    ? (editedItem.fabricante as any)?.nome || 'Fabricante'
                    : editedItem.fabricante
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(itemData.status_item || itemData.status || 'PENDENTE')}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isUploading}
                className="h-9 w-9 p-0 touch-manipulation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content SCROLLÁVEL - área principal */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-32 sm:pb-6">
              
              {/* 1. INSTRUÇÕES PARA O TÉCNICO */}
              {itemData.observacoes_planejadas && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Instruções para a Vistoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-3 sm:p-4 rounded border border-blue-200">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap font-medium text-blue-900">
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
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    Localização do Equipamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 3. Local Planejado */}
                  {needsPlannedLocation && itemData.local_instalacao_planejado && (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">
                        Local Onde o Equipamento Foi Instalado/Escondido
                      </Label>
                      <p className="text-xs sm:text-sm font-medium mt-1 text-gray-900">
                        {itemData.local_instalacao_planejado}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 Localização original do equipamento no veículo
                      </p>
                    </div>
                  )}

                  {/* 4. Local Executado - OTIMIZADO PARA TOUCH */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label htmlFor="local_instalacao_executado" className="text-sm font-medium flex-1">
                        {acao === 'INSTALAR' ? 'Local Onde Instalou o Equipamento' : 'Local Onde Executou a Ação'} *
                      </Label>
                      {needsPlannedLocation && itemData.local_instalacao_planejado && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToExecuted('local_instalacao_planejado', 'local_instalacao_executado')}
                          className="h-8 px-3 text-xs touch-manipulation"
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
                      className={`h-12 text-base touch-manipulation ${validationErrors.local_instalacao_executado ? 'border-red-500' : ''}`}
                      maxLength={255}
                    />
                    {validationErrors.local_instalacao_executado && (
                      <p className="text-sm text-red-600">{validationErrors.local_instalacao_executado}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      📸 <strong>IMPORTANTE:</strong> Tire foto do equipamento e do local onde foi instalado/escondido
                    </p>
                    
                    {/* Captura de foto do local - OTIMIZADA PARA MOBILE */}
                    <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
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
                </CardContent>
              </Card>

              {/* 5. NÚMERO DE SÉRIE */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                    Número de Série do Equipamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Número de série planejado */}
                  {itemData.numero_serie_planejado && (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">
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

                  {/* Número de série executado - OTIMIZADO PARA MOBILE */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label htmlFor="numero_serie_executado" className="text-sm font-medium flex-1">
                        Número de Série Executado *
                      </Label>
                      {itemData.numero_serie_planejado && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToExecuted('numero_serie_planejado', 'numero_serie_executado')}
                          className="h-8 px-3 text-xs touch-manipulation"
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
                      className={`h-12 text-base font-mono touch-manipulation ${validationErrors.numero_serie_executado ? 'border-red-500' : ''}`}
                      maxLength={30}
                    />
                    {validationErrors.numero_serie_executado && (
                      <p className="text-sm text-red-600">{validationErrors.numero_serie_executado}</p>
                    )}
                    
                    {/* Captura de foto do número de série - OTIMIZADA PARA MOBILE */}
                    <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                </CardContent>
              </Card>

              {/* 6. OBSERVAÇÕES DO TÉCNICO */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Observações do Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label htmlFor="observacoes_tecnico" className="text-sm font-medium">
                      Suas Considerações (Dificuldades, Detalhes Relevantes) *
                    </Label>
                    <textarea
                      id="observacoes_tecnico"
                      value={itemData.observacoes_tecnico || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('observacoes_tecnico', e.target.value)}
                      placeholder="Descreva dificuldades encontradas, detalhes importantes, condições do veículo, etc..."
                      rows={4}
                      className={`w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none ${validationErrors.observacoes_tecnico ? 'border-red-500' : ''}`}
                      maxLength={500}
                    />
                    {validationErrors.observacoes_tecnico && (
                      <p className="text-sm text-red-600">{validationErrors.observacoes_tecnico}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Obrigatório. Registre suas considerações sobre a execução. Máx: 500 caracteres.
                    </p>
                    
                    {/* Outras evidências opcionais - OTIMIZADA PARA MOBILE */}
                    <div className="mt-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                </CardContent>
              </Card>

              {/* INDICADOR DE PROGRESSO DE UPLOAD - MOBILE OPTIMIZED */}
              {isUploading && Object.keys(uploadProgress).length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-800">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium text-sm">Enviando evidências...</span>
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
            </div>
          </div>

          {/* Footer FIXO - OTIMIZADO PARA MOBILE */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="order-2 sm:order-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !isFormValid() || isUploading}
                className="order-1 sm:order-2 h-12 sm:h-10 text-base sm:text-sm bg-green-600 hover:bg-green-700 touch-manipulation flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {Object.keys(uploadProgress).length > 0 ? 
                      `Enviando... (${Math.round(Object.values(uploadProgress).reduce((acc, val) => acc + val, 0) / Object.values(uploadProgress).length)}%)` :
                      'Salvando...'
                    }
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar e Concluir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 