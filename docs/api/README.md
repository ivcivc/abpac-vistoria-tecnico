# Documentacao de APIs e Interfaces

## Visao Geral

Esta documentacao descreve todas as APIs e interfaces utilizadas no sistema Vistoria Tecnico, incluindo endpoints do backend, servicos frontend e interfaces TypeScript.

## Configuracao de API

### BASE_URL

A URL base da API e configurada dinamicamente:

```typescript
// Producao
const BASE_URL = 'https://api.abpac.com.br/api'

// Desenvolvimento
const BASE_URL = 'http://192.168.15.4:3333/api'
```

### Configuracao (src/config/api.ts)

```typescript
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  ENDPOINTS: {
    // Autenticacao
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    
    // Vistorias
    GET_VISTORIA: '/vistoria/:id',
    UPDATE_VISTORIA: '/vistoria/:id',
    CONCLUDE_VISTORIA: '/vistoria/:id/concluir',
    
    // Upload de arquivos
    UPLOAD_FILE: '/upload',
    
    // Despesas
    GET_DESPESAS: '/vistoria/:id/despesas',
    CREATE_DESPESA: '/vistoria/:id/despesas',
    
    // Notificacoes
    TIMELINE_STATUS: '/vistoria/:id/timeline',
    APPROVE_VISTORIA: '/vistoria/:id/aprovar',
    REQUEST_CORRECTION: '/vistoria/:id/correcao'
  }
}
```

## Autenticacao

### Login

**Endpoint:** POST /api/auth/login

**Request:**
```json
{
  "username": "tecnico123",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "nome": "Joao Tecnico",
      "email": "joao@abpac.com.br"
    }
  }
}
```

### Middleware de Autenticacao

Todos os endpoints protegidos requerem:

```
Headers:
Authorization: Bearer {token}
```

## APIs de Vistoria

### 1. Obter Vistoria

**Endpoint:** GET /api/vistoria/{id}

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "protocolo": "VIST-2024-001",
    "status": "EM_VISTORIA",
    "cliente": {
      "nome": "Cliente Exemplo",
      "cpf": "123.456.789-00"
    },
    "itens": [
      {
        "id": "item-1",
        "descricao": "Equipamento A",
        "status": "PENDENTE",
        "evidencias": []
      }
    ],
    "observacoes_gerais": ""
  }
}
```

### 2. Atualizar Vistoria

**Endpoint:** PUT /api/vistoria/{id}

**Request:**
```json
{
  "observacoes_gerais": "Observacoes atualizadas",
  "itens": [
    {
      "id": "item-1",
      "status": "APROVADO",
      "observacoes": "Item em bom estado"
    }
  ]
}
```

### 3. Concluir Vistoria

**Endpoint:** POST /api/vistoria/{id}/concluir

**Request:**
```json
{
  "observacoes_finais": "Vistoria concluida com sucesso"
}
```

## APIs de Upload

### Upload de Arquivo

**Endpoint:** POST /api/upload

**Content-Type:** multipart/form-data

**Request:**
```
Form Data:
- file: [arquivo]
- tipo: "evidencia"
- vistoria_id: "123"
- item_id: "item-1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "arquivo_id": "arq-123",
    "url": "/uploads/evidencia-123.jpg",
    "nome_original": "foto.jpg",
    "tamanho": 1024000
  }
}
```

## APIs de Despesas

### 1. Listar Despesas

**Endpoint:** GET /api/vistoria/{id}/despesas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "desp-1",
      "tipo": "TRANSPORTE",
      "valor": 50.00,
      "descricao": "Combustivel",
      "comprovante": {
        "arquivo_id": "arq-456",
        "url": "/uploads/comprovante-456.jpg"
      },
      "data_criacao": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Criar Despesa

**Endpoint:** POST /api/vistoria/{id}/despesas

**Request:**
```json
{
  "tipo": "TRANSPORTE",
  "valor": 50.00,
  "descricao": "Combustivel",
  "arquivo_id": "arq-456"
}
```

## APIs de Notificacoes

### Timeline de Status

**Endpoint:** GET /api/vistoria/{id}/timeline

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-1",
      "tipo": "APROVACAO",
      "status": "APROVADO",
      "mensagem": "Vistoria aprovada pelo supervisor",
      "usuario": "Supervisor Joao",
      "data": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### Aprovar Vistoria

**Endpoint:** POST /api/vistoria/{id}/aprovar

**Request:**
```json
{
  "observacoes": "Vistoria aprovada conforme procedimentos"
}
```

## Servicos Frontend

### AuthService

```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async logout(): Promise<void>
  async refreshToken(): Promise<string>
  isTokenValid(): boolean
  getCurrentUser(): User | null
}
```

### VistoriaService

```typescript
class VistoriaService {
  async getVistoria(id: string): Promise<Vistoria>
  async updateVistoria(id: string, data: VistoriaUpdate): Promise<void>
  async concluirVistoria(id: string, observacoes: string): Promise<void>
}
```

### UploadService

```typescript
class UploadService {
  async uploadFile(file: File, metadata: UploadMetadata): Promise<UploadResponse>
  async uploadWithProgress(
    file: File, 
    metadata: UploadMetadata,
    onProgress: (progress: number) => void
  ): Promise<UploadResponse>
}
```

### DespesaService

```typescript
class DespesaService {
  async getDespesas(vistoriaId: string): Promise<Despesa[]>
  async createDespesa(vistoriaId: string, despesa: DespesaCreate): Promise<Despesa>
  async deleteDespesa(despesaId: string): Promise<void>
}
```

## Interfaces TypeScript

### Principais Tipos

```typescript
interface Vistoria {
  id: string;
  protocolo: string;
  status: VistoriaStatus;
  cliente: Cliente;
  itens: ItemVistoria[];
  observacoes_gerais?: string;
  data_criacao: string;
  data_conclusao?: string;
}

