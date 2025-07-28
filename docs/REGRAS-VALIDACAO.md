# Regras de Validação - Sistema de Vistorias ABPAC

Este documento descreve as regras de validação para edição de itens no Sistema de Vistorias ABPAC, especificando quando um item pode ou não ser editado com base no status da vistoria e do próprio item.

## 1. Regras de Status da Vistoria

A primeira validação verifica o status da vistoria como um todo.

### Status que PERMITEM edição:
- `AGUARDANDO_VISTORIA`
- `EM_VISTORIA`

### Status que BLOQUEIAM edição:
- Qualquer outro status como:
  - `AGUARDANDO_APROVACAO`
  - `CONCLUIDA`
  - `APROVADA`
  - `REJEITADA`
  - etc.

## 2. Regras de Status dos Itens

Após validar o status da vistoria, o sistema verifica o status do item específico.

### Status que PERMITEM edição:
- `PENDENTE` / `pendente`
- `CONCLUIDO` / `concluido`
- `PROBLEMA` / `problema`

### Status que BLOQUEIAM edição:
- `CANCELADO` / `cancelado` (único status de item que bloqueia edição)

## 3. Implementação Técnica

### Validação no Componente VistoriaDetailsContent

```typescript
// Verificar se a vistoria permite edição
const canEditVistoria = () => {
  const authState = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('vistoria_auth_state') || '{}') : {};
  const currentVistoria = authState?.currentVistoria || {};
  
  // O status vem do backend como "AGUARDANDO_VISTORIA", "EM_VISTORIA", etc.
  const vistoriaStatus = currentVistoria?.status;
  
  const statusPermiteEdicao = ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'].includes(vistoriaStatus);
  
  return statusPermiteEdicao;
};

// Verificação do item antes de abrir o modal de edição
const handleEdit = (item: any) => {
  // Verificar se a vistoria permite edição
  if (!canEditVistoria()) {
    alert(`❌ Não é possível editar itens! Status atual da vistoria não permite.`);
    return;
  }
  
  // Verificar se o item não está cancelado
  const itemCancelado = item.status_item === 'CANCELADO' || item.status_item === 'cancelado';
  if (itemCancelado) {
    alert(`❌ Este item está CANCELADO e não pode ser editado.`);
    return;
  }
  
  // Prosseguir com a edição
  setEditingItem(item);
  setEditModalOpen(true);
};
```

### Validação no ItemEditModal

```typescript
// Verificar status dentro do método isFormValid
const isFormValid = (): boolean => {
  // ... outros códigos ...
  
  // Verificar se a vistoria permite edição
  const vistoriaStatus = currentVistoria?.status;
  const podeEditarVistoria = ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'].includes(vistoriaStatus);
  
  // Verificar se item está cancelado
  const itemCancelado = status_item === 'CANCELADO' || status_item === 'cancelado';
  const podeEditar = podeEditarVistoria && !itemCancelado;
  
  if (!podeEditarVistoria) {
    return false;
  }
  
  if (itemCancelado) {
    return false;
  }
  
  // ... outros códigos ...
};
```

### Validação no ApiVistoriaService

```typescript
async atualizarItem(itemId: string, itemData: VistoriaItem, token: string): Promise<ServiceResult> {
  try {
    // Verificar se item não está cancelado
    const itemCancelado = itemData.status === 'CANCELADO' || itemData.status === 'cancelado';
    if (itemCancelado) {
      return {
        success: false,
        error: 'Item cancelado não pode ser atualizado',
        statusCode: 400,
      };
    }
    
    // ... resto do código para atualização ...
  } catch (error) {
    // ... tratamento de erro ...
  }
}
```

### Normalização de Status para Backend

```typescript
// Normalizar status para minúsculas (formato esperado pelo backend)
const normalizeStatus = (status: string): 'pendente' | 'concluido' | 'problema' => {
  const normalized = status.toLowerCase();
  if (['pendente', 'concluido', 'problema'].includes(normalized)) {
    return normalized as 'pendente' | 'concluido' | 'problema';
  }
  // Default para pendente se status inválido
  return 'pendente';
};
```

## 4. Resumo da Regra

Para que um item possa ser editado, AMBAS as condições abaixo devem ser verdadeiras:

1. A vistoria deve estar em um dos seguintes status:
   - `AGUARDANDO_VISTORIA`
   - `EM_VISTORIA`

2. O item NÃO pode estar com o status:
   - `CANCELADO` / `cancelado`

Todos os outros status de item (`PENDENTE`, `CONCLUIDO`, `PROBLEMA`) permitem edição, desde que a vistoria esteja em um status que permita edição.

## 5. Notas Importantes

- O sistema aceita tanto maiúsculas quanto minúsculas para o status do item (`PENDENTE`/`pendente`, etc.)
- Antes de enviar ao backend, o status é normalizado para minúsculas
- A validação ocorre em múltiplas camadas (componente, modal, serviço de API) para garantir consistência
- Botões de edição são desabilitados visualmente quando o item não pode ser editado
- Mensagens de erro específicas informam ao usuário o motivo pelo qual a edição não é permitida 

## 6. Verificações de Segurança

Para garantir a robustez do sistema, implementamos as seguintes verificações de segurança:

### Proteção contra valores undefined

```typescript
// Verificar se status existe antes de converter para maiúsculas
const statusUpperCase = itemData.status ? itemData.status.toUpperCase() : '';
const itemCancelado = statusUpperCase === 'CANCELADO';
```

### Uso correto de constantes para stores do IndexedDB

```typescript
// Usar constantes definidas em vez de strings literais
import { STORES } from '@/types/storage';

const updateResult = await crudService.update(
  STORES.VISTORIAS_LOCAIS, // Usar constante do tipo correto
  vistoriaAtualizada
);
```

### Verificações em cascata

O sistema implementa verificações em cascata para garantir que todas as condições sejam validadas na ordem correta:

1. Verificar se a vistoria existe
2. Verificar se o status da vistoria permite edição
3. Verificar se o item existe
4. Verificar se o status do item permite edição
5. Validar os dados do formulário

Esta abordagem em cascata evita erros de referência nula e garante que o usuário receba feedback preciso sobre o motivo de uma operação não ser permitida. 