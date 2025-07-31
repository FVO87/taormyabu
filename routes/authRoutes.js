// routes/authRoutes.js
import express from 'express';
import { verifyUser } from '../services/authService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await verifyUser(username, password);

  if (user) {
    req.session.user = { id: user.id, username: user.username };
    res.redirect('/dashboard');
  } else {
    // Idealmente, envie uma mensagem de erro para o frontend
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

export default router;