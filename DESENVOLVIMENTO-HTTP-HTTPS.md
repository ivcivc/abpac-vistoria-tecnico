# Frontend: Suporte HTTP e HTTPS

O projeto `vistoria-tecnico` agora suporta tanto HTTP quanto HTTPS para desenvolvimento, facilitando testes em diferentes dispositivos.

## Comandos Disponíveis

### HTTP (Recomendado para Testes)
```bash
npm run dev:http
```
- ✅ Acessível de qualquer dispositivo na rede local
- ✅ Não requer certificados SSL
- ✅ Ideal para testes em dispositivos móveis

**URLs disponíveis:**
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://[SEU-IP]:3000` (para outros dispositivos na rede)

### HTTPS (Para Desenvolvimento Avançado)
```bash
npm run dev:https
```
- 🔒 Certificados SSL necessários
- 🔒 APIs modernas que exigem HTTPS
- 🔒 Teste de recursos seguros (camera, geolocalização)

**URLs disponíveis:**
- `https://localhost:3000`
- `https://127.0.0.1:3000`
- `https://[SEU-IP]:3000` (para outros dispositivos na rede)

### Comando Padrão
```bash
npm run dev
```
- Usa HTTP por padrão (mesmo comportamento de `dev:http`)

## Configuração de Certificados SSL (apenas para HTTPS)

Se você quiser usar HTTPS, precisa gerar certificados SSL:

### Opção 1: mkcert (Recomendado)
```bash
# Instalar mkcert
npm install -g mkcert

# Criar certificados
mkcert localhost 127.0.0.1 ::1
```

### Opção 2: OpenSSL
```bash
# Gerar chave privada
openssl genrsa -out localhost+2-key.pem 2048

# Gerar certificado
openssl req -new -x509 -key localhost+2-key.pem -out localhost+2.pem -days 365 -subj "/C=BR/ST=MG/L=Uberlandia/O=ABPAC/CN=localhost"
```

## Backend

O backend sempre roda em **HTTP na porta 3333**, independentemente do protocolo do frontend:

```bash
cd backend
node server.js
```

**URL do backend:** `http://localhost:3333`

## Testes em Dispositivos Móveis

### Para HTTP (Mais Fácil)
1. Execute: `npm run dev:http`
2. Descubra seu IP: O terminal mostrará automaticamente
3. Acesse no celular: `http://[SEU-IP]:3000`

### Para HTTPS
1. Configure certificados SSL
2. Execute: `npm run dev:https`
3. Acesse no celular: `https://[SEU-IP]:3000`
4. Aceite o certificado auto-assinado

## Estrutura do Projeto

```
vistoria-tecnico/
├── server.js              # Servidor customizado (HTTP/HTTPS)
├── package.json           # Scripts dev:http e dev:https
├── src/config/api.ts      # Configuração automática da API
├── localhost+2.pem        # Certificado SSL (se usar HTTPS)
└── localhost+2-key.pem    # Chave SSL (se usar HTTPS)
```

## Solução de Problemas

### "Certificados SSL não encontrados"
- Execute os comandos para gerar certificados
- Ou use `npm run dev:http` em vez disso

### "Não consigo acessar de outros dispositivos"
- Verifique se estão na mesma rede Wi-Fi
- Desative firewall temporariamente
- Use o IP correto mostrado no terminal

### "Mixed Content" (quando frontend é HTTPS e backend HTTP)
- Isto é normal e esperado
- O frontend vai tentar acessar o backend HTTP automaticamente
- Se houver problemas, use `npm run dev:http`

## Recomendação

**Para desenvolvimento geral:** Use `npm run dev:http`
**Para APIs que exigem HTTPS:** Use `npm run dev:https` 