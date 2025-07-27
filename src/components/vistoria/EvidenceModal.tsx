'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, Camera } from 'lucide-react';

interface EvidenceModalProps {
  item: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: any, fotos: any[]) => void;
}

export function EvidenceModal({ item, open, onClose, onSave }: EvidenceModalProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('📸 Salvando evidências para item:', item?.id);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Por enquanto, apenas simular sem captura real
      onSave(item, []);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar evidências:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatItemInfo = (item: any) => {
    const parts = [];
    if (item?.categoria && typeof item.categoria === 'object' && item.categoria.descricao) {
      parts.push(item.categoria.descricao);
    }
    if (item?.fabricante && typeof item.fabricante === 'object' && item.fabricante.nome) {
      parts.push(item.fabricante.nome);
    }
    return parts.join(' - ') || 'Item sem descrição';
  };

  if (!open || !item) return null;

  return (
    <>
      {/* Overlay otimizado para mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 touch-none"
        onClick={onClose}
      />
      
      {/* Modal OTIMIZADO PARA MOBILE */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl sm:rounded-lg shadow-xl overflow-hidden flex flex-col">
          
          {/* Header FIXO */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Camera className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Adicionar Evidências
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {formatItemInfo(item)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="h-9 w-9 p-0 touch-manipulation flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content SCROLLÁVEL */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 sm:p-6 pb-32 sm:pb-6">
              
              {/* Placeholder para captura de evidências */}
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Captura de Evidências
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  A funcionalidade de captura será implementada em breve
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 📷 Fotos do número de série</p>
                  <p>• 📍 Fotos do local de instalação</p>
                  <p>• 📋 Outras evidências</p>
                </div>
              </div>

              {/* Observações temporárias */}
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Em Desenvolvimento
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  O modal de evidências está funcional, mas a integração com SimpleMediaCapture 
                  será implementada após resolver as dependências de componentes UI.
                </p>
              </div>
            </div>
          </div>

          {/* Footer FIXO - OTIMIZADO PARA MOBILE */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={saving}
                className="order-2 sm:order-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="order-1 sm:order-2 h-12 sm:h-10 text-base sm:text-sm touch-manipulation flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar (Demo)'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 