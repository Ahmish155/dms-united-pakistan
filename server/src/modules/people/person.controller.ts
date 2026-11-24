import { Request, Response, NextFunction } from 'express';
import { PersonService } from './person.service';
import { createPersonSchema, PersonStage } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class PersonController {
  static async createPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPersonSchema.parse(req.body);
      const person = await PersonService.createPerson(
        req.workspaceId!,
        validated,
        req.user!.id
      );
      return res.status(201).json({
        success: true,
        data: person
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPeople(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, stage, role, search } = req.query;
      const people = await PersonService.getPeople(req.workspaceId!, {
        unitId: unitId as string,
        stage: stage as any,
        role: role as any,
        search: search as string
      });
      return res.status(200).json({
        success: true,
        data: people
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPersonById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PersonService.getPersonById(
        req.workspaceId!,
        req.params.id
      );
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const person = await PersonService.updatePerson(
        req.workspaceId!,
        req.params.id,
        req.body,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: person
      });
    } catch (error) {
      next(error);
    }
  }

  static async promotePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { toStage, remarks } = req.body;
      if (!toStage || !Object.values(PersonStage).includes(toStage)) {
        throw new AppError('Valid toStage is required', 400);
      }
      const result = await PersonService.promotePerson(
        req.workspaceId!,
        req.params.id,
        toStage,
        remarks || '',
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async transferPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const { toUnitId, remarks } = req.body;
      if (!toUnitId) {
        throw new AppError('Target toUnitId is required', 400);
      }
      const result = await PersonService.transferPerson(
        req.workspaceId!,
        req.params.id,
        toUnitId,
        remarks || '',
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePerson(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PersonService.deletePerson(
        req.workspaceId!,
        req.params.id,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
