'use client';

import { useState, useEffect } from 'react';
import { ApprovalNotification as ApprovalNotificationType } from '@/services/vistoria/ApprovalStatusService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApprovalNotificationProps {
  notification: ApprovalNotificationType;
  onDismiss?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onViewDetails?: (vistoriaId: string) => void;
  className?: string;
}

/**
 * Componente para exibir notificacoes de aprovacao/rejeicao de vistorias
 * Task 20 - Notificacoes de aprovacao/rejeicao
 */
export function ApprovalNotification({ 
  notification, 
  onDismiss, 
  onMarkAsRead,
  onViewDetails,
  className = ""
}: ApprovalNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const isApproval = notification.tipo === 'aprovacao';
  const isRejection = notification.tipo === 'rejeicao';

  // Auto-marcar como lida apos alguns segundos se for aprovacao
  useEffect(() => {
    if (isApproval && !notification.lida) {
      const timer = setTimeout(() => {
        onMarkAsRead?.(notification.id);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isApproval, notification.lida, notification.id, onMarkAsRead]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead?.(notification.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(notification.vistoriaId);
    onMarkAsRead?.(notification.id);
  };

  const getCardStyle = () => {
    if (isApproval) {
      return "border-l-4 border-l-green-500 bg-green-50";
    } else if (isRejection) {
      return "border-l-4 border-l-red-500 bg-red-50";
    }
    return "border-l-4 border-l-blue-500 bg-blue-50";
  };

  const getTitleStyle = () => {
    if (isApproval) {
      return "text-green-800";
    } else if (isRejection) {
      return "text-red-800";
    }
    return "text-blue-800";
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}>
      <Card className={`relative ${getCardStyle()} shadow-lg hover:shadow-xl transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-3 text-lg ${getTitleStyle()}`}>
              <span className="text-2xl">
                {isApproval ? '✅' : isRejection ? '❌' : '⏳'}
              </span>
              {notification.titulo}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Badge de status */}
              {!notification.lida && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Nova
                </Badge>
              )}
              
              {/* Badge de tipo */}
              <Badge 
                variant={isApproval ? "default" : isRejection ? "destructive" : "secondary"}
                className="text-xs"
              >
                {isApproval ? 'Aprovada' : isRejection ? 'Rejeitada' : 'Pendente'}
              </Badge>
              
              {/* Botao fechar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                ✕
              </Button>
            </div>
          </div>
          
          {/* Data da notificacao */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            🕒 {formatDate(notification.dataNotificacao)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mensagem principal */}
          <p className="text-sm leading-relaxed">
            {notification.mensagem}
          </p>

          {/* Metadados expandiveis */}
          {notification.metadata && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs p-2 h-auto"
              >
                {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'} ℹ️
              </Button>

              {isExpanded && (
                <div className="border rounded-lg p-3 bg-white/50 space-y-2">
                  {/* Responsavel */}
                  {notification.metadata.responsavel && (
                    <div className="flex items-center gap-2 text-sm">
                      👤 <span className="font-medium">Responsavel:</span>
                      <span>{notification.metadata.responsavel}</span>
                    </div>
                  )}

                  {/* Motivo da rejeicao */}
                  {notification.metadata.motivoRejeicao && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        ⚠️ <span className="font-medium text-red-700">Motivo da rejeicao:</span>
                      </div>
                      <p className="text-sm text-red-600 ml-6 bg-red-50 p-2 rounded border">
                        {notification.metadata.motivoRejeicao}
                      </p>
                    </div>
                  )}

                  {/* Observacoes */}
                  {notification.metadata.observacoes && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        📝 <span className="font-medium">Observacoes:</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6 bg-gray-50 p-2 rounded border">
                        {notification.metadata.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                ID da Vistoria: {notification.vistoriaId}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Ver detalhes da vistoria */}
                <Button
                  onClick={handleViewDetails}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  👁️ Ver Vistoria
                </Button>

                {/* Marcar como lida */}
                {!notification.lida && (
                  <Button
                    onClick={handleMarkAsRead}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    ✅ Marcar como Lida
                  </Button>
                )}

                {/* Acao especifica para rejeicoes */}
                {isRejection && (
                  <Button
                    onClick={handleViewDetails}
                    size="sm"
                    className="text-xs bg-red-600 hover:bg-red-700"
                  >
                    🔄 Revisar Vistoria
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
