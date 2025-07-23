'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TokenInput } from '@/components/auth/TokenInput';
import { TechnicianIdentification } from '@/components/auth/TechnicianIdentification';
import { SimpleLayout } from '@/components/layout';
import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext'; // CORRIGIDO: useTechnician vem do SimpleAuthContext

enum AuthStep {
  TOKEN_INPUT = 'token_input',
  TOKEN_VALIDATION = 'token_validation',
  TECHNICIAN_IDENTIFICATION = 'technician_identification',
  COMPLETING = 'completing',
}

// COMPONENTE SEPARADO QUE USA useSearchParams (DEVE ESTAR DENTRO DE SUSPENSE)
function LoginPageContent() {
  const router = useRouter();
  const { authState, validateToken, setTechnicianName, setCurrentVistoria, clearError } = useAuth(); // ADICIONADO: setCurrentVistoria

  const [currentStep, setCurrentStep] = useState<AuthStep>(AuthStep.TOKEN_INPUT);
  const [vistoriaInfo, setVistoriaInfo] = useState<any>(null);
  const [additionalError, setAdditionalError] = useState<string>('');
  const [autoValidationAttempted, setAutoValidationAttempted] = useState(false);

  // useSearchParams DEVE estar dentro de um componente wrappado por Suspense
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  console.log('🔗 [LOGIN] URL Token detectado:', urlToken);

  // REMOVIDO: Redirecionamento automático que causa loop infinito
  // O ProtectedRoute no dashboard vai lidar com a proteção
  // useEffect(() => {
  //   if (authState.isAuthenticated && authState.initialized) {
  //     console.log('✅ Login: usuário já autenticado, redirecionando para dashboard');
  //     router.push('/dashboard');
  //   }
  // }, [authState.isAuthenticated, authState.initialized, router]);

  // Validar token da URL automaticamente APENAS UMA VEZ e somente se não estiver autenticado
  useEffect(() => {
    if (
      urlToken &&
      !authState.isAuthenticated &&
      !autoValidationAttempted &&
      authState.initialized &&
      !authState.loading
    ) {
      console.log('🔗 Token encontrado na URL, validando automaticamente...', urlToken);
      setAutoValidationAttempted(true);
      handleTokenValidation(urlToken);
    }
  }, [
    urlToken,
    authState.isAuthenticated,
    autoValidationAttempted,
    authState.initialized,
    authState.loading,
  ]);

  const handleTokenValidation = async (token: string) => {
    // Validação básica antes de prosseguir
    if (!token || !token.trim()) {
      setAdditionalError('Token não pode estar vazio');
      setCurrentStep(AuthStep.TOKEN_INPUT);
      return;
    }

    // Limpar erros anteriores
    clearError();
    setAdditionalError('');

    console.log('🔍 Iniciando validação do token:', token.substring(0, 10) + '...');
    setCurrentStep(AuthStep.TOKEN_VALIDATION);

    try {
      // Usar o endpoint REAL do backend
      const result = await validateToken(token);

      console.log('📡 [RESULTADO] Resposta da validação:', result);

      if (result.success && result.vistoriaData) {
        console.log('✅ Token validado com sucesso!');
        console.log('📡 [SERVIDOR] Dados recebidos do backend:', result.vistoriaData);

        // Usar os dados REAIS vindos do backend
        const vistoriaBackend = result.vistoriaData;

        // Processar dados do backend para o formato esperado pelo frontend
        const processServerData = (serverData: any) => {
          console.log('🔧 [PROCESSAMENTO] Processando dados reais do servidor...');
          console.log('🔧 [PROCESSAMENTO] Estrutura original completa:', serverData);

          // DADOS REAIS baseados no debug do usuário:
          // local_vistoria: "Rua de castro, 217"
          // cidade: "Cidade Verde"
          // equipamento: { id, nome, placa, modelo, marca, cor }
          // tecnico: { id, nome, email }
          // tipo_vistoria: "INSTALACAO"

          const processedData = {
            // Dados básicos da vistoria (CORRIGIDOS para estrutura real)
            id: serverData.id || 'N/A',
            local: serverData.local_vistoria || serverData.endereco || 'Endereço não informado',
            cidade: serverData.cidade || 'Cidade não informada',
            dataAgendada:
              serverData.data_prevista || serverData.data_agendada || new Date().toISOString(),
            cliente: serverData.pessoa_nome || serverData.cliente || 'Cliente não informado',
            equipamento: serverData.equipamento?.nome || 'Equipamento ABPAC',

            // Campos específicos da vistoria (CORRIGIDOS)
            tipoVistoria: serverData.tipo_vistoria || 'Vistoria',
            status: serverData.status || 'em_andamento',
            observacoes: serverData.observacoes_vistoria || serverData.observacoes || '',
            prioridade: serverData.prioridade || 'MEDIA',

            // Mapear equipamento REAL para veiculo (estrutura esperada pelo TechnicianIdentification)
            // CORRIGIDO: Usar campos corretos do backend (placa1, marca1, modelo1)
            veiculo: {
              modelo: `${serverData.equipamento?.marca1 || ''} ${serverData.equipamento?.modelo1 || ''}`.trim() || 'Modelo não informado',
              cor: serverData.equipamento?.cor || 'Cor não informada',
              placa: serverData.equipamento?.placa1 || 'Placa não informada',
            },

            // Dados do técnico REAIS (se existir)
            tecnicoId: serverData.tecnico_id || serverData.tecnico?.id || null,
            tecnicoNome: serverData.pessoa?.nome || serverData.tecnico?.nome || null, // ← CORRIGIDO: usar pessoa.nome
            nomeEstoque: serverData.equipamento?.nome || 'Equipamento não informado',

            // Dados adicionais que podem ser úteis
            itens: serverData.itens || [],
            despesas: serverData.despesas || [],
            historico: serverData.historico || [],

            // Dados completos para debug
            _debug: {
              equipamento_id: serverData.equipamento_id,
              tecnico_id: serverData.tecnico_id,
              equipamento_completo: serverData.equipamento,
              tecnico_completo: serverData.tecnico,
            },
          };

          console.log('🔧 [PROCESSAMENTO] Dados processados para frontend:', {
            id: processedData.id,
            local: processedData.local,
            cidade: processedData.cidade,
            veiculo: processedData.veiculo,
            tipoVistoria: processedData.tipoVistoria,
            tecnicoId: processedData.tecnicoId,
            tecnicoNome: processedData.tecnicoNome,
            equipamento: processedData.equipamento,
          });

          return processedData;
        };

        // Processar os dados do servidor
        const processedVistoriaInfo = processServerData(vistoriaBackend);

        // Validar estrutura mínima necessária
        const validateProcessedData = (vistoria: any) => {
          console.log('🔍 [VALIDAÇÃO] Validando dados processados...');

          // Campos obrigatórios mínimos
          const requiredFields = ['local', 'dataAgendada'];

          for (const field of requiredFields) {
            if (!vistoria[field]) {
              console.error(`❌ [VALIDAÇÃO] Campo obrigatório ausente: ${field}`);
              return false;
            }
          }

          // Validar dados do veículo
          if (vistoria.veiculo) {
            const vehicleFields = ['modelo', 'placa'];
            for (const field of vehicleFields) {
              if (!vistoria.veiculo[field]) {
                console.warn(`⚠️ [VALIDAÇÃO] Campo do veículo ausente: ${field} - usando fallback`);
                // Não bloquear, apenas avisar
              }
            }
          }

          console.log('✅ [VALIDAÇÃO] Dados processados válidos');
          return true;
        };

        if (validateProcessedData(processedVistoriaInfo)) {
          console.log(
            '📋 [VISTORIA-INFO] Dados finais preparados para o frontend:',
            processedVistoriaInfo
          );
          console.log('🚗 [VEICULO] Dados do veículo mapeados:', processedVistoriaInfo.veiculo);
          console.log(
            '👤 [TECNICO] Técnico sugerido:',
            processedVistoriaInfo.tecnicoId ? 'Sim' : 'Não'
          );

          // ADICIONADO: Definir vistoria atual no contexto
          setCurrentVistoria(processedVistoriaInfo);

          setVistoriaInfo(processedVistoriaInfo);
          setCurrentStep(AuthStep.TECHNICIAN_IDENTIFICATION);
        } else {
          console.error('❌ Falha na validação dos dados processados');
          setAdditionalError('Erro na estrutura dos dados recebidos do servidor');
          setCurrentStep(AuthStep.TOKEN_INPUT);
        }
      } else {
        console.error('❌ Falha na validação do token:', result.error);
        setAdditionalError(result.error || 'Token inválido. Verifique se o token está correto.');
        setCurrentStep(AuthStep.TOKEN_INPUT);
      }
    } catch (error) {
      console.error('❌ Erro durante validação do token:', error);
      setAdditionalError('Erro ao validar token. Tente novamente.');
      setCurrentStep(AuthStep.TOKEN_INPUT);
    }
  };

  const handleTechnicianSubmit = (data: { name: string }) => {
    if (!data.name || !data.name.trim()) {
      setAdditionalError('Nome do técnico é obrigatório');
      return;
    }

    setCurrentStep(AuthStep.COMPLETING);
    console.log('🚀 REDIRECIONAMENTO FORÇADO: Iniciando redirecionamento imediato...');

    // Definir o nome do técnico
    setTechnicianName(data.name.trim());

    // REDIRECIONAMENTO IMEDIATO E AGRESSIVO
    console.log('🔄 FORÇANDO redirecionamento IMEDIATAMENTE...');

    // Método 1: Redirecionamento imediato com window.location
    setTimeout(() => {
      console.log('🚀 REDIRECIONAMENTO FORÇADO: window.location.href');
      window.location.href = '/dashboard';
    }, 100);

    // Método 2: Fallback com replace
    setTimeout(() => {
      console.log('🚀 REDIRECIONAMENTO FORÇADO: window.location.replace');
      window.location.replace('/dashboard');
    }, 500);

    // Método 3: Fallback final
    setTimeout(() => {
      console.log('🚀 REDIRECIONAMENTO FORÇADO: location.assign');
      window.location.assign('/dashboard');
    }, 1000);

    // REMOVIDO: toda a lógica complexa de checkAuthAndRedirect
  };

  // Combinar erros do AuthContext e erros locais
  const displayError = additionalError || authState.error;

  // Se ainda não inicializou, mostrar loading
  if (!authState.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case AuthStep.TOKEN_INPUT:
        return (
          <TokenInput
            onTokenSubmit={handleTokenValidation}
            defaultValue={urlToken || ''} // Usar token da URL se disponível
            error={displayError}
            loading={authState.loading}
          />
        );

      case AuthStep.TOKEN_VALIDATION:
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Validando token...</p>
              <p className="text-sm text-muted-foreground">Verificando permissões de acesso</p>
            </div>
          </div>
        );

      case AuthStep.TECHNICIAN_IDENTIFICATION:
        return (
          <TechnicianIdentification
            vistoriaInfo={vistoriaInfo}
            onSubmit={handleTechnicianSubmit}
            error={displayError}
            loading={authState.loading}
          />
        );

      case AuthStep.COMPLETING:
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent animate-spin rounded-full"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-green-600">Acesso Autorizado!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Sistema de Vistoria ABPAC</h1>
            <p className="text-muted-foreground">
              Para iniciar uma vistoria, você precisa de um token de acesso válido.
            </p>
          </div>

          {/* Conteúdo dinâmico baseado no passo atual */}
          {renderContent()}

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Sistema de Vistoria para Técnicos v1.0
              <br />
              Funciona offline - Sincronização automática
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                🔧 Modo Desenvolvimento
              </div>
            )}
          </div>

          {/* Debug Info - Apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Debug:</strong>
              <br />
              Auth State: {authState.isAuthenticated ? 'Autenticado' : 'Não autenticado'}
              <br />
              Loading: {authState.loading ? 'Sim' : 'Não'}
              <br />
              Step: {currentStep}
              <br />
              URL Token: {urlToken || 'Nenhum'}
              <br />
              {authState.technicianName && `Técnico: ${authState.technicianName}`}
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
}

// COMPONENTE PRINCIPAL COM SUSPENSE BOUNDARY ADEQUADO
export default function LoginPage() {
  // Hooks não são necessários aqui - são usados dentro do LoginPageContent
  return (
    <Suspense
      fallback={
        <SimpleLayout>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
              </div>
              <h2 className="text-xl font-semibold">Carregando Login...</h2>
              <p className="text-muted-foreground">Preparando sistema de autenticação</p>
            </div>
          </div>
        </SimpleLayout>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
