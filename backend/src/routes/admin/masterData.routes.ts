import { Router } from 'express';
import { validateMiddleware } from '../../middlewares/validate.middleware';
import { masterDataSchema } from '../../schemas/maintenance.schema';
import { maintenanceHandlers } from '../../controllers/maintenance.controller';
import { MasterDataKind } from '../../services/maintenance.service';

/** Full CRUD router for one kind of master data. Mounted under /api/admin. */
export function masterDataRouter(kind: MasterDataKind): Router {
  const router = Router();
  const handlers = maintenanceHandlers(kind);

  router.get('/', handlers.list);
  router.post('/', validateMiddleware(masterDataSchema), handlers.create);
  router.get('/:id', handlers.get);
  router.patch('/:id', validateMiddleware(masterDataSchema), handlers.update);
  router.delete('/:id', handlers.remove);

  return router;
}
