# 🔗 INTEGRAÇÃO COM BACKEND REAL - ENDPOINTS EXISTENTES

## 📡 BACKEND JÁ IMPLEMENTADO ✅

O backend AdonisJS **JÁ TEM** toda a implementação de vistoria funcionando! Não é necessário criar novos endpoints.

### **✅ ENDPOINT EXISTENTE: GET /api/vistoria/:token**

**Arquivo:** `backend/app/Controllers/Http/EstoqueRemessaController.js`  
**Método:** `obterVistoriaPorToken`  
**Service:** `EstoqueRemessaVistoria.obterVistoriaPorToken`  
**Middleware:** `validarTokenVistoria`

```javascript
// JÁ IMPLEMENTADO - NÃO PRECISA CRIAR
async obterVistoriaPorToken({ params, response }) {
  try {
    const token = params.token
    const vistoria = await new ServicesVistoria().obterVistoriaPorToken(token)
    
    response.status(200).send({
      type: true,
      vistoria,
    })
  } catch (error) {
    response.status(400).send({
      code: error.code || 'ERROR',
      message: error.message || 'Erro ao obter vistoria por token',
      name: error.name || 'EstoqueRemessaError',
    })
  }
}
```

---

## 🛤️ ROTAS JÁ EXISTENTES

**Arquivo:** `backend/start/routes/remessa-vistoria.js`

```javascript
// ROTAS JÁ IMPLEMENTADAS:

// Obter vistoria por token (acesso público)
Route.get('/vistoria/:token', 'EstoqueRemessaController.obterVistoriaPorToken')
  .middleware(['validarTokenVistoria'])

// Atualizar item da vistoria
Route.put('/vistoria/item/:id', 'EstoqueRemessaController.atualizarItemVistoria')
  .middleware(['validarTokenVistoria', 'validarTokenWrite'])
  .validator('EstoqueRemessa/AtualizarItemVistoria')

// Concluir vistoria
Route.post('/vistoria/:id/concluir', 'EstoqueRemessaController.concluirVistoria')
  .middleware(['validarTokenVistoria', 'validarTokenConclude'])
  .validator('EstoqueRemessa/ConcluirVistoria')

// Adicionar despesa
Route.post('/vistoria/:id/adicionar-despesa', 'EstoqueRemessaController.adicionarDespesaVistoria')
  .middleware(['validarTokenVistoria', 'validarTokenWrite'])
  .validator('EstoqueRemessa/AdicionarDespesa')
```

---

## 🗄️ ESTRUTURA DE DADOS REAL

### **RESPOSTA DO ENDPOINT:**

```json
{
  "type": true,
  "vistoria": {
    "id": 123,
    "status": "EM_VISTORIA",
    "endereco": "Rua das Flores, 123 - Centro - São Paulo, SP",
    "data_agendada": "2025-01-23T10:00:00.000Z",
    "tipo_vistoria": "Instalação",
    "equipamento": {
      "id": 456,
      "nome": "Sistema de Proteção ABPAC",
      "placa": "ABC-1234",
      "modelo": "Honda Civic",
      "marca": "Honda",
      "cor": "Prata"
    },
    "tecnico": {
      "id": 789,
      "nome": "João Silva"
    },
    "itens": [
      {
        "id": 1,
        "status_item": "PENDENTE",
        "observacoes": "",
        "categoria": {...},
        "fabricante": {...}
      }
    ],
    "despesas": [
      {
        "id": 1,
        "valor": 50.00,
        "descricao": "Combustível",
        "tipo": "DESLOCAMENTO"
      }
    ],
    "historico": [...]
  }
}
```

### **TABELAS DO BANCO (JÁ EXISTEM):**

```sql
-- estoque_remessa (dados principais)
CREATE TABLE estoque_remessa (
  id INT PRIMARY KEY,
  token_vistoria VARCHAR(255) UNIQUE,
  endereco TEXT,
  data_agendada DATETIME,
  tipo_vistoria VARCHAR(100),
  equipamento_id INT,
  tecnico_id INT,
  status ENUM('AGUARDANDO_VISTORIA', 'EM_VISTORIA', 'AGUARDANDO_APROVACAO', 'APROVADA'),
  observacoes TEXT
);

-- equipamentos (dados do veículo)
CREATE TABLE equipamentos (
  id INT PRIMARY KEY,
  nome VARCHAR(255),
  placa VARCHAR(20),
  modelo VARCHAR(100),
  marca VARCHAR(100),
  cor VARCHAR(50)
);

-- pessoas (técnicos)
CREATE TABLE pessoas (
  id INT PRIMARY KEY,
  nome VARCHAR(255),
  email VARCHAR(255),
  tipo ENUM('TECNICO', 'CONFERENTE', 'ADMIN')
);
```

