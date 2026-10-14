import { Request, Response, NextFunction } from 'express';
import { getReport } from '../services/report.service';

export async function getReportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await getReport(req.user!.sub);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}
