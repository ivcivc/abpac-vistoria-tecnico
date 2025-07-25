'use client';

import React, { useState, useEffect } from 'react';
import { DespesasList } from '@/components/despesas';
import { Despesa } from '@/types/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);

  // Gerar dados de exemplo para demonstração
  useEffect(() => {
    const exemploDespesas: Despesa[] = [
      {
        id: 'desp_001',
        itemId: 'item_001_localizador_abc123',
        vistoriaId: 'vistoria_123',
        tipo: 'MATERIAL',
        valor: 45.50,
        descricao: 'Cabo de alimentação para localizador',
        timestamp: new Date('2024-01-15T09:30:00'),
        aprovada: true
      },
      {
        id: 'desp_002',
        itemId: 'item_002_rastreador_def456',
        vistoriaId: 'vistoria_123',
        tipo: 'SERVICO',
        valor: 120.00,
        descricao: 'Instalação especializada em local de difícil acesso',
        timestamp: new Date('2024-01-15T10:15:00'),
        aprovada: false
      },
      {
        id: 'desp_003',
        itemId: 'item_001_localizador_abc123',
        vistoriaId: 'vistoria_123',
        tipo: 'OUTROS',
        valor: 25.00,
        descricao: 'Fita isolante e conectores adicionais',
        timestamp: new Date('2024-01-15T11:00:00'),
        aprovada: true
      },
      {
        id: 'desp_004',
        itemId: 'item_003_sensor_ghi789',
        vistoriaId: 'vistoria_123',
        tipo: 'DESLOCAMENTO',
        valor: 35.75,
        descricao: 'Combustível para deslocamento extra devido a localização remota',
        timestamp: new Date('2024-01-15T14:20:00'),
        aprovada: false
      },
      {
        id: 'desp_005',
        itemId: 'item_002_rastreador_def456',
        vistoriaId: 'vistoria_123',
        tipo: 'MATERIAL',
        valor: 80.25,
        descricao: 'Suporte metálico personalizado para fixação',
        timestamp: new Date('2024-01-15T15:45:00'),
        aprovada: true
      },
      {
        id: 'desp_006',
        itemId: 'item_004_bloqueador_jkl012',
        vistoriaId: 'vistoria_123',
        tipo: 'SERVICO',
        valor: 95.00,
        descricao: 'Reprogramação do equipamento após substituição',
        timestamp: new Date('2024-01-15T16:30:00'),
        aprovada: false
      }
    ];

    setDespesas(exemploDespesas);
  }, []);

  const handleEditDespesa = (despesa: Despesa) => {
    console.log('Editar despesa:', despesa);
    // Aqui você implementaria a lógica de edição
    alert(`Editar despesa: ${despesa.descricao} - ${despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header da Página */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Link>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-6 h-6" />
                    Gerenciamento de Despesas
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Visualização consolidada das despesas da vistoria
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Demo Task 18
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Total de Despesas</p>
                <p className="text-lg font-bold text-green-900">
                  {despesas.length} despesas registradas
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Valor Total</p>
                <p className="text-lg font-bold text-blue-900">
                  {despesas.reduce((total, despesa) => total + despesa.valor, 0).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">Itens com Despesas</p>
                <p className="text-lg font-bold text-purple-900">
                  {new Set(despesas.map(d => d.itemId)).size} itens únicos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Despesas usando o novo componente */}
        <DespesasList
          despesas={despesas}
          showItemGrouping={true}
          showFilters={true}
          onEditDespesa={handleEditDespesa}
          readOnly={false}
        />

        {/* Informações sobre a demonstração */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm">
              💡 Demonstração do Componente DespesasList
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="space-y-2">
              <p>
                <strong>Funcionalidades implementadas:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Listagem consolidada de despesas</li>
                <li>✅ Agrupamento por item de vistoria</li>
                <li>✅ Cálculos automáticos de totais (geral e por tipo)</li>
                <li>✅ Estatísticas detalhadas (média, quantidades, aprovações)</li>
                <li>✅ Filtros por tipo, texto e status de aprovação</li>
                <li>✅ Visualização responsiva e interativa</li>
                <li>✅ Suporte a edição de despesas não aprovadas</li>
                <li>✅ Interface moderna com ícones e badges</li>
              </ul>
              <p className="mt-3">
                <strong>Componente reutilizável:</strong> O <code>DespesasList</code> pode ser usado em 
                diferentes contextos como dashboard de vistorias, relatórios financeiros e páginas de aprovação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 