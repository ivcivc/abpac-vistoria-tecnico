# Documentação de Testes - Vistoria Técnico

Este diretório contém os testes automatizados para o projeto Vistoria Técnico, implementados como parte da Task 24.

## Estrutura de Diretórios

```
src/tests/
├── components/         # Testes de componentes
│   └── a11y/           # Testes de componentes de acessibilidade
├── integration/        # Testes de integração
│   └── vistoria/       # Testes de integração do fluxo de vistoria
├── unit/               # Testes unitários
│   ├── connectivity/   # Testes de conectividade
│   ├── hooks/          # Testes de hooks
│   └── services/       # Testes de serviços
└── utils/              # Utilitários para testes
    └── test-utils.tsx  # Funções auxiliares para testes
```

## Executando os Testes

Para executar todos os testes:

```bash
npm test
```

Para executar testes com watch mode:

```bash
npm run test:watch
```

Para gerar relatório de cobertura:

```bash
npm run test:coverage
```

## Cobertura de Código

A configuração atual exige pelo menos 70% de cobertura para:
- Linhas
- Funções  
- Branches
- Statements
