import api from './axiosConfig';

const moduleService = {
  getModules: async (moduleId) => {
    const response = await api.get(moduleId ? `/modules?moduleId=${moduleId}` : '/modules');
    return response; // Goals.jsx does .then(r => setGoals(r.data))
  },

  getModuleById: async (id) => {
    const response = await api.get(`/modules/${id}`);
    return response;
  },

  createModule: async (moduleData) => {
    const response = await api.post('/modules', moduleData);
    return response;
  },

  updateModule: async (id, moduleData) => {
    const response = await api.put(`/modules/${id}`, moduleData);
    return response;
  },

  deleteModule: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response;
  }
};

export { moduleService };
export default moduleService;
