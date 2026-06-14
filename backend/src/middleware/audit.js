import { query } from '../db/pool.js';

export async function writeAudit(userId, action, entityType, entityId, details = {}) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId ?? null, action, entityType ?? null, entityId ?? null, JSON.stringify(details)]
    );
  } catch (e) {
    console.error('audit_log write failed', e.message);
  }
}
