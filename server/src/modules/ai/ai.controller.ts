import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';

export class AiController {
  /**
   * Phase 2: POST /api/v1/ai/parse-input (and /parse)
   */
  static async parseInput(req: Request, res: Response, next: NextFunction) {
    try {
      const text = req.body.text || req.body.input;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, message: 'Raw text input string is required' });
      }

      const result = await AiService.parseRawText(req.workspaceId!, text);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Commit verified batch: POST /api/v1/ai/commit
   */
  static async commitBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { parsedData } = req.body;
      if (!parsedData) {
        return res.status(400).json({ success: false, message: 'Parsed data is required' });
      }

      const result = await AiService.commitBatch(req.workspaceId!, parsedData, req.user!.id);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * One-click Undo batch: POST /api/v1/ai/undo/:batchId
   */
  static async undoBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { batchId } = req.params;
      const result = await AiService.undoBatch(req.workspaceId!, batchId, req.user!.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Phase 3: POST /api/v1/ai/query (and /ask)
   * Text-to-Aggregation Pipeline with Read-Only DB execution & grounded response
   */
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const question = req.body.question || req.body.query;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, message: 'Question string is required' });
      }

      const result = await AiService.executeQuery(req.workspaceId!, question);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
