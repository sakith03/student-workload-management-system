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
    const payload = {
      ...moduleData,
      targetHoursPerWeek: Number(moduleData.targetHoursPerWeek)
    };
    const response = await api.post('/modules', payload);
    return response.data;
  },

  updateModule: async (id, moduleData) => {
    const payload = {
      ...moduleData,
      targetHoursPerWeek: Number(moduleData.targetHoursPerWeek)
    };
    const response = await api.put(`/modules/${id}`, payload);
    return response.data;
  },

  deleteModule: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  }
};

export default moduleService;
