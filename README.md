# Sistema de Vistorias Técnicas ABPAC

Sistema para gerenciamento de vistorias técnicas da ABPAC, desenvolvido com Next.js, TypeScript e Shadcn UI.

## Tecnologias Utilizadas

- **Next.js**: Framework React para desenvolvimento web
- **TypeScript**: Superset tipado de JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn UI**: Componentes de UI reutilizáveis
- **ESLint**: Linter para JavaScript/TypeScript
- **Prettier**: Formatador de código

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
│   └── lib/
│       └── utils.ts
├── public/
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

## Tema ABPAC

O tema foi personalizado com as cores da ABPAC:
- **Vermelho ABPAC**: #E30613
- **Preto ABPAC**: #000000

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