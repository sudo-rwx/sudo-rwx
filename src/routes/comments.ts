import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db';

const router = Router();
router.use(verifyToken);

// Get all comments for a post
router.get('/post/:postId', async (req: AuthRequest, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC', [postId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment (or reply if parent_id provided)
router.post('/post/:postId', async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { content, parent_id } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [postId, req.user!.id, parent_id || null, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment (owner only)
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, req.user!.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Comment not found or not owned' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment (owner only)
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM comments WHERE id = $1 AND user_id = $2', [id, req.user!.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Comment not found or not owned' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
