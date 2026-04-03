import api from './axiosConfig';

export const groupsApi = {
  createGroup: (data) => api.post('/groups', data),
  getGroup: (id) => api.get(`/groups/${id}`),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  getGroupsBySubject: (subjectId) => api.get(`/groups/subject/${subjectId}`),
  getMyGroups: () => api.get('/groups/my'),

  // fetch all current members of a group with their user details
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),

  // fetch pending (unsent/unaccepted) invitations for a group
  //          only works if the calling user is the group creator
  getPendingInvitations: (groupId) => api.get(`/groups/${groupId}/pending-invitations`),
};