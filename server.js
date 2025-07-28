const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Verificar se deve usar HTTPS
const useHttps = process.env.ENABLE_HTTPS === 'true';
const port = process.env.PORT || 3000;

// Função para obter IP local
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Pular endereços internos (como 127.0.0.1) e não IPv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

app.prepare().then(() => {
  if (useHttps) {
    console.log('🔒 Iniciando servidor HTTPS...');

    // Verificar se os certificados existem
    const keyPath = './localhost+2-key.pem';
    const certPath = './localhost+2.pem';

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error('❌ Certificados SSL não encontrados!');
      console.log('📝 Execute o comando para gerar certificados:');
      console.log('   mkcert localhost 127.0.0.1 ::1');
      console.log('');
      console.log('💡 Ou use HTTP em vez disso: npm run dev:http');
      process.exit(1);
    }

    const { createServer } = require('https');
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    createServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, err => {
      if (err) throw err;
      const localIP = getLocalIP();
      console.log(`✅ HTTPS servidor rodando em:`);
      console.log(`   🔒 https://localhost:${port}`);
      console.log(`   🔒 https://127.0.0.1:${port}`);
      console.log(`   🔒 https://${localIP}:${port}`);
      console.log('');
      console.log('💡 Para usar HTTP: npm run dev:http');
    });
  } else {
    console.log('🌐 Iniciando servidor HTTP...');

    const { createServer } = require('http');

    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, err => {
      if (err) throw err;
      const localIP = getLocalIP();
      console.log(`✅ HTTP servidor rodando em:`);
      console.log(`   🌐 http://localhost:${port}`);
      console.log(`   🌐 http://127.0.0.1:${port}`);
      console.log(`   🌐 http://${localIP}:${port}`);
      console.log('');
      console.log('💡 Para usar HTTPS: npm run dev:https');
    });
  }
});
