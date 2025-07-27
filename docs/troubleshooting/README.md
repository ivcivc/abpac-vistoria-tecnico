# Guia de Troubleshooting - Vistoria Tecnico

## Problemas Comuns e Solucoes

Esta documentacao contem solucoes para os problemas mais frequentes encontrados no sistema Vistoria Tecnico.

## Problemas de Autenticacao

### "Token de autenticacao invalido ou expirado"

**Sintomas:**
- Erro 401 ao fazer chamadas para API
- Redirecionamento automatico para login
- Mensagem de token expirado

**Solucoes:**

1. **Renovar Token:**
   ```javascript
   // Verificar se o token e valido
   const isValid = AuthService.isTokenValid();
   if (!isValid) {
     await AuthService.refreshToken();
   }
   ```

2. **Fazer Login Novamente:**
   - Logout completo do sistema
   - Limpar localStorage
   - Fazer novo login

3. **Verificar Configuracao:**
   ```javascript
   // Verificar se a BASE_URL esta correta
   console.log('API Base URL:', API_CONFIG.BASE_URL);
   ```

### "Credenciais invalidas"

**Causas Comuns:**
- Username/senha incorretos
- Usuario bloqueado no sistema
- Problemas de conectividade

**Solucoes:**
1. Verificar credenciais
2. Contatar administrador do sistema
3. Tentar em uma rede diferente

## Problemas de Conectividade

### "Failed to fetch" / "Network Error"

**Sintomas:**
- Erro ao carregar dados
- Timeout em requisicoes
- Falha na sincronizacao

**Diagnostico:**

```javascript
// Teste de conectividade
async function diagnosticarConectividade() {
  console.log('Iniciando diagnostico...');
  
  // 1. Verificar conexao com internet
  const onlineStatus = navigator.onLine;
  console.log('Status Online:', onlineStatus);
  
  // 2. Teste de ping basico
  try {
    await fetch('https://www.google.com', { mode: 'no-cors' });
    console.log('Internet: OK');
  } catch {
    console.log('Internet: FALHA');
  }
  
  // 3. Teste da API
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
    console.log('API Status:', response.ok ? 'OK' : 'FALHA');
  } catch (error) {
    console.log('API: INACESSIVEL', error.message);
  }
}
```

**Solucoes:**

1. **Verificar Conectividade:**
   - Confirmar conexao Wi-Fi/dados moveis
   - Testar com outros apps/sites
   - Verificar se nao ha bloqueio de firewall

2. **Configurar Modo Offline:**
   ```javascript
   // Forcar modo offline para trabalhar local
   window.localStorage.setItem('forceOfflineMode', 'true');
   ```

3. **Retry Automatico:**
   ```javascript
   // Implementar retry com backoff
   async function apiCallWithRetry(apiCall, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await apiCall();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   }
   ```

## Problemas com PWA/App

### "App nao funciona offline"

**Verificacoes:**

1. **Service Worker Ativo:**
   ```javascript
   // Verificar se Service Worker esta registrado
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations().then(registrations => {
       console.log('Service Workers:', registrations.length);
     });
   }
   ```

2. **Cache Disponivel:**
   ```javascript
   // Verificar cache do navegador
   if ('caches' in window) {
     caches.keys().then(cacheNames => {
       console.log('Caches disponiveis:', cacheNames);
     });
   }
   ```

**Solucoes:**
- Force refresh (Ctrl+F5)
- Limpar cache do navegador
- Reinstalar PWA

### "App lento ou travando"

**Causas Comuns:**
- Acumulo de dados locais
- Cache excessivo
- Memoria insuficiente

**Solucoes:**

1. **Limpar Dados Locais:**
   ```javascript
   // Script de limpeza
   async function limparDadosLocais() {
     // Limpar localStorage
     localStorage.clear();
     
     // Limpar IndexedDB
     const storageManager = StorageManagerService.getInstance();
     await storageManager.clearAllData();
     
     // Limpar cache
     if ('caches' in window) {
       const cacheNames = await caches.keys();
       await Promise.all(
         cacheNames.map(cacheName => caches.delete(cacheName))
       );
     }
   }
   ```

