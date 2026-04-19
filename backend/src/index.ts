// NovaPay Backend — Express Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { paystackRouter } from './routes/paystack';
import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { walletsRouter } from './routes/wallets';
import { billsRouter } from './routes/bills';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { globalRateLimiter, paymentRateLimiter } from './middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import morgan from 'morgan';
import { logger, stream } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
    })
);

app.use(express.json());

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Request logging ─────────────────────────────────────────────────────────
// Use Morgan for HTTP request logging, piping output to Winston
app.use(morgan('combined', { stream }));

// ─── API Documentation ───────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);

// Auth routes
app.use('/api/auth', authRouter);

// Payment routes with stricter rate limiting
app.use('/api/paystack', paymentRateLimiter, paystackRouter);

// Protected routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/bills', billsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`🚀 NovaPay Backend running on http://localhost:${PORT}`);
    logger.info(`   Health check: http://localhost:${PORT}/health`);
    logger.info(`   API Docs: http://localhost:${PORT}/api-docs`);
});

export default app;
