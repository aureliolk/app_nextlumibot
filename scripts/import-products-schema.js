#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const { Pool } = pkg;

// Configuração do dotenv
dotenv.config();

// Obtenção do diretório atual usando ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function importProducts() {
  try {
    // Definindo o schema correto para busca
    await pool.query('SET search_path TO products_schema');
    
    // Verificar se o schema existe
    const schemaCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'products_schema'
      );
    `);
    
    if (!schemaCheck.rows[0].exists) {
      console.log('Schema "products_schema" não existe. Criando...');
      await pool.query(`CREATE SCHEMA IF NOT EXISTS products_schema`);
      console.log('Schema "products_schema" criado com sucesso!');
    }
    
    // Verificar se a tabela existe no schema correto
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'products_schema' 
        AND table_name = 'products'
      );
    `);
    
    // Se a tabela não existir, criar seguindo a estrutura do Prisma
    if (!tableCheck.rows[0].exists) {
      console.log('Tabela "products" não existe no schema "products_schema". Criando...');
      
      await pool.query(`
        CREATE TABLE products_schema.products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(255) NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          description TEXT,
          brand VARCHAR(100),
          gender VARCHAR(50),
          image TEXT,
          categories JSONB DEFAULT '[]',
          variations JSONB DEFAULT '[]',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('Tabela "products" criada com sucesso no schema "products_schema"!');
    } else {
      console.log('Tabela "products" já existe no schema "products_schema".');
    }
    
    // Caminho para o arquivo JSON
    const jsonFilePath = path.join(__dirname, '..', 'public', 'produtos.json');
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Arquivo não encontrado: ${jsonFilePath}`);
      return;
    }
    
    // Lê o arquivo JSON
    let productsData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Criar um mapa para armazenar produtos pelo slug e pegar o nome da primeira variante
    const productNameMap = {};
    productsData.forEach(product => {
      if (product.name && product.slug && !productNameMap[product.slug]) {
        productNameMap[product.slug] = product.name;
      }
    });
    
    // Preencher nomes vazios com o nome do produto principal
    productsData = productsData.map(product => {
      if (!product.name && productNameMap[product.slug]) {
        return { ...product, name: productNameMap[product.slug] };
      }
      return product;
    });
    
    console.log(`Importando ${productsData.length} produtos...`);
    
    // Contador de produtos importados
    let importedCount = 0;
    
    // Processa cada produto
    for (const product of productsData) {
      try {
        // Verifica se o produto já existe pelo URL
        const checkResult = await pool.query(
          'SELECT id FROM products_schema.products WHERE url = $1',
          [product.slug]
        );
        
        // Verifica se tem preço promocional e usa ele se disponível
        const finalPrice = product.promotional_price !== null && product.promotional_price !== undefined 
          ? product.promotional_price 
          : product.price;
          
        if (checkResult.rows.length > 0) {
          // Atualiza o produto existente
          await pool.query(
            `UPDATE products_schema.products
             SET name = $1, price = $2, description = $3, brand = $4,
             gender = $5, image = $6, categories = $7, variations = $8, active = $9
             WHERE url = $10`,
            [
              product.name,
              finalPrice,
              product.description || '',
              product.brand || '',
              product.gender || '',
              product.image || '',
              JSON.stringify(product.categories || []),
              JSON.stringify(product.variations || []),
              product.active !== undefined ? product.active : true,
              product.slug
            ]
          );
          
          console.log(`Produto atualizado: ${product.name}`);
        } else {
          // Insere um novo produto
          await pool.query(
            `INSERT INTO products_schema.products
             (name, url, price, description, brand, gender, image, categories, variations, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              product.name,
              product.slug,
              finalPrice,
              product.description || '',
              product.brand || '',
              product.gender || '',
              product.image || '',
              JSON.stringify(product.categories || []),
              JSON.stringify(product.variations || []),
              product.active !== undefined ? product.active : true
            ]
          );
          
          console.log(`Produto inserido: ${product.name}`);
        }
        
        importedCount++;
        
        // Exibe progresso a cada 10 produtos
        if (importedCount % 10 === 0) {
          console.log(`Progresso: ${importedCount}/${productsData.length} produtos processados (${((importedCount / productsData.length) * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        console.error(`Erro ao processar o produto ${product.name || 'desconhecido'}: ${error.message}`);
      }
    }
    
    console.log(`Importação concluída: ${importedCount} produtos processados com sucesso.`);
  } catch (error) {
    console.error(`Erro durante a importação: ${error.message}`);
    process.exit(1);
  } finally {
    // Fecha a conexão com o banco de dados
    pool.end();
  }
}

// Executa a função principal
importProducts().catch(error => {
  console.error(`Erro fatal: ${error.message}`);
  process.exit(1);
});