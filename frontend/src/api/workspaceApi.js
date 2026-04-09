import api from './axiosConfig';

export const workspaceApi = {
  getWhiteboardState: (groupId) => api.get(`/groups/${groupId}/whiteboard/state`),
  getFiles: (groupId) => api.get(`/groups/${groupId}/files`),
  uploadFile: (groupId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/groups/${groupId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getDownloadUrl: (groupId, fileId) => `${api.defaults.baseURL}/groups/${groupId}/files/${fileId}/download`,
};
