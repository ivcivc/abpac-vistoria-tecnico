# Ì≥ö Documenta√ß√£o do Sistema Vistoria T√©cnico

Bem-vindo √† documenta√ß√£o completa do sistema **Vistoria T√©cnico** - uma aplica√ß√£o PWA para dispositivos m√≥veis que permite aos t√©cnicos realizar vistorias de equipamentos com capacidades offline e sincroniza√ß√£o autom√°tica.

## Ì≥ã √çndice da Documenta√ß√£o

### ÌøóÔ∏è [Arquitetura](./architecture/README.md)
Documenta√ß√£o t√©cnica completa da arquitetura do sistema, incluindo:
- Stack tecnol√≥gico utilizado
- Estrutura de diret√≥rios
- Padr√µes arquiteturais implementados
- Fluxo de dados e estados
- Estrat√©gias de cache e PWA
- Seguran√ßa e autentica√ß√£o
- Performance e otimiza√ß√µes

### Ì±®‚ÄçÌ¥ß [Guia do Usu√°rio](./user-guide/README.md)
Manual completo para t√©cnicos que utilizam o sistema:
- Primeiros passos e configura√ß√£o
- Como realizar uma vistoria completa
- Trabalho em modo offline
- Gerenciamento de fotos e evid√™ncias
- Controle de despesas
- Dicas e boas pr√°ticas
- Resolu√ß√£o de problemas b√°sicos

### Ì¥å [APIs e Interfaces](./api/README.md)
Documenta√ß√£o t√©cnica de todas as APIs e interfaces:
- Endpoints do backend
- Estruturas de request/response
- Servi√ßos frontend
- Interfaces TypeScript
- Hooks personalizados
- Tratamento de erros
- Exemplos de implementa√ß√£o

### Ìª†Ô∏è [Troubleshooting](./troubleshooting/README.md)
Guia completo de resolu√ß√£o de problemas:
- Problemas de autentica√ß√£o
- Quest√µes de conectividade
- Erros de upload e sincroniza√ß√£o
- Problemas espec√≠ficos de dispositivos
- Ferramentas de debug
- Scripts de diagn√≥stico
- Escala√ß√£o de problemas

## Ì∫Ä In√≠cio R√°pido

### Para Usu√°rios T√©cnicos
1. Ì≥ñ Leia o [Guia do Usu√°rio](./user-guide/README.md)
2. Ì¥ß Configure sua conta inicial
3. Ì≥± Instale o PWA no dispositivo
4. Ì≥ã Realize sua primeira vistoria

### Para Desenvolvedores
1. ÌøóÔ∏è Consulte a [Arquitetura](./architecture/README.md)
2. Ì¥å Revise as [APIs](./api/README.md)
3. Ì∑™ Execute os testes automatizados
4. Ìª†Ô∏è Use o [Troubleshooting](./troubleshooting/README.md) para debug

## Ì≥± O que √© o Vistoria T√©cnico?

O **Vistoria T√©cnico** √© uma aplica√ß√£o Progressive Web App (PWA) desenvolvida com Next.js 14 que permite aos t√©cnicos da ABPAC realizar vistorias de equipamentos de forma eficiente, incluindo:

### ‚ú® Funcionalidades Principais

- Ì¥Ñ **Trabalho Offline**: Continue trabalhando mesmo sem internet
- Ì≥∏ **Captura de Evid√™ncias**: Tire fotos e anexe evid√™ncias aos itens
- ÔøΩÔøΩ **Controle de Despesas**: Registre e comprove gastos da vistoria
- Ì¥î **Notifica√ß√µes**: Receba atualiza√ß√µes de aprova√ß√£o/rejei√ß√£o
- Ì≥ä **Relat√≥rios**: Acompanhe progresso e hist√≥rico
- Ì¥ê **Seguro**: Autentica√ß√£o robusta e dados criptografados

### ÌæØ Benef√≠cios

- ‚ö° **Velocidade**: Interface otimizada para dispositivos m√≥veis
- Ì≥∂ **Confiabilidade**: Funciona offline com sincroniza√ß√£o autom√°tica
- Ìæ® **Usabilidade**: Interface intuitiva e acess√≠vel
- Ì¥í **Seguran√ßa**: Dados protegidos e transmiss√£o segura
- Ì≥à **Produtividade**: Fluxo de trabalho otimizado para t√©cnicos

## Ìª†Ô∏è Stack Tecnol√≥gico

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

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Build**: Next.js Build System
- **Deploy**: Vercel/Custom Server

## Ì≥Ç Estrutura da Documenta√ß√£o

