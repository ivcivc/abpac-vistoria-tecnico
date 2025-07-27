# Arquitetura do Sistema Vistoria Tecnico

## Visao Geral

O **Vistoria Tecnico** e uma aplicacao Next.js 14 desenvolvida para dispositivos moveis que permite aos tecnicos realizar vistorias de equipamentos com capacidades offline e sincronizacao automatica.

## Arquitetura Geral

### Stack Tecnologico

- **Frontend**: Next.js 14 (App Router)
- **Linguagem**: TypeScript/JavaScript
- **Estilizacao**: Tailwind CSS + Shadcn UI
- **Estado Local**: React Context + Custom Hooks
- **Armazenamento Local**: IndexedDB + localStorage
- **PWA**: next-pwa
- **Testes**: Jest + React Testing Library

### Estrutura de Diretorios

```
src/
├── app/                    # Next.js App Router
│   ├── (vistoria)/        # Grupo de rotas principais
│   └── test-*/            # Paginas de teste para cada task
├── components/            # Componentes reutilizaveis
│   ├── ui/               # Componentes base (Shadcn UI)
│   ├── vistoria/         # Componentes especificos de vistoria
│   ├── storage/          # Componentes de gerenciamento de armazenamento
│   ├── performance/      # Componentes de otimizacao
│   └── a11y/             # Componentes acessiveis
├── contexts/             # Contextos React
├── hooks/                # Custom hooks
├── lib/                  # Utilitarios e configuracoes
├── services/             # Camada de servicos
│   ├── auth/            # Autenticacao
│   ├── api/             # Comunicacao com backend
│   ├── storage/         # Gerenciamento de armazenamento
│   ├── offline/         # Funcionalidades offline
│   └── vistoria/        # Logica especifica de vistoria
├── types/                # Definicoes TypeScript
├── utils/                # Funcoes utilitarias
└── tests/                # Testes automatizados
```

## Fluxo de Dados

### 1. Autenticacao

```
Login -> Validacao Token -> AuthContext -> LocalStorage -> API Calls
```

### 2. Vistoria Offline

```
Inicio Vistoria -> Download Dados -> IndexedDB -> 
Trabalho Offline -> Queue Sync -> Conectividade? -> 
Sincronizacao (se online) ou Manter Local (se offline)
```

### 3. Gerenciamento de Estado

```
UI Component -> Custom Hook -> Context -> Service -> IndexedDB/API
```

## Persistencia de Dados

### IndexedDB (Armazenamento Principal)

- **vistorias**: Dados das vistorias
- **itens**: Itens de vistoria
- **arquivos**: Evidencias e fotos
- **despesas**: Despesas da vistoria
- **sync_queue**: Fila de sincronizacao
- **configuracoes**: Configuracoes do app

### LocalStorage (Configuracoes)

- **auth_token**: Token de autenticacao
- **user_data**: Dados do usuario
- **app_settings**: Configuracoes da aplicacao

## Padroes Arquiteturais

### 1. Service Layer Pattern

Toda logica de negocio esta encapsulada em services:

```typescript
// Exemplo: VistoriaService
class VistoriaService {
  async iniciarVistoria(id: string): Promise<Vistoria>
  async concluirVistoria(id: string, dados: ConclusaoData): Promise<void>
  async sincronizarVistoria(vistoria: Vistoria): Promise<void>
}
```

### 2. Repository Pattern

Acesso a dados centralizado:

```typescript
// Exemplo: EstoqueRemessaRepository
class EstoqueRemessaRepository {
  async getById(id: string): Promise<EstoqueRemessa>
  async save(item: EstoqueRemessa): Promise<void>
  async sync(): Promise<void>
}
```

### 3. Observer Pattern

Para notificacoes e atualizacoes:

```typescript
// useApprovalNotifications hook
const notifications = useApprovalNotifications();
// Observa mudancas e notifica componentes
```

### 4. Strategy Pattern

Para diferentes estrategias de sincronizacao:

```typescript
// SyncStrategy
interface SyncStrategy {
  sync(data: any): Promise<void>
}

class OnlineSyncStrategy implements SyncStrategy { ... }
class OfflineSyncStrategy implements SyncStrategy { ... }
```

## Seguranca

### Autenticacao

- **Tokens JWT**: Gerenciados pelo AuthService
- **Validacao**: Middleware no backend
- **Expiracao**: Renovacao automatica

### Armazenamento Seguro

- **Criptografia**: Dados sensiveis criptografados
- **Validacao**: Verificacao de integridade
- **Limpeza**: Remocao automatica de dados expirados

## PWA e Offline

### Service Worker

- **Caching**: Estrategias de cache inteligentes
- **Background Sync**: Sincronizacao em background
- **Push Notifications**: Notificacoes push

### Estrategias de Cache

1. **Cache First**: Para assets estaticos
2. **Network First**: Para dados dinamicos
3. **Stale While Revalidate**: Para dados que podem ser levemente desatualizados

## Performance

### Otimizacoes Implementadas

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Code Splitting**: Divisao automatica de codigo
3. **Memoization**: React.memo, useMemo, useCallback
4. **Virtualization**: Listas grandes virtualizadas
5. **Image Optimization**: Next.js Image otimizado

### Metricas Monitoradas

- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: Analise de tamanho
- **Performance Score**: Lighthouse

## Acessibilidade

### Padroes Implementados

- **WCAG 2.1 AA**: Conformidade com diretrizes
- **Keyboard Navigation**: Navegacao completa por teclado
- **Screen Readers**: Suporte a leitores de tela
- **Color Contrast**: Contraste adequado

### Componentes Acessiveis

- **AccessibleButton**: Botoes com ARIA
- **AccessibleInput**: Campos com validacao acessivel
- **AccessibleCard**: Cards interativos
- **AccessibleAlert**: Alertas anunciados

## Testes

### Estrategia de Testes

1. **Unit Tests**: Funcoes e hooks isolados
2. **Component Tests**: Componentes React
3. **Integration Tests**: Fluxos completos
4. **E2E Tests**: Cenarios de usuario real

### Cobertura

- **Minimo**: 70% em todas as metricas
- **Critical Path**: 90% para fluxos principais
- **Services**: 85% para logica de negocio

## Configuracao e Deploy

### Ambientes

- **Development**: Desenvolvimento local
- **Staging**: Ambiente de testes
- **Production**: Ambiente de producao

### Variaveis de Ambiente

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333/api
NEXT_PUBLIC_ENVIRONMENT=development
```

## Monitoramento

### Metricas Coletadas

1. **Performance**: Core Web Vitals
2. **Errors**: Error Boundary + Sentry
3. **Usage**: Analytics de uso
4. **Network**: Conectividade e latencia

### Alertas

- **Error Rate**: > 1%
- **Performance**: LCP > 2.5s
- **Availability**: < 99% 