2. **Otimizar Performance:**
   ```javascript
   // Monitorar performance
   const perfObserver = new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       if (entry.name === 'largest-contentful-paint') {
         console.log('LCP:', entry.startTime);
       }
     }
   });
   perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
   ```

## Problemas com Upload/Fotos

### "Erro ao fazer upload de arquivo"

**Diagnostico:**

```javascript
// Verificar tamanho e tipo do arquivo
function validarArquivo(file) {
  console.log('Arquivo:', {
    nome: file.name,
    tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    tipo: file.type
  });
  
  // Limites
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  
  if (file.size > MAX_SIZE) {
    console.log('Arquivo muito grande');
    return false;
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    console.log('Tipo nao permitido');
    return false;
  }
  
  return true;
}
```

**Solucoes:**

1. **Compressao de Imagem:**
   ```javascript
   async function comprimirImagem(file, qualidade = 0.8) {
     return new Promise((resolve) => {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       const img = new Image();
       
       img.onload = () => {
         // Redimensionar se necessario
         const MAX_WIDTH = 1920;
         const MAX_HEIGHT = 1080;
         
         let { width, height } = img;
         
         if (width > MAX_WIDTH) {
           height = (height * MAX_WIDTH) / width;
           width = MAX_WIDTH;
         }
         
         if (height > MAX_HEIGHT) {
           width = (width * MAX_HEIGHT) / height;
           height = MAX_HEIGHT;
         }
         
         canvas.width = width;
         canvas.height = height;
         
         ctx.drawImage(img, 0, 0, width, height);
         
         canvas.toBlob(resolve, 'image/jpeg', qualidade);
       };
       
       img.src = URL.createObjectURL(file);
     });
   }
   ```

2. **Upload com Retry:**
   ```javascript
   async function uploadComRetry(file, metadata, maxTentativas = 3) {
     for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
       try {
         return await UploadService.uploadFile(file, metadata);
       } catch (error) {
         console.log(`Tentativa ${tentativa} falhou:`, error.message);
         
         if (tentativa === maxTentativas) {
           throw new Error('Upload falhou apos todas as tentativas');
         }
         
         // Aguardar antes da proxima tentativa
         await new Promise(resolve => setTimeout(resolve, 1000 * tentativa));
       }
     }
   }
   ```

### "Foto aparece rotacionada"

**Causa:** Metadados EXIF da camera

**Solucao:**
```javascript
// Corrigir orientacao da imagem
function corrigirOrientacao(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Aplicar correcao baseada em EXIF
        // (implementacao especifica para orientacao)
        
        canvas.toBlob(resolve, file.type);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

## Problemas de Armazenamento

### "Quota exceeded" / "Armazenamento cheio"

**Diagnostico:**
```javascript
async function verificarEspaco() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
    const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
    const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);
    
    console.log(`Armazenamento: ${usedMB}MB / ${quotaMB}MB (${percentUsed}%)`);
    
    if (percentUsed > 80) {
      console.log('Armazenamento quase cheio!');
    }
  }
}
```

**Solucoes:**

1. **Limpeza Automatica:**
   ```javascript
   async function limpezaInteligente() {
     const storageManager = StorageManagerService.getInstance();
     
     // Remover dados antigos (> 30 dias)
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30);
     
     // Implementar logica de limpeza por data
     // ...
   }
   ```

2. **Configurar Limites:**
   ```javascript
   // Ajustar configuracoes de armazenamento
   const storageSettings = {
     maxStorageMB: 500, // Reduzir limite
     cleanupThresholdPercentage: 70, // Limpar mais cedo
     dataRetentionDays: 15 // Manter menos tempo
   };
   
   storageManager.updateSettings(storageSettings);
   ```

## Problemas de Sincronizacao

### "Dados nao sincronizaram"

**Verificacoes:**

1. **Status da Fila:**
   ```javascript
   // Verificar itens pendentes de sincronizacao
   async function verificarFilaSinc() {
     const queueService = new SyncQueueService();
     const pending = await queueService.getPendingItems();
     
     console.log('Itens pendentes:', pending.length);
     pending.forEach(item => {
       console.log(`- ${item.type}: ${item.id} (${item.attempts} tentativas)`);
     });
   }
   ```

2. **Forcar Sincronizacao:**
   ```javascript
   // Forcar sincronizacao manual
   async function forceSyncronizacao() {
     try {
       const syncService = new SyncService();
       await syncService.forceSync();
       console.log('Sincronizacao forcada concluida');
     } catch (error) {
       console.log('Erro na sincronizacao:', error.message);
     }
   }
   ```

**Solucoes:**
1. Verificar conectividade
2. Fazer logout/login
3. Limpar fila de sincronizacao e reprocessar

## Problemas Especificos do Dispositivo

### iOS

**Problemas Comuns:**
- PWA nao instala
- Camera nao funciona no Safari
- LocalStorage limitado

**Solucoes:**
1. Usar Safari (nao Chrome)
2. Habilitar acesso a camera nas configuracoes
3. Implementar fallback para armazenamento

### Android

**Problemas Comuns:**
- Performance lenta em dispositivos antigos
- Problemas com keyboard que sobrepoe interface
- Background sync nao funciona

**Solucoes:**
1. Otimizar para dispositivos com menos RAM
2. Ajustar viewport quando keyboard aparece
3. Implementar sync manual

## Ferramentas de Debug

### Console Debug

```javascript
// Ativar modo debug
window.localStorage.setItem('debugMode', 'true');

