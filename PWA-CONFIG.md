# Configuração PWA - Sistema de Vistoria ABPAC

## ✅ Tarefa 2 Concluída: Configurar PWA e Service Worker

### O que foi implementado:

#### 1. **Dependências PWA**
- ✅ `next-pwa` - Plugin para PWA no Next.js
- ✅ `workbox-webpack-plugin` - Estratégias de cache avançadas

#### 2. **Manifest.json**
- ✅ Configuração completa com identidade visual da ABPAC
- ✅ Cores: Background #000000, Theme #E30613 
- ✅ Display: standalone (aplicação nativa)
- ✅ Orientação: portrait-primary (otimizado para mobile)
- ✅ Categorias: productivity, business
- ✅ Ícones SVG temporários (8 tamanhos diferentes)

#### 3. **Next.js Configuration (next.config.ts)**
- ✅ PWA habilitado com `next-pwa`
- ✅ Service Worker desabilitado em desenvolvimento
- ✅ Auto-registro e skipWaiting habilitados
- ✅ Estratégias de cache configuradas:
  - **NetworkFirst**: Para requisições HTTP e APIs
  - **CacheFirst**: Para imagens e recursos estáticos
  - **Expirações**: 24h para dados gerais, 30 dias para assets
- ✅ Headers de cache otimizados para manifest e SW

#### 4. **Layout com Metadados PWA**
- ✅ Metadata completa para PWA
- ✅ Viewport configurado para mobile
- ✅ Apple Web App configuração
- ✅ Open Graph e Twitter Cards
- ✅ Theme colors responsivos (light/dark)
- ✅ Ícones para diferentes dispositivos

#### 5. **Página Offline**
- ✅ Página offline.html personalizada
- ✅ Design nas cores da ABPAC
- ✅ Detecção automática de reconexão
- ✅ Redirecionamento automático quando volta online

#### 6. **Ícones Temporários**
- ✅ Script gerador de ícones SVG
- ✅ 8 tamanhos diferentes (72x72 até 512x512)
- ✅ Design com logo ABPAC temporário
- ✅ Favicon.svg criado

### Como testar a PWA:

1. **Acesse**: http://localhost:3000
2. **Chrome/Edge**: Ícone de instalação aparece na barra de endereços
3. **Mobile**: Opção "Adicionar à tela inicial" disponível
4. **DevTools**: Application > Manifest para verificar configurações
5. **Lighthouse**: Auditoria PWA deve passar com pontuação alta

### Próximos passos:

1. **Ícones**: Substituir SVGs temporários por PNGs oficiais da ABPAC
2. **Screenshots**: Adicionar capturas de tela para app stores
3. **Logo**: Usar a logo oficial da ABPAC localizada em `/public/images/logo-colorida.jpg`

### Arquivos criados/modificados:

- ✅ `public/manifest.json` - Configuração PWA
- ✅ `public/offline.html` - Página offline
- ✅ `public/icons/` - Ícones temporários (8 arquivos SVG)
- ✅ `public/favicon.svg` - Favicon
- ✅ `next.config.ts` - Configuração Next.js + PWA
- ✅ `src/app/layout.tsx` - Metadados PWA
- ✅ `scripts/generate-icons.js` - Gerador de ícones
- ✅ `package.json` - Dependências PWA

### Status: ✅ CONCLUÍDA

A PWA está funcional e pode ser instalada. O Service Worker está ativo e as estratégias de cache estão operacionais. 