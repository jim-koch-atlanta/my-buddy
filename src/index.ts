import express, { Request, Response } from 'express';
import { query } from './db';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Sample Route: Get current database time to verify connection
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Successfully connected to PostgreSQL!',
      time: result.rows[0].now,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
