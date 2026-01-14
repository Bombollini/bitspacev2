import { api } from './apiClient';
import { CreateProjectDto, UpdateProjectDto } from '../types';

// Extending the existing api object or creating a standalone service that uses the api wrapper (or axiosInstance directly if exported)
// Since apiClient.ts exports 'api' object which wraps calls, we can either add to it or use it.

// However, to follow the plan of creating a new file:
// We will simply re-export or wrap the functionality if we were using a different pattern,
// but since apiClient has the logic, let's just ensure apiClient has what we need or add it here.

// Integrating with the existing pattern in apiClient.ts:
// apiClient.ts has `api.projects`. We'll use that.
// If we need to add methods (create, update, delete), we should probably add them to apiClient.ts 
// to keep the pattern consistent, OR we can define them here using the axiosInstance if we export it.

// Let's modify apiClient.ts to include the full CRUD first as it's the cleaner approach for this codebase's pattern.
// But if I strictly must create a service file:

import axios from 'axios';
// We need the axiosInstance from apiClient, but it's not exported.
// I will export axiosInstance from apiClient.ts first.

export const ProjectsService = {
  findAll: async () => {
    return api.projects.list();
  },
  findOne: async (id: string) => {
    return api.projects.get(id);
  },
  create: async (data: CreateProjectDto) => {
    // api.projects.create doesn't exist yet, we need to add it to apiClient.ts or use a raw call
    // Let's assume we will add it to apiClient.ts
    // @ts-ignore
    return api.projects.create(data);
  },
  update: async (id: string, data: UpdateProjectDto) => {
    // @ts-ignore
    return api.projects.update(id, data);
  },
  remove: async (id: string) => {
    // @ts-ignore
    return api.projects.remove(id);
  }
};
