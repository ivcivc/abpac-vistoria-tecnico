const fs = require('fs');
const path = require('path');

// Função para criar um ícone SVG simples
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="256" fill="#E30613"/>
  <circle cx="256" cy="256" r="200" fill="#000000"/>
  <text x="256" y="230" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold">ABPAC</text>
  <text x="256" y="280" text-anchor="middle" fill="#E30613" font-family="Arial, sans-serif" font-size="20" font-weight="normal">VISTORIA</text>
  <circle cx="256" cy="256" r="240" fill="none" stroke="#FFFFFF" stroke-width="4"/>
</svg>`;
}

// Tamanhos necessários para PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Criar diretório de ícones se não existir
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Para cada tamanho, criar um arquivo SVG temporário
// (Normalmente usaríamos uma biblioteca como sharp para converter SVG para PNG)
console.log('Gerando ícones PWA...');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Criado: ${filename}`);
});

// Criar também um favicon.svg na raiz do public
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
fs.writeFileSync(faviconPath, createSVGIcon(32));
console.log('✅ Criado: favicon.svg');

console.log('\n📝 IMPORTANTE:');
console.log('Os ícones foram criados em formato SVG como placeholder.');
console.log('Para produção, você deve:');
console.log('1. Usar a logo oficial da ABPAC');
console.log(
  '2. Converter os SVGs para PNG usando uma ferramenta como ImageMagick ou online converter'
);
console.log('3. Otimizar os PNGs para PWA');

console.log('\n🚀 Configuração PWA concluída!');
