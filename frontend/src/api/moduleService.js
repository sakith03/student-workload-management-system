import api from './axiosConfig';

const ModuleService = {
  getModules: async () => {
    const response = await api.get('/modules');
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
    await api.put(`/modules/${id}`, moduleData);
  },

  deleteModule: async (id) => {
    await api.delete(`/modules/${id}`);
  }
};

export default ModuleService;
