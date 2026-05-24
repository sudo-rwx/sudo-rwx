import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

router.use(verifyToken);

// Get all posts for the logged‑in user (or all if you prefer)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a post
router.post('/', async (req: AuthRequest, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *',
      [req.user!.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a post (only owner)
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE posts SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, req.user!.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Post not found or not owned' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post (only owner)
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [id, req.user!.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Post not found or not owned' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
