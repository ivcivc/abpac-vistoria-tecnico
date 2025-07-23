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
  Tag
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

  useEffect(() => {
    setEditedItem(item);
    setHasChanges(false);
    setValidationErrors({});
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

    // Validações baseadas na ação
    if (editedItem.acao === 'substituir') {
      if (!editedItem.numeroSerieNovo?.trim()) {
        errors.numeroSerieNovo = 'Número de série do novo equipamento é obrigatório para substituições';
      } else if (editedItem.numeroSerieNovo.trim().length < 3) {
        errors.numeroSerieNovo = 'Número de série deve ter pelo menos 3 caracteres';
      } else if (editedItem.numeroSerieNovo.trim().length > 30) {
        errors.numeroSerieNovo = 'Número de série deve ter no máximo 30 caracteres';
      }
    }

    // Validação para instalação - número de série é obrigatório
    if (editedItem.acao === 'instalar' && editedItem.status === 'concluido') {
      if (!editedItem.numeroSerie?.trim()) {
        errors.numeroSerie = 'Número de série é obrigatório para instalações concluídas';
      } else if (editedItem.numeroSerie.trim().length < 3) {
        errors.numeroSerie = 'Número de série deve ter pelo menos 3 caracteres';
      } else if (editedItem.numeroSerie.trim().length > 30) {
        errors.numeroSerie = 'Número de série deve ter no máximo 30 caracteres';
      }
    }

    // Validação de status concluído
    if (editedItem.status === 'concluido') {
      if (!editedItem.observacoes?.trim()) {
        errors.observacoes = 'Observações são obrigatórias para itens concluídos';
      }
    }

    // Validação de problemas
    if (editedItem.status === 'problema' && !editedItem.observacoes?.trim()) {
      errors.observacoes = 'Descreva o problema encontrado';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateItem()) {
      return;
    }

    const updatedItem = {
      ...editedItem,
      concluido: editedItem.status === 'concluido',
      dataConclusao: editedItem.status === 'concluido' ? new Date() : editedItem.dataConclusao
    };

    onUpdate(updatedItem);
    setHasChanges(false);
  };

  const getActionIcon = (acao: string) => {
    switch (acao) {
      case 'verificar': return <Eye className="w-4 h-4" />;
      case 'instalar': return <Package className="w-4 h-4" />;
      case 'substituir': return <Wrench className="w-4 h-4" />;
      case 'remover': return <Trash2 className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getActionLabel = (acao: string) => {
    switch (acao) {
      case 'verificar': return 'Verificar';
      case 'instalar': return 'Instalar';
      case 'substituir': return 'Substituir';
      case 'remover': return 'Remover';
      default: return acao;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Item */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getActionIcon(editedItem.acao)}
              <span>{getActionLabel(editedItem.acao)} {editedItem.tipo}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {typeof editedItem.categoria === 'object' 
                  ? (editedItem.categoria as any)?.descricao || (editedItem.categoria as any)?.nome || 'Categoria'
                  : editedItem.categoria
                }
              </Badge>
              <Badge variant="outline">
                                 {typeof editedItem.status === 'object' 
                   ? (editedItem.status as any)?.descricao || (editedItem.status as any)?.nome || 'Status'
                   : editedItem.status
                 }
              </Badge>
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
              <Label>Modelo</Label>
              <p className="text-sm font-medium">
                {typeof editedItem.modelo === 'object' 
                  ? (editedItem.modelo as any)?.nome || (editedItem.modelo as any)?.descricao || 'Não informado'
                  : editedItem.modelo || 'Não informado'
                }
              </p>
            </div>
          </div>

          {/* Número de série atual (para referência) */}
          {editedItem.numeroSerie && (
            <div>
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Número de Série Atual
              </Label>
              <p className="text-sm font-medium bg-gray-50 p-2 rounded border">
                {editedItem.numeroSerie}
              </p>
            </div>
          )}

          {!readOnly && (
            <>
              {/* Status do item */}
              <div className="space-y-2">
                <Label htmlFor="status">Status da Execução *</Label>
                <select
                  id="status"
                  value={editedItem.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendente">Pendente</option>
                  <option value="concluido">Concluído</option>
                  <option value="problema">Problema</option>
                </select>
              </div>

              {/* Campo para número de série - INSTALAÇÃO */}
              {editedItem.acao === 'instalar' && (
                <div className="space-y-2">
                  <Label htmlFor="numeroSerie" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Número de Série do Equipamento {editedItem.status === 'concluido' && '*'}
                  </Label>
                  <Input
                    id="numeroSerie"
                    value={editedItem.numeroSerie || ''}
                    onChange={(e) => handleFieldChange('numeroSerie', e.target.value.trim().toUpperCase())}
                    placeholder="Digite o número de série do equipamento instalado"
                    className={validationErrors.numeroSerie ? 'border-red-500' : ''}
                    maxLength={30}
                  />
                  {validationErrors.numeroSerie && (
                    <p className="text-sm text-red-600">{validationErrors.numeroSerie}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Obrigatório quando o status for "Concluído". Mín: 3, Máx: 30 caracteres.
                  </p>
                </div>
              )}

              {/* Campo para número de série novo - SUBSTITUIÇÃO */}
              {editedItem.acao === 'substituir' && (
                <div className="space-y-2">
                  <Label htmlFor="numeroSerieNovo" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Número de Série do Novo Equipamento *
                  </Label>
                  <Input
                    id="numeroSerieNovo"
                    value={editedItem.numeroSerieNovo || ''}
                    onChange={(e) => handleFieldChange('numeroSerieNovo', e.target.value.trim().toUpperCase())}
                    placeholder="Digite o número de série do equipamento substituto"
                    className={validationErrors.numeroSerieNovo ? 'border-red-500' : ''}
                    maxLength={30}
                  />
                  {validationErrors.numeroSerieNovo && (
                    <p className="text-sm text-red-600">{validationErrors.numeroSerieNovo}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Obrigatório para substituições. Mín: 3, Máx: 30 caracteres.
                  </p>
                </div>
              )}

              {/* Campo para local de instalação */}
              <div className="space-y-2">
                <Label htmlFor="localInstalacao">Local de Instalação</Label>
                <Input
                  id="localInstalacao"
                  value={editedItem.localInstalacao || ''}
                  onChange={(e) => handleFieldChange('localInstalacao', e.target.value)}
                  placeholder="Descreva onde o equipamento foi instalado"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500">
                  Opcional. Descreva o local exato onde o equipamento foi instalado.
                </p>
              </div>
            </>
          )}

          {/* Campos em modo somente leitura */}
          {readOnly && (
            <>
              {/* Número de série novo (somente leitura) */}
              {editedItem.numeroSerieNovo && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Número de Série Novo
                  </Label>
                  <p className="text-sm font-medium bg-green-50 p-2 rounded border border-green-200">
                    {editedItem.numeroSerieNovo}
                  </p>
                </div>
              )}

              {/* Local de instalação (somente leitura) */}
              {editedItem.localInstalacao && (
                <div>
                  <Label>Local de Instalação</Label>
                  <p className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {editedItem.localInstalacao}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readOnly ? (
            <div>
              <Label>Observações</Label>
              <p className="text-sm mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                {editedItem.observacoes || 'Nenhuma observação registrada'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                Observações {(editedItem.status === 'concluido' || editedItem.status === 'problema') && '*'}
              </Label>
              <textarea
                id="observacoes"
                value={editedItem.observacoes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('observacoes', e.target.value)}
                placeholder="Digite suas observações sobre este item..."
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.observacoes ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              {validationErrors.observacoes && (
                <p className="text-sm text-red-600">{validationErrors.observacoes}</p>
              )}
              <p className="text-xs text-gray-500">
                {editedItem.status === 'concluido' ? 'Obrigatório para itens concluídos.' : 
                 editedItem.status === 'problema' ? 'Obrigatório para descrever o problema.' : 'Opcional.'} 
                Máx: 500 caracteres.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidências - Placeholder para Task 13 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Evidências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Captura de evidências será implementada na Task 13</p>
            <p className="text-sm">Fotos e vídeos do número de série e local de instalação</p>
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      {!readOnly && (
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 border rounded-lg shadow-lg">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
          
          {editedItem.status === 'concluido' && (
            <Button
              onClick={handleSave}
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Concluir Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 