import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as maintenanceService from '../services/maintenance.service';
import { MasterDataKind } from '../services/maintenance.service';
import { MasterDataInput } from '../schemas/maintenance.schema';

/** Builds the CRUD handlers for one kind of master data (category or priority). */
export function maintenanceHandlers(kind: MasterDataKind): Record<'list' | 'get' | 'create' | 'update' | 'remove', RequestHandler> {
  return {
    async list(_req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await maintenanceService.listItems(kind));
      } catch (err) {
        next(err);
      }
    },
    async get(req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json(await maintenanceService.getItem(kind, req.params.id));
      } catch (err) {
        next(err);
      }
    },
    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const { name } = req.body as MasterDataInput;
        res.status(201).json(await maintenanceService.createItem(kind, name));
      } catch (err) {
        next(err);
      }
    },
    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const { name } = req.body as MasterDataInput;
        res.status(200).json(await maintenanceService.updateItem(kind, req.params.id, name));
      } catch (err) {
        next(err);
      }
    },
    async remove(req: Request, res: Response, next: NextFunction) {
      try {
        await maintenanceService.deleteItem(kind, req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
}
