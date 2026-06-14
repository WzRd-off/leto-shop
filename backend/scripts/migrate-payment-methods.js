import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE payment_methods
        ADD COLUMN IF NOT EXISTS card_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS exp_month SMALLINT,
        ADD COLUMN IF NOT EXISTS exp_year SMALLINT
    `);

    const hasLabel = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payment_methods' AND column_name = 'label'
    `);

    if (hasLabel.rows.length) {
      await client.query(`
        UPDATE payment_methods SET
          card_type = CASE
            WHEN LOWER(label) LIKE '%master%' THEN 'mastercard'
            ELSE 'visa'
          END,
          exp_month = COALESCE(exp_month, 12),
          exp_year = COALESCE(exp_year, 2028)
        WHERE card_type IS NULL
      `);
      await client.query('ALTER TABLE payment_methods DROP COLUMN label');
    }

    await client.query(`
      UPDATE payment_methods SET
        card_type = COALESCE(card_type, 'visa'),
        exp_month = COALESCE(exp_month, 12),
        exp_year = COALESCE(exp_year, 2028)
    `);

    await client.query(`
      ALTER TABLE payment_methods
        ALTER COLUMN card_type SET NOT NULL,
        ALTER COLUMN exp_month SET NOT NULL,
        ALTER COLUMN exp_year SET NOT NULL
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE payment_methods
          ADD CONSTRAINT payment_methods_card_type_check
          CHECK (card_type IN ('visa', 'mastercard'));
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    console.log('payment_methods migrated to card_type + expiry');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