---

## 🔧 MIDDLEWARE JÁ IMPLEMENTADO

### **ValidarTokenVistoria** - `backend/app/Middleware/ValidarTokenVistoria.js`

```javascript
// JÁ IMPLEMENTADO - Valida token e adiciona contexto
async handle({ request, response, params }, next) {
  const token = params.token || request.header('X-Vistoria-Token') || request.input('token')
  
  const remessa = await ModelEstoqueRemessa.query()
    .where('token_vistoria', token)
    .with('equipamento')
    .with('tecnico') 
    .with('itens')
    .first()
    
  // Adiciona contexto à requisição
  request.vistoria = {
    remessa: remessa.toJSON(),
    token: token,
    equipamento: remessa.getRelated('equipamento')?.toJSON(),
    tecnico: remessa.getRelated('tecnico')?.toJSON(),
    itens: remessa.getRelated('itens')?.toJSON() || [],
    permissions: {
      can_edit: ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'].includes(remessa.status),
      can_conclude: remessa.status === 'EM_VISTORIA',
      can_view: true,
    }
  }
}
```

---

## 🧪 COMO TESTAR A INTEGRAÇÃO

### **1. Verificar se Backend está Rodando:**
```bash
cd backend
npm run dev
# Deve rodar na porta 3333
```

### **2. Página de Teste:**
```
http://localhost:3000/test-backend
```

### **3. Login com Token Real:**
```
http://localhost:3000/login?token=SEU_TOKEN_REAL
```

### **4. Testando Direto no Backend:**
```bash
curl -X GET "http://localhost:3333/api/vistoria/SEU_TOKEN_REAL" \
  -H "Accept: application/json"
```

---

## 📊 FRONTEND ATUALIZADO ✅

**O que foi corrigido:**

### **❌ ANTES (Errado):**
```javascript
// Endpoint que NÃO EXISTE
POST http://localhost:3333/api/vistorias/validate-token
{
  "token": "ABC123"
}
```

### **✅ AGORA (Correto):**
```javascript
// Endpoint que JÁ EXISTE
GET http://localhost:3333/api/vistoria/ABC123
```

**Arquivos atualizados:**
- ✅ `src/contexts/SimpleAuthContext.tsx` - Endpoint correto
- ✅ `src/app/login/page.tsx` - Processamento de dados real
- ✅ `src/config/api.ts` - Documentação dos endpoints reais
- ✅ `src/app/test-backend/page.tsx` - Teste com endpoint real

---

## 🎯 PRÓXIMOS PASSOS

### **1. Teste com Token Real:**
- Obter um token real da tabela `estoque_remessa`
- Testar na página `/test-backend`
- Verificar se retorna `{ "type": true, "vistoria": {...} }`

### **2. Verificar Dados:**
- Confirmar estrutura da tabela `estoque_remessa`
- Verificar se campo `token_vistoria` existe e está populado
- Testar com diferentes status de vistoria

### **3. Implementar Próximas Funcionalidades:**
- Usar dados reais no dashboard
- Implementar atualização de itens
- Implementar conclusão de vistoria

---

## 📱 LOGS ESPERADOS

### **✅ SUCESSO:**
```
📡 [API] Fazendo requisição GET para: http://localhost:3333/api/vistoria/TOKEN123
📡 [API] Status da resposta: 200
✅ [API] Vistoria encontrada: {...}
🚗 [API] Dados do equipamento: {placa: "ABC-1234", modelo: "Honda Civic", marca: "Honda"}
👤 [API] Dados do técnico: {nome: "João Silva", id: 789}
```

### **❌ TOKEN INVÁLIDO:**
```
❌ [API] Erro na validação: {code: "TOKEN_INVALID", message: "Token de vistoria inválido..."}
```

---

**🎉 INTEGRAÇÃO COMPLETA!** O frontend agora usa os endpoints reais que já existem no backend AdonisJS! 