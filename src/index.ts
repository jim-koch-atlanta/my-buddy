import express, { Request, Response } from 'express';
import { getUserPoolProvider } from './data-access/user-pool-provider';
import dotenv from 'dotenv';

dotenv.config();

// --- Observability: surface anything that would otherwise die silently ---------
// Your UserPool.query fires several super.query(...) calls WITHOUT awaiting them,
// so any failure becomes an "unhandled rejection". These handlers print the full
// error + stack to the `npm run dev` console instead of letting it disappear.
process.on('unhandledRejection', (reason) => {
  console.error('\n[unhandledRejection] >>>');
  console.error(reason);
  console.error('<<<\n');
});
process.on('uncaughtException', (err) => {
  console.error('\n[uncaughtException] >>>');
  console.error(err);
  console.error('<<<\n');
});

// pg errors carry rich diagnostic fields beyond `.message`. Pull them all out so
// both the console and the HTTP response show code/detail/hint/position/etc.
function describeError(err: any) {
  return {
    message: err?.message,
    name: err?.name,
    code: err?.code,          // pg SQLSTATE, e.g. 42601 = syntax error
    detail: err?.detail,
    hint: err?.hint,
    position: err?.position,
    where: err?.where,
    schema: err?.schema,
    table: err?.table,
    column: err?.column,
    constraint: err?.constraint,
    stack: err?.stack,
  };
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Request logger: method, path, status, and duration for every request.
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

const user_id='11111111-2222-3333-4444-555555555555';

// Sample Route: Get current database time to verify connection
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    const userPool = getUserPoolProvider(user_id);
    const result = await userPool.query("SELECT * FROM nudges WHERE user_id = $1", [user_id]);
    res.json({
      success: true,
      message: 'Successfully connected to PostgreSQL!',
      time: JSON.stringify(result),
    });
  } catch (error: any) {
    // Console: full structured error (incl. pg SQLSTATE + stack).
    console.error('[/api/db-status] route error:', describeError(error));
    // Browser: return the rich detail too (dev only — never ship stacks to prod).
    res.status(500).json({ success: false, error: describeError(error) });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
