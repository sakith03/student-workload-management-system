import api from './axiosConfig';
 
export const academicApi = {
  setupProfile: (data) => api.post('/academic/profile/setup', data),
  getProfile:   ()     => api.get('/academic/profile'),
  addSubject:   (data) => api.post('/academic/subjects', data),
  getSubjects:  ()     => api.get('/academic/subjects'),
};
