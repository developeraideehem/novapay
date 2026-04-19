// NovaPay Backend — Health Route
import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'novapay-backend',
        timestamp: new Date().toISOString(),
    });
});
