// Este script converte um arquivo CSV da Tienda Nube em formato JSON estruturado
// Versão corrigida para tratar problemas de codificação de caracteres

import fs from 'fs';
import Papa from 'papaparse';
import iconv from 'iconv-lite'; // Para lidar com diferentes codificações

// Função para converter o CSV em JSON com tratamento de codificação
function convertCsvToJson(inputFile, outputFile) {
  try {
    // Ler o arquivo CSV como um buffer binário
    const buffer = fs.readFileSync(inputFile);
    
    // Converter de ISO-8859-1 (Latin1) para UTF-8
    // Muitos arquivos brasileiros usam esta codificação
    const csvData = iconv.decode(buffer, 'latin1');
    
    // Parsear o CSV
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Processar os dados para um formato mais adequado
        const products = results.data.map(item => {
          // Processar categorias
          const categories = item['Categorias'] ? 
            item['Categorias'].split(',').map(cat => cat.trim()) : [];
          
          // Processar tags
          const tags = item['Tags'] ? 
            item['Tags'].split(',').map(tag => tag.trim()) : [];
          
          // Criar objeto para as variações
          const variations = [];
          
          if (item['Nome da variação 1'] && item['Valor da variação 1']) {
            variations.push({
              name: item['Nome da variação 1'],
              value: item['Valor da variação 1']
            });
          }
          
          if (item['Nome da variação 2'] && item['Valor da variação 2']) {
            variations.push({
              name: item['Nome da variação 2'],
              value: item['Valor da variação 2']
            });
          }
          
          if (item['Nome da variação 3'] && item['Valor da variação 3']) {
            variations.push({
              name: item['Nome da variação 3'],
              value: item['Valor da variação 3']
            });
          }
          
          // Converter strings vazias para null onde apropriado
          const price = parseFloat(item['Preço'] || '0') || 0;
          const promotionalPrice = item['Preço promocional'] ? parseFloat(item['Preço promocional']) : null;
          const weight = parseFloat(item['Peso (kg)'] || '0') || 0;
          const height = parseFloat(item['Altura (cm)'] || '0') || 0;
          const width = parseFloat(item['Largura (cm)'] || '0') || 0;
          const length = parseFloat(item['Comprimento (cm)'] || '0') || 0;
          const stock = parseInt(item['Estoque'] || '0') || 0;
          const seoTitle = item['Título para SEO'] || null;
          const seoDescription = item['Descrição para SEO'] || null;
          const barcode = item['Código de barras'] || null;
          const mpn = item['MPN (Cód. Exclusivo, Modelo Fabricante)'] || null;
          const gender = item['Sexo'] || null;
          const ageRange = item['Faixa etária'] || null;
          const cost = item['Custo'] ? parseFloat(item['Custo']) : null;
          
          // Criar estrutura de produto
          return {
            slug: item['Identificador URL'],
            name: item['Nome'],
            categories: categories,
            price: price,
            promotional_price: promotionalPrice,
            weight_kg: weight,
            height_cm: height,
            width_cm: width,
            length_cm: length,
            stock: stock,
            sku: item['SKU'],
            barcode: barcode,
            display_in_store: item['Exibir na loja'] === 'SIM',
            free_shipping: item['Frete gratis'] === 'SIM',
            description: item['Descrição'],
            tags: tags,
            seo_title: seoTitle,
            seo_description: seoDescription,
            brand: item['Marca'],
            is_physical: item['Produto Físico'] === 'SIM',
            mpn: mpn,
            gender: gender,
            age_range: ageRange,
            cost: cost,
            variations: variations
          };
        });
        
        // Salvar o JSON em um arquivo com codificação UTF-8
        fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), 'utf8');
        console.log(`Conversão concluída! Total de ${products.length} produtos convertidos para ${outputFile}`);
      },
      error: (error) => {
        console.error('Erro ao parsear CSV:', error);
      }
    });
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
  }
}

// Configurar arquivos de entrada e saída
const inputFile = 'tiendanube-782202-17410478381561394406.csv';
const outputFile = 'produtos.json';

// Executar a conversão
convertCsvToJson(inputFile, outputFile);

// Reportar conclusão
console.log('Script iniciado. Aguarde a conclusão do processamento...');