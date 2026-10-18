import type { CourseSummary, HomeCourses } from '@shared/types/course';
import { api, unwrap } from './client';

export const coursesApi = {
  list: () => unwrap<CourseSummary[]>(api.get('/courses')),
  home: () => unwrap<HomeCourses>(api.get('/courses', { params: { home: 1 } })),
};
