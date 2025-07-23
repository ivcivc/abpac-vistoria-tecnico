# 🔍 DIAGNÓSTICO - TOKEN DO USUÁRIO

## 📋 Token em Análise
```
1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf
```

## ⚠️ PROBLEMA IDENTIFICADO
O token é **válido** (não dá erro 404), mas os dados estão aparecendo como **fallback/mock** em vez dos dados reais do backend.

## 🔧 VERIFICAÇÕES NECESSÁRIAS

### **1. Verificar Backend Está Rodando**
```bash
cd backend
npm run dev
# Deve mostrar: Server started on http://localhost:3333
```

### **2. Testar Token Diretamente no Backend**
```bash
# Via terminal/curl
curl -X GET "http://localhost:3333/api/vistoria/1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf" \
  -H "Accept: application/json"
```

### **3. Verificar Dados no Banco de Dados**

Execute este SQL no seu banco:

```sql
-- Verificar se token existe
SELECT 
    id, status, equipamento_id, tecnico_id, 
    local_vistoria, endereco, cidade, tipo_vistoria
FROM estoque_remessa 
WHERE token_vistoria = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';

-- Verificar equipamento relacionado
SELECT e.* 
FROM estoque_remessa er
JOIN equipamentos e ON er.equipamento_id = e.id
WHERE er.token_vistoria = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';

-- Verificar técnico relacionado (se definido)
SELECT p.* 
FROM estoque_remessa er
LEFT JOIN pessoas p ON er.tecnico_id = p.id
WHERE er.token_vistoria = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
```

### **4. Páginas de Debug Criadas**

#### **Página Debug Específica:**
```url
http://localhost:3000/debug-token
```
- Testa automaticamente seu token
- Mostra análise detalhada da resposta
- Identifica problemas específicos

#### **Página Debug Geral:**
```url
http://localhost:3000/test-backend
```
- Teste manual com qualquer token
- Verificação de conectividade

## 🕵️ POSSÍVEIS CAUSAS

### **Causa 1: Dados Ausentes no Banco**
- ✅ Token existe na tabela `estoque_remessa`
- ❌ Campo `equipamento_id` é NULL ou inválido
- ❌ Equipamento não existe na tabela `equipamentos`

**Solução:**
```sql
-- Verificar e corrigir equipamento
UPDATE estoque_remessa 
SET equipamento_id = (SELECT id FROM equipamentos LIMIT 1)
WHERE token_vistoria = 'SEU_TOKEN' AND equipamento_id IS NULL;
```

### **Causa 2: Status Inválido**
- Status não permite acesso: `FINALIZADA`, `CANCELADA`

**Solução:**
```sql
UPDATE estoque_remessa 
SET status = 'AGUARDANDO_VISTORIA'
WHERE token_vistoria = 'SEU_TOKEN';
```

### **Causa 3: Relacionamentos Quebrados**
- `equipamento_id` aponta para equipamento inexistente
- `tecnico_id` aponta para pessoa inexistente

**Solução:**
```sql
-- Verificar integridade
SELECT 
    er.id,
    er.equipamento_id,
    e.id as equipamento_existe,
    er.tecnico_id,
    p.id as tecnico_existe
FROM estoque_remessa er
LEFT JOIN equipamentos e ON er.equipamento_id = e.id
LEFT JOIN pessoas p ON er.tecnico_id = p.id
WHERE er.token_vistoria = 'SEU_TOKEN';
```

### **Causa 4: Middleware/Service com Problema**

**Verificar logs do backend:**
```bash
# No terminal do backend, deve mostrar:
# Acesso à vistoria: { timestamp, token, remessa_id, ... }
```

### **Causa 5: Estrutura de Tabela Incorreta**

**Verificar se tabela tem todos os campos:**
```sql
DESCRIBE estoque_remessa;
-- Deve ter: token_vistoria, equipamento_id, tecnico_id, local_vistoria, etc.
```

## 🎯 TESTE PASSO A PASSO

### **1. Execute o SQL de Verificação**
Use o arquivo: `verificar-token-usuario.sql`

### **2. Acesse a Página de Debug**
```url
http://localhost:3000/debug-token
```

### **3. Verifique Console do Navegador**
Abra F12 → Console e veja logs:
```
📡 [API] Status da resposta: 200
✅ [API] Vistoria encontrada: {...}
🚗 [API] Dados do equipamento: {...}
```

### **4. Verifique Logs do Backend**
No terminal do backend, deve aparecer:
```
Acesso à vistoria: {
  timestamp: "...",
  token: "1da66df8...",
  remessa_id: X,
  equipamento_placa: "ABC-1234",
  tecnico_nome: "João Silva"
}
```

## 🔧 SOLUÇÕES RÁPIDAS

### **Se token não existe:**
```sql
-- Criar vistoria de teste
INSERT INTO estoque_remessa (
    equipamento_id, local_vistoria, cidade, status, token_vistoria
) VALUES (
    (SELECT id FROM equipamentos LIMIT 1),
    'Local de Teste',
    'São Paulo',
    'AGUARDANDO_VISTORIA',
    '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf'
);
```

### **Se equipamento está ausente:**
```sql
-- Criar equipamento de teste
INSERT INTO equipamentos (nome, placa, modelo, marca, cor) VALUES 
('Equipamento Teste', 'ABC-1234', 'Honda Civic', 'Honda', 'Prata');

-- Associar à vistoria
UPDATE estoque_remessa 
SET equipamento_id = LAST_INSERT_ID()
WHERE token_vistoria = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
```

### **Se local está vazio:**
```sql
UPDATE estoque_remessa 
SET 
    local_vistoria = 'Rua das Flores, 123 - Centro',
    cidade = 'São Paulo',
    endereco = 'Rua das Flores, 123 - Centro - São Paulo, SP'
WHERE token_vistoria = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
```

## 📱 RESULTADO ESPERADO

Após corrigir, você deve ver:
- ✅ **Local:** Endereço real (não "Endereço não informado")
- ✅ **Veículo:** Modelo e placa reais (não "Modelo não informado")
- ✅ **Data:** Data real da vistoria
- ✅ **Tipo:** Tipo real da vistoria

## 🚨 SE NADA FUNCIONAR

1. **Verifique se está na tabela correta:**
   - Você mencionou `estoque_vistoria`
   - Backend usa `estoque_remessa`
   - Confirme qual tabela tem o token

2. **Compartilhe resultado do SQL:**
   Execute `verificar-token-usuario.sql` e compartilhe resultado

3. **Logs do backend:**
   Compartilhe logs que aparecem no terminal quando testar

**O frontend está correto - o problema é nos dados do backend!** 🎯 