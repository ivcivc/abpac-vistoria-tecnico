'use client';

import React, { useState, useEffect } from 'react';
import { VistoriaItem } from '@/types/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileEvidenceCapture, MediaFile } from '@/components/mobile/MobileEvidenceCapture';
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
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface MobileItemEditProps {
  item: {
    id: string;
    categoria?: { descricao: string; };
    fabricante?: { nome: string; };
    acao?: string;
    numeroSerie?: string;
    observacoes?: string;
    status?: string;
    concluido?: boolean;
    estoque_remessa_id?: number;
  };
  itemIndex: number;
  totalItems: number;
  vistoriaInfo: { local: string; id: string; };
  onSave: (item: any, updatedData: any) => Promise<void>;
  onBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onCaptureEvidence?: (item: any) => void;
  isLoading?: boolean;
}

export function MobileItemEdit({
  item, itemIndex, totalItems, vistoriaInfo, onSave, onBack, onPrevious, onNext, onCaptureEvidence, isLoading = false
}: MobileItemEditProps) {
  const [editedItem, setEditedItem] = useState<VistoriaItem>(item as VistoriaItem || {} as VistoriaItem);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estados para rastrear fotos capturadas - MESMOS DO MODAL
  const [fotosNumeroSerie, setFotosNumeroSerie] = useState<MediaFile[]>([]);
  const [fotosLocalInstalacao, setFotosLocalInstalacao] = useState<MediaFile[]>([]);
  const [fotosOutrasEvidencias, setFotosOutrasEvidencias] = useState<MediaFile[]>([]);
  
  // Estados para upload - MESMOS DO MODAL
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Token será obtido do localStorage se necessário - MESMO DO MODAL
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (item) {
      setEditedItem(item as VistoriaItem);
      setHasChanges(false);
      setValidationErrors({});
      // Reset das fotos quando item mudar - MESMO DO MODAL
      setFotosNumeroSerie([]);
      setFotosLocalInstalacao([]);
      setFotosOutrasEvidencias([]);
    }
  }, [item]);

  // MESMA FUNÇÃO handleFieldChange DO MODAL
  const handleFieldChange = (field: string, value: any) => {
    const updatedItem = { ...editedItem, [field]: value };
    setEditedItem(updatedItem);
    setHasChanges(true);

    // Validação instantânea para campos específicos - MESMA DO MODAL
    const newErrors = { ...validationErrors };
    
    // Limpar erro atual do campo
    delete newErrors[field];

    // Validação instantânea baseada no campo - MESMA DO MODAL
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    switch (field) {
      case 'observacoes_tecnico':
        if (!trimmedValue) {
          newErrors[field] = 'Observações do técnico são obrigatórias';
        } else if (trimmedValue.length < 10) {
          newErrors[field] = 'Observações devem ter pelo menos 10 caracteres';
        } else if (trimmedValue.length > 500) {
          newErrors[field] = 'Observações não podem exceder 500 caracteres';
        }
        break;

      case 'numero_serie_executado':
        if (!trimmedValue) {
          // Só mostrar erro se a ação requer número de série
          const acao = (updatedItem as any).acao?.toUpperCase();
          if (acao === 'INSTALAR' || acao === 'SUBSTITUIR') {
            newErrors[field] = `Número de série é obrigatório para ${acao.toLowerCase()}`;
          }
        } else if (trimmedValue.length < 3) {
          newErrors[field] = 'Número de série deve ter pelo menos 3 caracteres';
        } else if (trimmedValue.length > 50) {
          newErrors[field] = 'Número de série não pode exceder 50 caracteres';
        } else if (!/^[A-Za-z0-9\-_.\s]+$/.test(trimmedValue)) {
          newErrors[field] = 'Número de série deve conter apenas letras, números, hífen, underscore e espaços';
        }
        break;

      case 'local_instalacao_executado':
        if (!trimmedValue) {
          // Verificar se é obrigatório baseado na ação
          const acao = (updatedItem as any).acao?.toUpperCase();
          if (['INSTALAR', 'SUBSTITUIR', 'REMOVER', 'MANUTENCAO'].includes(acao)) {
            newErrors[field] = 'Local de instalação é obrigatório';
          }
        } else if (trimmedValue.length < 5) {
          newErrors[field] = 'Local deve ter pelo menos 5 caracteres';
        } else if (trimmedValue.length > 100) {
          newErrors[field] = 'Local não pode exceder 100 caracteres';
        }
        break;

      case 'status_item':
        // Aceitar múltiplos formatos de status (maiúscula, minúscula, etc.)
        const validStatuses = [
          'PENDENTE', 'pendente', 'CONCLUIDO', 'concluido', 
          'PROBLEMA', 'problema', 'CANCELADO', 'cancelado',
          'EM_EXECUCAO', 'em_execucao'
        ];
        if (!value || !validStatuses.includes(value)) {
          newErrors[field] = 'Status inválido';
        }
        break;
    }

    setValidationErrors(newErrors);
  };

  // MESMA FUNÇÃO validateItem DO MODAL
  const validateItem = (): boolean => {
    const errors: Record<string, string> = {};

    // Validação de observações do técnico (sempre obrigatórias) - MESMA DO MODAL
    const observacoes = (editedItem as any).observacoes_tecnico?.trim();
    if (!observacoes) {
      errors.observacoes_tecnico = 'Observações do técnico são obrigatórias';
    } else if (observacoes.length < 10) {
      errors.observacoes_tecnico = 'Observações devem ter pelo menos 10 caracteres';
    } else if (observacoes.length > 500) {
      errors.observacoes_tecnico = 'Observações não podem exceder 500 caracteres';
    }

    // Validações para INSTALAR - MESMAS DO MODAL
    if ((editedItem as any).acao === 'INSTALAR') {
      // Validação do número de série
      const numeroSerie = (editedItem as any).numero_serie_executado?.trim();
      if (!numeroSerie) {
        errors.numero_serie_executado = 'Número de série executado é obrigatório para instalações';
      } else if (numeroSerie.length < 3) {
        errors.numero_serie_executado = 'Número de série deve ter pelo menos 3 caracteres';
      } else if (numeroSerie.length > 50) {
        errors.numero_serie_executado = 'Número de série não pode exceder 50 caracteres';
      } else if (!/^[A-Za-z0-9\-_.\s]+$/.test(numeroSerie)) {
        errors.numero_serie_executado = 'Número de série deve conter apenas letras, números, hífen, underscore e espaços';
      }

      // Validação do local de instalação
      const localInstalacao = (editedItem as any).local_instalacao_executado?.trim();
      if (!localInstalacao) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório para instalações';
      } else if (localInstalacao.length < 5) {
        errors.local_instalacao_executado = 'Local de instalação deve ter pelo menos 5 caracteres';
      } else if (localInstalacao.length > 100) {
        errors.local_instalacao_executado = 'Local de instalação não pode exceder 100 caracteres';
      }

      // Validação de evidências obrigatórias para instalação
      if (fotosNumeroSerie.length === 0) {
        errors.fotos_numero_serie = 'Pelo menos 1 foto do número de série é obrigatória para instalações';
      } else if (fotosNumeroSerie.length > 5) {
        errors.fotos_numero_serie = 'Máximo de 5 fotos do número de série permitidas';
      }

      if (fotosLocalInstalacao.length === 0) {
        errors.fotos_local_instalacao = 'Pelo menos 1 foto do local de instalação é obrigatória para instalações';
      } else if (fotosLocalInstalacao.length > 5) {
        errors.fotos_local_instalacao = 'Máximo de 5 fotos do local de instalação permitidas';
      }
    }

    // Validações para SUBSTITUIR - MESMAS DO MODAL
    if ((editedItem as any).acao === 'SUBSTITUIR') {
      // Validação do número de série (novo equipamento)
      const numeroSerie = (editedItem as any).numero_serie_executado?.trim();
      if (!numeroSerie) {
        errors.numero_serie_executado = 'Número de série do novo equipamento é obrigatório para substituições';
      } else if (numeroSerie.length < 3) {
        errors.numero_serie_executado = 'Número de série deve ter pelo menos 3 caracteres';
      } else if (numeroSerie.length > 50) {
        errors.numero_serie_executado = 'Número de série não pode exceder 50 caracteres';
      } else if (!/^[A-Za-z0-9\-_.\s]+$/.test(numeroSerie)) {
        errors.numero_serie_executado = 'Número de série deve conter apenas letras, números, hífen, underscore e espaços';
      }

      // Validação do local de instalação
      const localInstalacao = (editedItem as any).local_instalacao_executado?.trim();
      if (!localInstalacao) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório para substituições';
      } else if (localInstalacao.length < 5) {
        errors.local_instalacao_executado = 'Local de instalação deve ter pelo menos 5 caracteres';
      } else if (localInstalacao.length > 100) {
        errors.local_instalacao_executado = 'Local de instalação não pode exceder 100 caracteres';
      }

      // Validação de evidências obrigatórias para substituição
      if (fotosNumeroSerie.length === 0) {
        errors.fotos_numero_serie = 'Pelo menos 1 foto do número de série do novo equipamento é obrigatória';
      } else if (fotosNumeroSerie.length > 5) {
        errors.fotos_numero_serie = 'Máximo de 5 fotos do número de série permitidas';
      }

      if (fotosLocalInstalacao.length === 0) {
        errors.fotos_local_instalacao = 'Pelo menos 1 foto do local após substituição é obrigatória';
      } else if (fotosLocalInstalacao.length > 5) {
        errors.fotos_local_instalacao = 'Máximo de 5 fotos do local de instalação permitidas';
      }
    }

    // Validações para REMOVER e MANUTENCAO - MESMAS DO MODAL
    if ((editedItem as any).acao === 'REMOVER' || (editedItem as any).acao === 'MANUTENCAO') {
      const localInstalacao = (editedItem as any).local_instalacao_executado?.trim();
      if (!localInstalacao) {
        errors.local_instalacao_executado = 'Local de instalação executado é obrigatório';
      } else if (localInstalacao.length < 5) {
        errors.local_instalacao_executado = 'Local deve ter pelo menos 5 caracteres';
      } else if (localInstalacao.length > 100) {
        errors.local_instalacao_executado = 'Local não pode exceder 100 caracteres';
      }

      // Validação de evidências para REMOVER/MANUTENCAO
      if (fotosLocalInstalacao.length === 0) {
        errors.fotos_local_instalacao = `Pelo menos 1 foto do local é obrigatória para ${(editedItem as any).acao?.toLowerCase()}`;
      } else if (fotosLocalInstalacao.length > 5) {
        errors.fotos_local_instalacao = 'Máximo de 5 fotos do local permitidas';
      }
    }

    // Validação do status do item - MESMA DO MODAL
    const status_item = (editedItem as any).status_item;
    const validStatuses = [
      'PENDENTE', 'pendente', 'CONCLUIDO', 'concluido', 
      'PROBLEMA', 'problema', 'CANCELADO', 'cancelado',
      'EM_EXECUCAO', 'em_execucao'
    ];
    if (!status_item || !validStatuses.includes(status_item)) {
      errors.status_item = 'Status inválido';
    }

    // Validação de evidências adicionais - MESMA DO MODAL
    if (fotosOutrasEvidencias.length > 10) {
      errors.outras_evidencias = 'Máximo de 10 evidências adicionais permitidas';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // MESMA FUNÇÃO isFormValid DO MODAL
  const isFormValid = (): boolean => {
    const acao = (editedItem as any).acao?.toUpperCase();
    const observacoes = (editedItem as any).observacoes_tecnico?.trim();
    const numeroSerie = (editedItem as any).numero_serie_executado?.trim();
    const localInstalacao = (editedItem as any).local_instalacao_executado?.trim();
    const status_item = (editedItem as any).status_item;
    
    // Verificar se a vistoria permite edição - MESMO DO MODAL
    const authState = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem('vistoria_auth_state') || '{}') : {};
    const currentVistoria = authState?.currentVistoria || {};
    const vistoriaStatus = currentVistoria?.status;
    const podeEditarVistoria = ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'].includes(vistoriaStatus);
    
    // Verificar se item está cancelado - MESMO DO MODAL
    const itemCancelado = status_item === 'CANCELADO' || status_item === 'cancelado';
    const podeEditar = podeEditarVistoria && !itemCancelado;
    
    console.log('🔍 MobileItemEdit.isFormValid: Verificando validação', {
      acao,
      hasValidationErrors: Object.keys(validationErrors).length > 0,
      validationErrors,
      observacoes: observacoes?.length || 0,
      numeroSerie: numeroSerie?.length || 0,
      localInstalacao: localInstalacao?.length || 0,
      status_item,
      vistoriaStatus,
      podeEditarVistoria,
      itemCancelado,
      podeEditar,
      fotosNumeroSerie: fotosNumeroSerie.length,
      fotosLocalInstalacao: fotosLocalInstalacao.length,
      fotosOutrasEvidencias: fotosOutrasEvidencias.length
    });

    // Verificar se a vistoria permite edição - MESMO DO MODAL
    if (!podeEditarVistoria) {
      console.log('❌ isFormValid: FALHOU - Vistoria não permite edição', { 
        vistoriaStatus, 
        requiredStatus: ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'] 
      });
      return false;
    }
    
    // Verificar se o item não está cancelado - MESMO DO MODAL
    if (itemCancelado) {
      console.log('❌ isFormValid: FALHOU - Item cancelado não pode ser editado', { 
        status_item 
      });
      return false;
    }

    // Se há erros de validação, formulário é inválido - MESMO DO MODAL
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ isFormValid: FALHOU - Há erros de validação');
      return false;
    }
    
    // Observações do técnico são sempre obrigatórias - MESMO DO MODAL
    if (!observacoes || observacoes.length < 10) {
      console.log('❌ isFormValid: FALHOU - Observações insuficientes', { observacoes: observacoes?.length || 0 });
      return false;
    }

    // Validações específicas por ação - MESMAS DO MODAL
    if (acao === 'INSTALAR' || acao === 'SUBSTITUIR') {
      if (!numeroSerie || numeroSerie.length < 3) {
        console.log('❌ isFormValid: FALHOU - Número de série insuficiente', { numeroSerie: numeroSerie?.length || 0 });
        return false;
      }
      if (!localInstalacao || localInstalacao.length < 5) {
        console.log('❌ isFormValid: FALHOU - Local de instalação insuficiente', { localInstalacao: localInstalacao?.length || 0 });
        return false;
      }
      
      // Validar fotos obrigatórias para INSTALAR/SUBSTITUIR
      if (fotosNumeroSerie.length < 1 || fotosLocalInstalacao.length < 1) {
        console.log('❌ isFormValid: FALHOU - Fotos insuficientes para INSTALAR/SUBSTITUIR', {
          fotosNumeroSerie: fotosNumeroSerie.length,
          fotosLocalInstalacao: fotosLocalInstalacao.length
        });
        return false;
      }
    }

    if (acao === 'REMOVER' || acao === 'MANUTENCAO') {
      if (!localInstalacao || localInstalacao.length < 5) {
        console.log('❌ isFormValid: FALHOU - Local de instalação insuficiente para REMOVER/MANUTENCAO', { localInstalacao: localInstalacao?.length || 0 });
        return false;
      }
      
      // Validar foto obrigatória do local para REMOVER/MANUTENCAO
      if (fotosLocalInstalacao.length < 1) {
        console.log('❌ isFormValid: FALHOU - Fotos do local insuficientes para REMOVER/MANUTENCAO', {
          fotosLocalInstalacao: fotosLocalInstalacao.length
        });
        return false;
      }
    }

    console.log('✅ isFormValid: PASSOU - Formulário válido');
    return true;
  };

  // MESMA FUNÇÃO handleSave DO MODAL, mas adaptada para mobile
  const handleSave = async () => {
    console.log('🚀 MobileItemEdit.handleSave: INICIANDO');
    
    if (!validateItem()) {
      console.log('❌ MobileItemEdit.handleSave: Validação falhou');
      return;
    }

    console.log('✅ MobileItemEdit.handleSave: Validação passou, definindo estados');
    setIsUploading(true);
    setUploadProgress({});

    try {
      console.log('🔄 MobileItemEdit.handleSave: Iniciando salvamento com upload de evidências', {
        fotosNumeroSerie: fotosNumeroSerie.length,
        fotosLocalInstalacao: fotosLocalInstalacao.length,
        fotosOutrasEvidencias: fotosOutrasEvidencias.length
      });

      console.log('📤 MobileItemEdit.handleSave: Iniciando uploads em paralelo...');

      // Fazer upload das evidências - MESMO DO MODAL
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

      console.log('🎉 MobileItemEdit.handleSave: Promise.all concluído!');
      console.log('✅ MobileItemEdit.handleSave: Uploads concluídos', {
        numeroSerie: numeroSerieUploaded.length,
        localInstalacao: localInstalacaoUploaded.length,
        outras: outrasEvidenciasUploaded.length
      });

      // Criar estrutura fotos_videos para o backend - MESMA DO MODAL
      const fotosVideosBackend = [
        ...numeroSerieUploaded,
        ...localInstalacaoUploaded,
        ...outrasEvidenciasUploaded
      ];

      // Quando salvar, automaticamente marca como CONCLUIDO - MESMO DO MODAL
      const updatedData = {
        ...editedItem,
        status_item: 'CONCLUIDO',
        concluido: true,
        dataConclusao: new Date(),
        // Campo fotos_videos usado pelo backend (JSON)
        fotos_videos: fotosVideosBackend,
        // Manter referências locais para compatibilidade
        fotos_numero_serie: fotosNumeroSerie,
        fotos_local_instalacao: fotosLocalInstalacao,
        fotos_outras_evidencias: fotosOutrasEvidencias
      };

      await onSave(item, updatedData);
      setHasChanges(false);
      
      console.log('✅ MobileItemEdit: Item salvo com evidências no backend', {
        itemId: item?.id,
        evidenciasBackend: fotosVideosBackend.length,
        evidenciasLocais: fotosNumeroSerie.length + fotosLocalInstalacao.length + fotosOutrasEvidencias.length
      });

      // Auto-navegar para próximo item ou voltar se for o último
      if (onNext && itemIndex < totalItems - 1) {
        onNext();
      } else {
        onBack();
      }

    } catch (error) {
      console.error('💥 MobileItemEdit.handleSave: ERRO CAPTURADO no catch:', error);
      console.error('❌ MobileItemEdit.handleSave: Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
      
      // Salvar mesmo com erro de upload - MESMO DO MODAL
      const updatedData = {
        ...editedItem,
        status_item: 'CONCLUIDO',
        concluido: true,
        dataConclusao: new Date(),
        // Manter apenas referências locais se upload falhou
        fotos_numero_serie: fotosNumeroSerie,
        fotos_local_instalacao: fotosLocalInstalacao,
        fotos_outras_evidencias: fotosOutrasEvidencias,
        // Marcar que houve erro no upload
        upload_error: error instanceof Error ? error.message : 'Erro no upload'
      };

      await onSave(item, updatedData);
      setHasChanges(false);
      
      alert('Erro no upload das evidências, mas os dados foram salvos localmente. As evidências serão enviadas na próxima sincronização.');
      
      // Auto-navegar mesmo com erro
      if (onNext && itemIndex < totalItems - 1) {
        onNext();
      } else {
        onBack();
      }
      
    } finally {
      console.log('🏁 MobileItemEdit.handleSave: FINALLY - Limpando estados');
      setIsUploading(false);
      setUploadProgress({});
      console.log('✅ MobileItemEdit.handleSave: Estados limpos, função concluída');
    }
  };

  // MESMA FUNÇÃO copyToExecuted DO MODAL
  const copyToExecuted = (plannedField: string, executedField: string) => {
    const plannedValue = (editedItem as any)[plannedField];
    if (plannedValue) {
      handleFieldChange(executedField, plannedValue);
    }
  };

  // MESMAS FUNÇÕES DE ÍCONES E LABELS DO MODAL
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

  const canGoNext = onNext && itemIndex < totalItems - 1;
  const canGoPrevious = onPrevious && itemIndex > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header Mobile FIXO - com navegação item-a-item */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Item {itemIndex + 1} de {totalItems}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {Array.from({ length: totalItems }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === itemIndex 
                      ? 'bg-primary-500' 
                      : i < itemIndex 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="h-9 w-9 p-0 touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!canGoNext}
              className="h-9 w-9 p-0 touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getActionIcon(acao)}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getActionLabel(acao)} {itemData.tipo || 'Equipamento'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {typeof editedItem.categoria === 'object' 
                ? (editedItem.categoria as any)?.descricao || 'Equipamento'
                : editedItem.categoria
              } - {typeof editedItem.fabricante === 'object' 
                ? (editedItem.fabricante as any)?.nome || 'Fabricante'
                : editedItem.fabricante
              }
            </p>
          </div>
          {getStatusBadge(itemData.status_item || itemData.status || 'PENDENTE')}
        </div>
      </div>

      {/* Content SCROLLÁVEL - MESMA ESTRUTURA DO MODAL */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-32">
          
          {/* 1. INSTRUÇÕES PARA O TÉCNICO - MESMA DO MODAL */}
          {itemData.observacoes_planejadas && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
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

          {/* 2. LOCALIZAÇÃO DO EQUIPAMENTO - MESMA DO MODAL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5" />
                Localização do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 3. Local Planejado - MESMO DO MODAL */}
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

              {/* 4. Local Executado - MESMO DO MODAL MAS OTIMIZADO PARA MOBILE */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="local_instalacao_executado" className="text-sm font-medium">
                    {acao === 'INSTALAR' ? 'Local Onde Instalou o Equipamento' : 'Local Onde Executou a Ação'} *
                  </Label>
                  {needsPlannedLocation && itemData.local_instalacao_planejado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToExecuted('local_instalacao_planejado', 'local_instalacao_executado')}
                      className="h-8 px-3 text-xs touch-manipulation self-start"
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
                
                {/* Captura de foto do local - MESMA DO MODAL */}
                <div className={`mt-4 p-4 rounded-lg border ${
                  validationErrors.fotos_local_instalacao 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="mb-3">
                    <h4 className={`text-sm font-medium flex items-center gap-2 ${
                      validationErrors.fotos_local_instalacao ? 'text-red-900' : 'text-green-900'
                    }`}>
                      <Camera className="w-4 h-4" />
                      Foto do Local de Instalação
                      {validationErrors.fotos_local_instalacao && (
                        <span className="text-red-600">*</span>
                      )}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      validationErrors.fotos_local_instalacao ? 'text-red-700' : 'text-green-700'
                    }`}>
                      Capture uma ou mais fotos do local onde o equipamento foi instalado/escondido
                    </p>
                    {validationErrors.fotos_local_instalacao && (
                      <p className="text-sm text-red-600 mt-1 font-medium">
                        {validationErrors.fotos_local_instalacao}
                      </p>
                    )}
                  </div>
                  <MobileEvidenceCapture
                    onCapture={(evidences: MediaFile[]) => {
                      console.log('📸 Captura do local de instalação:', evidences);
                      setFotosLocalInstalacao(evidences);
                      setHasChanges(true);
                      
                      // Validação instantânea de fotos do local de instalação - MESMA DO MODAL
                      const newErrors = { ...validationErrors };
                      delete newErrors.fotos_local_instalacao;
                      
                      const acao = (editedItem as any).acao?.toUpperCase();
                      if (['INSTALAR', 'SUBSTITUIR', 'REMOVER', 'MANUTENCAO'].includes(acao)) {
                        if (evidences.length === 0) {
                          newErrors.fotos_local_instalacao = `Pelo menos 1 foto do local é obrigatória para ${acao.toLowerCase()}`;
                        } else if (evidences.length > 5) {
                          newErrors.fotos_local_instalacao = 'Máximo de 5 fotos do local permitidas';
                        }
                      }
                      
                      setValidationErrors(newErrors);
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

          {/* 5. NÚMERO DE SÉRIE - MESMO DO MODAL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="w-5 h-5" />
                Número de Série do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Número de série planejado - MESMO DO MODAL */}
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

              {/* Número de série executado - MESMO DO MODAL MAS OTIMIZADO PARA MOBILE */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numero_serie_executado" className="text-sm font-medium">
                    Número de Série Executado *
                  </Label>
                  {itemData.numero_serie_planejado && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToExecuted('numero_serie_planejado', 'numero_serie_executado')}
                      className="h-8 px-3 text-xs touch-manipulation self-start"
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
                
                {/* Captura de foto do número de série - MESMA DO MODAL */}
                <div className={`mt-4 p-4 rounded-lg border ${
                  validationErrors.fotos_numero_serie 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="mb-3">
                    <h4 className={`text-sm font-medium flex items-center gap-2 ${
                      validationErrors.fotos_numero_serie ? 'text-red-900' : 'text-blue-900'
                    }`}>
                      <Camera className="w-4 h-4" />
                      Foto do Número de Série
                      {validationErrors.fotos_numero_serie && (
                        <span className="text-red-600">*</span>
                      )}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      validationErrors.fotos_numero_serie ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      Capture uma ou mais fotos claras do número de série digitado acima
                    </p>
                    {validationErrors.fotos_numero_serie && (
                      <p className="text-sm text-red-600 mt-1 font-medium">
                        {validationErrors.fotos_numero_serie}
                      </p>
                    )}
                  </div>
                  <MobileEvidenceCapture
                    onCapture={(evidences: MediaFile[]) => {
                      console.log('📸 Captura de número de série:', evidences);
                      setFotosNumeroSerie(evidences);
                      setHasChanges(true);
                      
                      // Validação instantânea de fotos do número de série - MESMA DO MODAL
                      const newErrors = { ...validationErrors };
                      delete newErrors.fotos_numero_serie;
                      
                      const acao = (editedItem as any).acao?.toUpperCase();
                      if (acao === 'INSTALAR' || acao === 'SUBSTITUIR') {
                        if (evidences.length === 0) {
                          newErrors.fotos_numero_serie = `Pelo menos 1 foto do número de série é obrigatória para ${acao.toLowerCase()}`;
                        } else if (evidences.length > 5) {
                          newErrors.fotos_numero_serie = 'Máximo de 5 fotos do número de série permitidas';
                        }
                      }
                      
                      setValidationErrors(newErrors);
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

          {/* 6. OBSERVAÇÕES DO TÉCNICO - MESMA DO MODAL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5" />
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
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Obrigatório. Registre suas considerações sobre a execução.</span>
                  <span>{(itemData.observacoes_tecnico || '').length}/500</span>
                </div>
                
                {/* Outras evidências opcionais - MESMA DO MODAL */}
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                  <MobileEvidenceCapture
                    onCapture={(evidences: MediaFile[]) => {
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

          {/* INDICADOR DE PROGRESSO DE UPLOAD - MESMO DO MODAL */}
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

      {/* Footer FIXO - Botões de Ação */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isUploading}
            className="flex-1 h-12 text-base touch-manipulation"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={(() => {
              const disabled = !hasChanges || !isFormValid() || isUploading;
              console.log('🔘 Botão Salvar:', {
                hasChanges,
                isFormValid: isFormValid(),
                isUploading,
                disabled
              });
              return disabled;
            })()}
            className="flex-2 h-12 text-base bg-green-600 hover:bg-green-700 touch-manipulation"
            style={{ flex: '2' }}
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
                {canGoNext ? 'Salvar e Continuar' : 'Salvar e Finalizar'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 