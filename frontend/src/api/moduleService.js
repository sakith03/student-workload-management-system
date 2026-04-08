import api from './axiosConfig';

export const moduleService = {
  getModules: async (moduleId) => {
    const response = await api.get(moduleId ? `/modules?moduleId=${moduleId}` : '/modules');
    return response.data;
  },

  getModuleById: async (id) => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  createModule: async (moduleData) => {
    const response = await api.post('/modules', moduleData);
    return response.data;
  },

  updateModule: async (id, moduleData) => {
    const response = await api.put(`/modules/${id}`, moduleData);
    return response.data;
  },

  patchCompletions: async (id, completions) => {
    // completions: boolean[]
    const response = await api.patch(`/modules/${id}/completions`, { completions });
    return response;
  },

  deleteModule: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  }
};

export default moduleService;
