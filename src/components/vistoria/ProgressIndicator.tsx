'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

interface ProgressIndicatorProps {
  progresso: number;
  itens?: any[];
  compact?: boolean;
}

export function ProgressIndicator({ progresso, itens = [], compact = false }: ProgressIndicatorProps) {
  const itensConcluidos = itens.filter(item => 
    item.concluido === true || item.status === 'concluido'
  ).length;
  
  const itensProblema = itens.filter(item => 
    item.status === 'problema'
  ).length;
  
  const itensPendentes = itens.length - itensConcluidos - itensProblema;

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressMessage = (progress: number) => {
    if (progress === 100) return 'Vistoria concluída! Todos os itens foram verificados.';
    if (progress >= 70) return 'Quase lá! Faltam poucos itens para concluir.';
    if (progress >= 40) return 'Progresso bom. Continue verificando os itens.';
    if (progress > 0) return 'Vistoria iniciada. Continue o bom trabalho!';
    return 'Vistoria não iniciada. Comece verificando os itens.';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso</span>
          <span className="text-gray-600 dark:text-gray-400">{progresso}%</span>
        </div>
        <Progress value={progresso} className="h-2" />
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{itensConcluidos} de {itens.length} concluídos</span>
          {itensProblema > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {itensProblema} com problema
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Progresso da Vistoria</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de Progresso Principal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conclusão Geral
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {progresso}%
            </span>
          </div>
          <Progress value={progresso} className="h-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getProgressMessage(progresso)}
          </p>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Itens Concluídos */}
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Concluídos
              </p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {itensConcluidos}
              </p>
            </div>
          </div>

          {/* Itens Pendentes */}
          <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Clock className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Pendentes
              </p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                {itensPendentes}
              </p>
            </div>
          </div>

          {/* Itens com Problema */}
          <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Problemas
              </p>
              <p className="text-xl font-bold text-red-900 dark:text-red-100">
                {itensProblema}
              </p>
            </div>
          </div>
        </div>

        {/* Resumo por Categoria (se disponível) */}
        {itens.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resumo por Categoria
            </h4>
            <div className="space-y-2">
              {Array.from(new Set(itens.map(item => item.categoria).filter(Boolean))).map((categoria, index) => {
                const itensDaCategoria = itens.filter(item => item.categoria === categoria);
                const concluidos = itensDaCategoria.filter(item => 
                  item.concluido === true || item.status === 'concluido'
                ).length;
                const percentual = Math.round((concluidos / itensDaCategoria.length) * 100);

                return (
                  <div key={`categoria-${categoria}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{categoria}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {concluidos}/{itensDaCategoria.length} ({percentual}%)
                      </span>
                    </div>
                    <Progress value={percentual} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Próximos Passos */}
        {progresso < 100 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Próximos Passos
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {itensPendentes > 0 && (
                <li>• Verificar {itensPendentes} item(s) pendente(s)</li>
              )}
              {itensProblema > 0 && (
                <li>• Resolver {itensProblema} item(s) com problema</li>
              )}
              {itensPendentes === 0 && itensProblema === 0 && (
                <li>• Revisar itens e concluir a vistoria</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente de progresso circular (para casos especiais)
 */
export function CircularProgress({ 
  value, 
  size = 40, 
  strokeWidth = 4, 
  className 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  className?: string; 
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const progressColor = clampedValue < 25 ? '#ef4444' : 
                       clampedValue < 50 ? '#f97316' : 
                       clampedValue < 75 ? '#eab308' : 
                       clampedValue < 100 ? '#3b82f6' : '#22c55e';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold" style={{ color: progressColor }}>
        {clampedValue}%
      </span>
    </div>
  );
}