// Funcao de debug personalizada
window.debugVistoria = {
  // Verificar estado geral
  status: async () => {
    console.log('Status do Sistema:');
    await diagnosticarConectividade();
    await verificarEspaco();
    await verificarFilaSinc();
  },
  
  // Limpar tudo
  reset: async () => {
    await limparDadosLocais();
    window.location.reload();
  },
  
  // Informacoes do dispositivo
  device: () => {
    console.log('Informacoes do Dispositivo:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });
  }
};
```

### Performance Monitor

```javascript
// Monitor de performance em tempo real
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      apiCalls: 0,
      errors: 0,
      memoryUsage: 0
    };
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    // Monitorar Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}:`, entry.value);
      }
    }).observe({ entryTypes: ['measure'] });
    
    // Monitorar memoria (Chrome only)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        console.log('Memoria:', {
          used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
          total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
          limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
        });
      }, 30000); // A cada 30 segundos
    }
  }
}

// Ativar monitor se debug estiver habilitado
if (localStorage.getItem('debugMode') === 'true') {
  window.perfMonitor = new PerformanceMonitor();
}
```

## Escalacao de Problemas

### Informacoes para Coletar

Quando reportar um problema, inclua:

```javascript
// Script para coletar informacoes do sistema
function coletarInfoSistema() {
  const info = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    localStorage: {
      authToken: !!localStorage.getItem('authToken'),
      debugMode: localStorage.getItem('debugMode'),
      lastSync: localStorage.getItem('lastSyncTime')
    },
    performance: {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
    }
  };
  
  console.log('Informacoes do Sistema:', info);
  return info;
}
```

### Contatos de Suporte

- **Level 1 (Usuario)**: FAQ e documentacao
- **Level 2 (Tecnico)**: suporte.tecnico@abpac.com.br
- **Level 3 (Desenvolvimento)**: dev@abpac.com.br
- **Emergencia**: WhatsApp (11) 9 1234-5678

### Logs para Anexar

1. **Console do navegador** (F12 → Console)
2. **Network logs** (F12 → Network)
3. **Application storage** (F12 → Application)
4. **Screenshots** do problema
5. **Passos para reproduzir** o erro

---

## Dicas de Prevencao

1. **Mantenha o app sempre atualizado**
2. **Faca logout ao final do expediente**
3. **Sincronize regularmente quando online**
4. **Monitore o espaco de armazenamento**
5. **Reporte problemas imediatamente**
6. **Faca backup das fotos importantes**

Lembre-se: a maioria dos problemas pode ser resolvida com um **logout/login** completo! 