import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';

// Obter o diretório atual do módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo CSV
const csvFilePath = path.join(__dirname, '../public/tiendanube-782202-1740155587994758082.csv');
// Caminho para o arquivo JSON de saída
const jsonOutputPath = path.join(__dirname, '../public/products.json');

const results = [];

// Função para corrigir caracteres especiais
function fixSpecialChars(text) {
  if (!text) return '';
  
  // Mapeamento de caracteres problemáticos
  const charMap = {
    '�': 'ã',
    'Suti�': 'Sutiã',
    'Biqu�ni': 'Biquíni',
    'Al�a': 'Alça',
    'Sustenta��o': 'Sustentação',
    'B�sicos': 'Básicos'
  };
  
  // Substituir caracteres problemáticos
  let result = text;
  Object.entries(charMap).forEach(([bad, good]) => {
    result = result.replace(new RegExp(bad, 'g'), good);
  });
  
  return result;
}

// Configuração para lidar com o formato CSV específico da Tienda Nube
fs.createReadStream(csvFilePath, { encoding: 'latin1' })
  .pipe(csvParser({
    separator: ';',
    headers: [
      'url', 'nome', 'categorias', 'variacao1_nome', 'variacao1_valor',
      'variacao2_nome', 'variacao2_valor', 'variacao3_nome', 'variacao3_valor',
      'preco', 'preco_promocional', 'peso', 'altura', 'largura', 'comprimento',
      'estoque', 'sku', 'codigo_barras', 'exibir_loja', 'frete_gratis',
      'descricao', 'tags', 'titulo_seo', 'descricao_seo', 'marca',
      'produto_fisico', 'mpn', 'sexo', 'faixa_etaria', 'custo'
    ],
    skipLines: 1
  }))
  .on('data', (data) => {
    // Processar cada linha do CSV
    const product = {
      id: data.url.split('-').pop(), // Extrair ID do URL
      url: data.url,
      name: fixSpecialChars(data.nome),
      categories: data.categorias.split(',').map(cat => fixSpecialChars(cat.trim())),
      variations: [
        {
          name: data.variacao1_nome,
          value: data.variacao1_valor
        },
        {
          name: data.variacao2_nome,
          value: data.variacao2_valor
        }
      ].filter(v => v.name && v.value), // Remover variações vazias
      price: parseFloat(data.preco.replace(',', '.')),
      salePrice: data.preco_promocional ? parseFloat(data.preco_promocional.replace(',', '.')) : null,
      stock: parseInt(data.estoque, 10),
      sku: data.sku,
      description: data.descricao,
      brand: fixSpecialChars(data.marca),
      gender: fixSpecialChars(data.sexo),
      // Adicionar imagem placeholder (você precisará adicionar URLs reais depois)
      image: `https://via.placeholder.com/300x400?text=${encodeURIComponent(fixSpecialChars(data.nome))}`
    };
    
    // Adicionar ao array de resultados
    if (data.exibir_loja === 'SIM') {
      results.push(product);
    }
  })
  .on('end', () => {
    // Escrever os resultados em um arquivo JSON
    fs.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2));
    console.log(`Conversão concluída! ${results.length} produtos salvos em ${jsonOutputPath}`);
  });