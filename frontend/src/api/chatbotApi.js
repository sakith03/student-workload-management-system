// FILE: frontend/src/api/chatbotApi.js

import api from './axiosConfig';

export const chatbotApi = {
  initialize: (groupId, moduleName) =>
    api.post('/chatbot/initialize', { groupId, moduleName }),

  sendMessage: (sessionId, userMessage) =>
    api.post('/chatbot/message', { sessionId, userMessage }),

  getHistory: (sessionId) =>
    api.get(`/chatbot/history/${sessionId}`),
};