interface ItemVistoria {
  id: string;
  descricao: string;
  status: ItemStatus;
  observacoes?: string;
  evidencias: Evidencia[];
  categoria: string;
}

interface Despesa {
  id: string;
  tipo: DespesaTipo;
  valor: number;
  descricao: string;
  comprovante?: Arquivo;
  data_criacao: string;
}

interface Arquivo {
  id: string;
  nome_original: string;
  url: string;
  tamanho: number;
  tipo_mime: string;
}
```

### Enums

```typescript
enum VistoriaStatus {
  PENDENTE = 'PENDENTE',
  EM_VISTORIA = 'EM_VISTORIA',
  CONCLUIDA = 'CONCLUIDA',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA'
}

enum ItemStatus {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  CONDICIONAL = 'CONDICIONAL'
}

enum DespesaTipo {
  TRANSPORTE = 'TRANSPORTE',
  ALIMENTACAO = 'ALIMENTACAO',
  HOSPEDAGEM = 'HOSPEDAGEM',
  MATERIAL = 'MATERIAL',
  OUTROS = 'OUTROS'
}
```

## Hooks Personalizados

### useVistoria

```typescript
function useVistoria(id: string) {
  const {
    vistoria,
    loading,
    error,
    updateItem,
    addEvidencia,
    concluir
  } = useVistoria(id);
}
```

### useUpload

```typescript
function useUpload() {
  const {
    uploadFile,
    progress,
    uploading,
    error
  } = useUpload();
}
```

### useApprovalNotifications

```typescript
function useApprovalNotifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    refresh
  } = useApprovalNotifications();
}
```

## Storage Services

### IndexedDBService

```typescript
class IndexedDBService {
  async initialize(): Promise<void>
  async store(storeName: string, data: any): Promise<void>
  async get(storeName: string, id: string): Promise<any>
  async getAll(storeName: string): Promise<any[]>
  async delete(storeName: string, id: string): Promise<void>
  async clear(storeName: string): Promise<void>
}
```

### CRUDService

```typescript
class CRUDService<T> {
  async create(item: T): Promise<T>
  async getById(id: string): Promise<T | null>
  async getAll(): Promise<T[]>
  async update(item: T): Promise<boolean>
  async delete(id: string): Promise<boolean>
  async findBy(query: QueryOptions): Promise<T[]>
}
```

## Conectividade

### Verificacao de Conectividade

```typescript
// Verificar se ha conexao com o servidor
async function checkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
```

### Retry Logic

```typescript
async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  // Implementacao de retry com backoff exponencial
}
```

## Tratamento de Erros

### Codigos de Erro

```typescript
enum ErrorCodes {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  SERVER_ERROR = 500,
  NETWORK_ERROR = 0
}
```

### Estrutura de Erro

```typescript
interface ApiError {
  code: number;
  message: string;
  details?: any;
  timestamp: string;
}
```

## Monitoramento

### Performance Metrics

```typescript
interface PerformanceMetrics {
  loadTime: number;
  apiLatency: number;
  renderTime: number;
  memoryUsage: number;
}
```

### Event Tracking

```typescript
// Eventos trackados
enum TrackingEvents {
  VISTORIA_INICIADA = 'vistoria_iniciada',
  ITEM_APROVADO = 'item_aprovado',
  FOTO_ADICIONADA = 'foto_adicionada',
  DESPESA_CRIADA = 'despesa_criada',
  VISTORIA_CONCLUIDA = 'vistoria_concluida'
}
```

## Mocks para Desenvolvimento

### Mock Service

```typescript
class MockApiService {
  async getVistoria(id: string): Promise<Vistoria> {
    // Retorna dados mock para desenvolvimento
  }
  
  async uploadFile(file: File): Promise<UploadResponse> {
    // Simula upload para testes
  }
}
```

## Validacoes

### Schemas de Validacao

```typescript
// Usando Zod para validacao
const VistoriaSchema = z.object({
  id: z.string(),
  protocolo: z.string(),
  status: z.enum(['PENDENTE', 'EM_VISTORIA', 'CONCLUIDA']),
  // ... outros campos
});

const DespesaSchema = z.object({
  tipo: z.enum(['TRANSPORTE', 'ALIMENTACAO', 'HOSPEDAGEM']),
  valor: z.number().positive(),
  descricao: z.string().min(5),
});
```

---

## Suporte

Para duvidas sobre as APIs:
- **Documentacao tecnica**: /docs/api
- **Postman Collection**: Disponivel no repositorio
- **Suporte**: dev@abpac.com.br 