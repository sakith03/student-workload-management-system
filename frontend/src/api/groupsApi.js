import api from './axiosConfig';
 
export const groupsApi = {
  createGroup:       (data)      => api.post('/groups', data),
  getGroup:          (id)        => api.get(`/groups/${id}`),
  getGroupsBySubject:(subjectId) => api.get(`/groups/subject/${subjectId}`),
  getMyGroups:       ()          => api.get('/groups/my'),
};