\`\`\`
docs/
‚îú‚îÄ‚îÄ README.md                 # Este arquivo - √≠ndice principal
‚îú‚îÄ‚îÄ architecture/             # Documenta√ß√£o t√©cnica
‚îÇ   ‚îî‚îÄ‚îÄ README.md            # Arquitetura e decis√µes t√©cnicas
‚îú‚îÄ‚îÄ user-guide/              # Manual do usu√°rio
‚îÇ   ‚îî‚îÄ‚îÄ README.md            # Guia completo para t√©cnicos
‚îú‚îÄ‚îÄ api/                     # Documenta√ß√£o de APIs
‚îÇ   ‚îî‚îÄ‚îÄ README.md            # Endpoints e interfaces
‚îî‚îÄ‚îÄ troubleshooting/         # Resolu√ß√£o de problemas
    ‚îî‚îÄ‚îÄ README.md            # Guia de troubleshooting
\`\`\`

## Ì¥ó Links √öteis

### Desenvolvimento
- Ì¥ß **Reposit√≥rio**: [GitHub](https://github.com/abpac/vistoria-tecnico)
- Ì∑™ **Testes**: \`npm test\` - Execute os testes automatizados
- Ì≥ä **Coverage**: \`npm run test:coverage\` - Relat√≥rio de cobertura
- Ì∫Ä **Build**: \`npm run build\` - Build de produ√ß√£o

### Ambiente de Teste
- Ìºê **Staging**: [https://vistoria-staging.abpac.com.br](https://vistoria-staging.abpac.com.br)
- Ì≥± **PWA Install**: Adicione √† tela inicial do dispositivo
- Ì¥ë **Login de Teste**: Use credenciais fornecidas pelo administrador

### Produ√ß√£o
- Ìºç **App**: [https://vistoria.abpac.com.br](https://vistoria.abpac.com.br)
- Ì≥à **Status**: [https://status.abpac.com.br](https://status.abpac.com.br)
- Ì≥ß **Suporte**: suporte@abpac.com.br

## Ì≥û Contatos e Suporte

### Suporte T√©cnico
- **Email**: suporte.tecnico@abpac.com.br
- **WhatsApp**: (11) 9 1234-5678
- **Hor√°rio**: Segunda a Sexta, 8h √†s 18h

### Desenvolvimento
- **Email**: dev@abpac.com.br
- **Slack**: #vistoria-tecnico
- **Issues**: GitHub Issues

### Emerg√™ncia
- **24/7**: WhatsApp (11) 9 8765-4321
- **Apenas para**: Problemas cr√≠ticos em produ√ß√£o

## Ì¥Ñ Atualiza√ß√µes da Documenta√ß√£o

Esta documenta√ß√£o √© atualizada sempre que:
- ‚úÖ Novas funcionalidades s√£o implementadas
- Ì∞õ Bugs cr√≠ticos s√£o corrigidos
- Ì¥ß APIs s√£o modificadas
- Ì≥± Problemas comuns s√£o identificados

**√öltima atualiza√ß√£o**: Julho 2024 - Task 25 Implementation

## ÌæØ Como Usar Esta Documenta√ß√£o

### Ì±®‚ÄçÌ¥ß Se voc√™ √© um T√©cnico:
1. Comece pelo [**Guia do Usu√°rio**](./user-guide/README.md)
2. Consulte o [**Troubleshooting**](./troubleshooting/README.md) se tiver problemas
3. Entre em contato com o suporte para d√∫vidas espec√≠ficas

### Ì±©‚ÄçÌ≤ª Se voc√™ √© um Desenvolvedor:
1. Estude a [**Arquitetura**](./architecture/README.md) do sistema
2. Consulte as [**APIs**](./api/README.md) para implementa√ß√µes
3. Use o [**Troubleshooting**](./troubleshooting/README.md) para debug
4. Contribua com melhorias via pull requests

### Ìæì Se voc√™ √© novo no projeto:
1. Leia este README completamente
2. Navegue pela [**Arquitetura**](./architecture/README.md) para entender o sistema
3. Pratique com o [**Guia do Usu√°rio**](./user-guide/README.md)
4. Configure seu ambiente de desenvolvimento

## Ì≥ö Recursos Adicionais

### Documenta√ß√£o Externa
- Ì≥ñ [Next.js Documentation](https://nextjs.org/docs)
- Ìæ® [Tailwind CSS](https://tailwindcss.com/docs)
- Ì∑© [Shadcn UI](https://ui.shadcn.com/)
- Ì∑ÑÔ∏è [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### Tutoriais e Guias
- Ì≥± [PWA Best Practices](https://web.dev/progressive-web-apps/)
- Ì¥í [Security Best Practices](https://owasp.org/www-project-top-ten/)
- ‚ôø [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## ÌøÜ Licen√ßa e Cr√©ditos

**¬© 2024 ABPAC - Associa√ß√£o Brasileira de Prote√ß√£o Automotiva e Cidadania**

Este sistema foi desenvolvido pela equipe interna de desenvolvimento da ABPAC com foco em:
- ÌæØ **Efici√™ncia** para t√©cnicos em campo
- Ì¥í **Seguran√ßa** de dados e informa√ß√µes
- Ì≥± **Acessibilidade** em diferentes dispositivos
- Ìºç **Sustentabilidade** digital e redu√ß√£o de papel

**Contribuidores principais**: Equipe de Desenvolvimento ABPAC

---

Ì≤° **Dica**: Use Ctrl+F (ou Cmd+F no Mac) para buscar rapidamente por termos espec√≠ficos nesta documenta√ß√£o!
