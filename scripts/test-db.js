import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

async function testConnection() {
  const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  console.log('Tentando conectar com as configurações:', {
    ...config,
    password: '****' // oculta a senha no log
  });

  const pool = new Pool(config);

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexão bem sucedida!', result.rows[0]);
  } catch (err) {
    console.error('Erro na conexão:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
