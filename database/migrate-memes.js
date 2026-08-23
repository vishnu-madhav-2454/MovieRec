import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', 'server', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movierec',
});

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    // Add image_public_id column to memes table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'memes' AND column_name = 'image_public_id') THEN
          ALTER TABLE memes ADD COLUMN image_public_id TEXT;
        END IF;
      END $$;
    `);
    
    // Add vibes column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'memes' AND column_name = 'vibes') THEN
          ALTER TABLE memes ADD COLUMN vibes TEXT[] DEFAULT '{}';
        END IF;
      END $$;
    `);
    
    console.log('✅ Memes table migrated successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

migrate()
  .then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
