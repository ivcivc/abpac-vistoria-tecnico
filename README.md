# Sistema de Vistorias Técnicas ABPAC

Sistema para gerenciamento de vistorias técnicas da ABPAC, desenvolvido com Next.js, TypeScript e Shadcn UI.

## Tecnologias Utilizadas

- **Next.js**: Framework React para desenvolvimento web
- **TypeScript**: Superset tipado de JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn UI**: Componentes de UI reutilizáveis
- **ESLint**: Linter para JavaScript/TypeScript
- **Prettier**: Formatador de código
- **IndexedDB**: Armazenamento local para funcionalidade offline

## Estrutura do Projeto

```
vistoria-tecnico/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── contexts/
│   │   ├── SimpleAuthContext.tsx
│   │   └── ...
│   ├── services/
│   │   ├── storage/
│   │   │   ├── IndexedDBService.ts
│   │   │   └── CRUDService.ts
│   │   └── vistoria/
│   │       └── LocalVistoriaService.ts
│   └── lib/
│       └── utils.ts
├── public/
├── docs/
│   └── api/
│       └── ...
├── PLANO-IMPLEMENTACAO.md
├── PLANO-IMPLEMENTACAO-DETALHADO.md
├── PLANO-ACOMPANHAMENTO.md
├── .eslintrc.json
├── .prettierrc
├── components.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Comandos Disponíveis

- **Desenvolvimento**: `npm run dev`
- **Build**: `npm run build`
- **Iniciar**: `npm start`
- **Lint**: `npm run lint`
- **Formatar código**: `npm run format`
- **Testes**: `npm run test`

## Tema ABPAC

O tema foi personalizado com as cores da ABPAC:
- **Vermelho ABPAC**: #E30613
- **Preto ABPAC**: #000000

## Plano de Implementação

Este projeto segue um plano de implementação detalhado dividido em três fases:

1. **Fase 1: Funcionalidades Essenciais**
   - Página de detalhes da vistoria
   - Atualização de itens da vistoria
   - Conclusão de vistoria

2. **Fase 2: Recursos Avançados**
   - Captura e upload de evidências
   - Gestão de despesas
   - Sincronização offline/online

3. **Fase 3: Polimento e Otimização**
   - Melhorias na interface do usuário
   - Otimização de performance
   - Testes e qualidade

Para mais detalhes, consulte os seguintes documentos:
- [Plano de Implementação](./PLANO-IMPLEMENTACAO.md)
- [Detalhamento Técnico](./PLANO-IMPLEMENTACAO-DETALHADO.md)
- [Acompanhamento do Progresso](./PLANO-ACOMPANHAMENTO.md)

## Integração com Backend

O sistema integra-se com o backend AdonisJS existente através dos seguintes endpoints:

- **GET /api/vistoria/:token** - Obter dados da vistoria
- **PUT /api/vistoria/item/:id** - Atualizar item da vistoria
- **POST /api/vistoria/:id/concluir** - Concluir vistoria
- **POST /api/vistoria/:id/adicionar-despesa** - Adicionar despesa à vistoria

Para mais detalhes sobre a integração, consulte [BACKEND-INTEGRATION-REAL.md](./BACKEND-INTEGRATION-REAL.md).

## Funcionalidade Offline

O sistema foi projetado para funcionar offline, utilizando:

- IndexedDB para armazenamento local
- Sistema de fila de sincronização
- Detecção automática de conectividade
- Upload de evidências quando online

## Solução de Problemas Comuns

### Erro de módulo não encontrado

Se você encontrar erros como "Cannot find module 'autoprefixer'" ou similar, instale as dependências necessárias:

```bash
npm install --save-dev autoprefixer postcss
```

### Erro com o Tailwind CSS

Se você encontrar erros relacionados ao Tailwind CSS, certifique-se de estar usando a versão correta:

```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install --save-dev tailwindcss@3.3.0 postcss autoprefixer
```

### Configuração do PostCSS

Certifique-se de que o arquivo `postcss.config.js` está configurado corretamente:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Problemas de IndexedDB

Se encontrar erros relacionados ao IndexedDB, verifique se está usando um navegador compatível e se não está no modo de navegação privada.

## Contribuição

Para contribuir com este projeto, siga o plano de implementação e as diretrizes de código estabelecidas.