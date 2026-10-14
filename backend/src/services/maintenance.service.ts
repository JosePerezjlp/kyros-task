import * as categoryRepo from '../repositories/category.repository';
import * as priorityRepo from '../repositories/priority.repository';
import { AppError } from '../utils/AppError';

export type MasterDataKind = 'category' | 'priority';

export interface MasterDataItem {
  id: string;
  name: string;
  createdAt: Date;
}

interface MasterDataRepository {
  label: string;
  findAll(): Promise<MasterDataItem[]>;
  findById(id: string): Promise<MasterDataItem | null>;
  findByName(name: string, excludeId?: string): Promise<MasterDataItem | null>;
  create(name: string): Promise<MasterDataItem>;
  update(id: string, name: string): Promise<MasterDataItem>;
  remove(id: string): Promise<void>;
  countTasksUsing(id: string): Promise<number>;
}

// Categories and priorities follow the same rules, so both share one service implementation
const repositories: Record<MasterDataKind, MasterDataRepository> = {
  category: {
    label: 'Categoría',
    findAll: categoryRepo.findAllCategories,
    findById: categoryRepo.findCategoryById,
    findByName: categoryRepo.findCategoryByName,
    create: categoryRepo.createCategory,
    update: categoryRepo.updateCategory,
    remove: categoryRepo.deleteCategory,
    countTasksUsing: categoryRepo.countTasksUsingCategory,
  },
  priority: {
    label: 'Prioridad',
    findAll: priorityRepo.findAllPriorities,
    findById: priorityRepo.findPriorityById,
    findByName: priorityRepo.findPriorityByName,
    create: priorityRepo.createPriority,
    update: priorityRepo.updatePriority,
    remove: priorityRepo.deletePriority,
    countTasksUsing: priorityRepo.countTasksUsingPriority,
  },
};

async function getExisting(repo: MasterDataRepository, id: string): Promise<MasterDataItem> {
  const item = await repo.findById(id);
  if (!item) {
    throw new AppError(404, `${repo.label} no encontrada`);
  }
  return item;
}

async function assertNameAvailable(repo: MasterDataRepository, name: string, excludeId?: string): Promise<void> {
  if (await repo.findByName(name, excludeId)) {
    throw new AppError(409, `Ya existe una ${repo.label.toLowerCase()} con el nombre "${name}"`);
  }
}

export async function listItems(kind: MasterDataKind): Promise<MasterDataItem[]> {
  return repositories[kind].findAll();
}

export async function getItem(kind: MasterDataKind, id: string): Promise<MasterDataItem> {
  return getExisting(repositories[kind], id);
}

export async function createItem(kind: MasterDataKind, name: string): Promise<MasterDataItem> {
  const repo = repositories[kind];
  await assertNameAvailable(repo, name);
  return repo.create(name);
}

export async function updateItem(kind: MasterDataKind, id: string, name: string): Promise<MasterDataItem> {
  const repo = repositories[kind];
  await getExisting(repo, id);
  await assertNameAvailable(repo, name, id);
  return repo.update(id, name);
}

export async function deleteItem(kind: MasterDataKind, id: string): Promise<void> {
  const repo = repositories[kind];
  await getExisting(repo, id);
  if ((await repo.countTasksUsing(id)) > 0) {
    throw new AppError(409, `La ${repo.label.toLowerCase()} está asignada a una o más tareas y no se puede eliminar`);
  }
  await repo.remove(id);
}
