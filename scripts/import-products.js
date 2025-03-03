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
    // Caminho para o arquivo JSON
    const jsonFilePath = path.join(__dirname, '..', 'public', 'products.json');
    
    // Lê o arquivo JSON
    const productsData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    console.log(`Importando ${productsData.length} produtos...`);
    
    // Contador de produtos importados
    let importedCount = 0;
    
    // Processa cada produto
    for (const product of productsData) {
      try {
        // Verifica se o produto já existe pelo URL
        const checkResult = await pool.query(
          'SELECT id FROM products WHERE url = $1',
          [product.url]
        );
        
        if (checkResult.rows.length > 0) {
          // Atualiza o produto existente
          await pool.query(
            `UPDATE products 
             SET name = $1, price = $2, description = $3, brand = $4, 
                 gender = $5, image = $6, categories = $7, variations = $8, active = $9
             WHERE url = $10`,
            [
              product.name,
              product.price,
              product.description || '',
              product.brand || '',
              product.gender || '',
              product.image || '',
              JSON.stringify(product.categories || []),
              JSON.stringify(product.variations || []),
              product.active !== undefined ? product.active : true,
              product.url
            ]
          );
          console.log(`Produto atualizado: ${product.name}`);
        } else {
          // Insere um novo produto
          await pool.query(
            `INSERT INTO products 
             (name, url, price, description, brand, gender, image, categories, variations, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              product.name,
              product.url,
              product.price,
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
