# Documentacao do Sistema Vistoria Tecnico

Bem-vindo a documentacao completa do sistema **Vistoria Tecnico** - uma aplicacao PWA para dispositivos moveis que permite aos tecnicos realizar vistorias de equipamentos com capacidades offline e sincronizacao automatica.

## Indice da Documentacao

### Arquitetura (./architecture/README.md)
Documentacao tecnica completa da arquitetura do sistema, incluindo:
- Stack tecnologico utilizado
- Estrutura de diretorios
- Padroes arquiteturais implementados
- Fluxo de dados e estados
- Estrategias de cache e PWA
- Seguranca e autenticacao
- Performance e otimizacoes

### Guia do Usuario (./user-guide/README.md)
Manual completo para tecnicos que utilizam o sistema:
- Primeiros passos e configuracao
- Como realizar uma vistoria completa
- Trabalho em modo offline
- Gerenciamento de fotos e evidencias
- Controle de despesas
- Dicas e boas praticas
- Resolucao de problemas basicos

### APIs e Interfaces (./api/README.md)
Documentacao tecnica de todas as APIs e interfaces:
- Endpoints do backend
- Estruturas de request/response
- Servicos frontend
- Interfaces TypeScript
- Hooks personalizados
- Tratamento de erros
- Exemplos de implementacao

### Troubleshooting (./troubleshooting/README.md)
Guia completo de resolucao de problemas:
- Problemas de autenticacao
- Questoes de conectividade
- Erros de upload e sincronizacao
- Problemas especificos de dispositivos
- Ferramentas de debug
- Scripts de diagnostico
- Escalacao de problemas

## Inicio Rapido

### Para Usuarios Tecnicos
1. Leia o Guia do Usuario
2. Configure sua conta inicial
3. Instale o PWA no dispositivo
4. Realize sua primeira vistoria

### Para Desenvolvedores
1. Consulte a Arquitetura
2. Revise as APIs
3. Execute os testes automatizados
4. Use o Troubleshooting para debug

## O que e o Vistoria Tecnico?

O **Vistoria Tecnico** e uma aplicacao Progressive Web App (PWA) desenvolvida com Next.js 14 que permite aos tecnicos da ABPAC realizar vistorias de equipamentos de forma eficiente.

### Funcionalidades Principais

- **Trabalho Offline**: Continue trabalhando mesmo sem internet
- **Captura de Evidencias**: Tire fotos e anexe evidencias aos itens
- **Controle de Despesas**: Registre e comprove gastos da vistoria
- **Notificacoes**: Receba atualizacoes de aprovacao/rejeicao
- **Relatorios**: Acompanhe progresso e historico
- **Seguro**: Autenticacao robusta e dados criptografados

## Stack Tecnologico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript/JavaScript
- **UI**: Tailwind CSS + Shadcn UI
- **PWA**: next-pwa
- **Storage**: IndexedDB + localStorage
- **Testes**: Jest + React Testing Library

### Backend
- **Framework**: AdonisJS 4
- **Database**: MySQL
- **Authentication**: JWT
- **Upload**: S3/Local Storage
- **APIs**: RESTful

## Contatos e Suporte

### Suporte Tecnico
- **Email**: suporte.tecnico@abpac.com.br
- **WhatsApp**: (11) 9 1234-5678
- **Horario**: Segunda a Sexta, 8h as 18h

### Desenvolvimento
- **Email**: dev@abpac.com.br
- **Issues**: GitHub Issues

**Ultima atualizacao**: Julho 2024 - Task 25 Implementation 