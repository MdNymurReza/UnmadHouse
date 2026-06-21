import { query } from '../db/index.js';

export async function createCorrectionRequest(payload) {
  const { user_id, type, original_value, proposed_value, reason } = payload;
  const result = await query(
    `INSERT INTO requests (user_id, type, original_value, proposed_value, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, type, original_value, proposed_value, reason]
  );
  return result.rows[0];
}

export async function getPendingRequests() {
  const result = await query(
    `SELECT r.*, u.name AS user_name, u.room_no FROM requests r JOIN users u ON r.user_id = u.id WHERE r.status = 'Pending' ORDER BY r.created_at DESC`
  );
  return result.rows;
}

export async function handleRequestDecision(id, decision, reviewerId) {
  const status = decision === 'approve' ? 'Approved' : 'Rejected';
  const result = await query(
    `UPDATE requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || { error: 'Request not found' };
}
