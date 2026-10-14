import { getOverdueCount, getStatusCounts, getUpcomingTasks } from '../repositories/report.repository';
import { addDays, startOfTodayUTC } from '../utils/date';

const UPCOMING_WINDOW_DAYS = 7;

export interface TaskReport {
  byStatus: { pending: number; in_progress: number; done: number };
  overdueCount: number;
  upcoming: {
    count: number;
    tasks: Array<{ id: string; title: string; dueDate: Date | null }>;
  };
}

export async function getReport(userId: string): Promise<TaskReport> {
  const today = startOfTodayUTC();
  // Window covers today through the 7th day from today, inclusive
  const windowEnd = addDays(today, UPCOMING_WINDOW_DAYS + 1);

  const [byStatus, overdueCount, upcomingTasks] = await Promise.all([
    getStatusCounts(userId),
    getOverdueCount(userId, today),
    getUpcomingTasks(userId, today, windowEnd),
  ]);

  return {
    byStatus,
    overdueCount,
    upcoming: { count: upcomingTasks.length, tasks: upcomingTasks },
  };
}
