import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';

export class AiController {
  static async parseText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, message: 'Text input is required' });
      }

      const result = await AiService.parseRawText(req.workspaceId!, text);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

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

  static async undoBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { batchId } = req.params;
      const result = await AiService.undoBatch(req.workspaceId!, batchId, req.user!.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, message: 'Question string is required' });
      }

      const result = await AiService.askWorkspace(req.workspaceId!, question);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
