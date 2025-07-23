# 🔗 Integração com Backend ABPAC

## ✅ **Mudanças Implementadas**

### **1. Configuração da API**

**Arquivo:** `src/config/api.ts`

- **URL Base Dinâmica**: Automaticamente usa `localhost:3333` em desenvolvimento e URL de produção
- **Endpoints Organizados**: Estrutura clara dos endpoints do backend
- **Configurações**: Timeout, headers padrão e outros parâmetros
- **Função Utilitária**: `buildApiUrl()` para construir URLs completas

```typescript
// Exemplo de uso
import { buildApiUrl } from '@/config/api';
const url = buildApiUrl('/vistoria/token123');
// Resultado: http://localhost:3333/api/vistoria/token123
```

### **2. AuthService Atualizado**

**Arquivo:** `src/services/auth/AuthService.ts`

#### **Antes (Mock):**
```typescript
// Validação simulada
if (!token.startsWith('VIS') || token.length < 10) {
  return { valid: false, error: 'Token inválido' };
}
return { valid: true, vistoria: mockData };
```

#### **Depois (Backend Real):**
```typescript
// Chamada real ao backend
const response = await fetch(buildApiUrl(`/vistoria/${token}`));
// Tratamento de erros específicos (404, 401, 403)
// Mapeamento correto dos dados do backend
```

#### **Melhorias:**
- ✅ **Chamadas HTTP Reais** para `GET /api/vistoria/:token`
- ✅ **Tratamento de Erros Específicos** (token inválido, expirado, indisponível)
- ✅ **Mapeamento de Dados** do backend para frontend
- ✅ **Timeout e Recuperação** de erros de rede
- ✅ **Logs Detalhados** para debugging

### **3. Logo da Empresa**

**Arquivo:** `src/app/login/page.tsx`

#### **Antes:**
```jsx
<div className="w-24 h-24 bg-primary rounded-full">
  <span className="text-2xl font-bold">ABPAC</span>
</div>
```

#### **Depois:**
```jsx
<div className="w-32 h-20">
  <img 
    src="/images/logo-colorida.jpg" 
    alt="ABPAC"
    className="object-contain rounded-lg"
  />
</div>
```

#### **Melhorias:**
- ✅ **Logo Real da Empresa** substituindo círculo vermelho
- ✅ **Responsiva** com `object-contain`
- ✅ **Acessibilidade** com alt text apropriado
- ✅ **Remoção do Círculo com Cadeado** desnecessário

---

## 🛠️ **Endpoints Integrados**

### **Validação de Token**
```
GET /api/vistoria/:token
```

**Responses:**
- **200**: Token válido - retorna dados da vistoria
- **404**: Token não encontrado (`TOKEN_INVALID`)
- **401**: Token expirado (`TOKEN_EXPIRED`)
- **403**: Vistoria indisponível (`VISTORIA_UNAVAILABLE`)

**Mapeamento de Dados:**
```typescript
// Backend → Frontend
{
  id: vistoria.id,
  local: vistoria.local_vistoria,
  dataAgendada: vistoria.data_prevista,
  veiculo: {
    placa: vistoria.equipamento.placa1,
    modelo: vistoria.equipamento.marca1 + modelo1,
    cor: vistoria.equipamento.cor,
    ano: vistoria.equipamento.anoF1
  }
}
```

---

## 🔧 **Configuração Local**

### **Backend (Porta 3333)**
```bash
cd backend
npm start
# Servidor rodando em http://localhost:3333
```

### **Frontend (Porta 3000)**
```bash
cd vistoria-tecnico
npm run dev
# App rodando em http://localhost:3000
```

### **Variáveis de Ambiente**
```env
# .env.local (opcional)
NODE_ENV=development  # ou production
```

---

## 🚀 **Como Usar**

1. **Certifique-se que o backend está rodando na porta 3333**
2. **Obtenha um token real do sistema ABPAC**
3. **Acesse:** `http://localhost:3000?token=SEU_TOKEN_AQUI`
4. **O sistema irá validar automaticamente com o backend**

---

## ⚠️ **Importante**

- ❌ **Tokens Mock Descontinuados**: `generateMockToken()` agora é deprecated
- ✅ **Sempre Use Tokens Reais** do backend ABPAC
- 🔄 **Validação no Backend**: Toda validação é feita no servidor
- 📡 **Conexão Necessária**: Sistema requer conectividade com o backend

---

## 🐛 **Debugging**

### **Console Logs:**
```
🔍 Validando token: 12345678...
📡 Response status: 200
✅ Token validado com sucesso
```

### **Erros Comuns:**
- `Não foi possível conectar ao servidor`: Backend não está rodando
- `Token de vistoria inválido`: Token não existe no sistema
- `Token de vistoria expirado`: Token passou do prazo de validade

### **Verificação da API:**
```bash
# Testar manualmente
curl http://localhost:3333/api/vistoria/SEU_TOKEN_AQUI
``` 