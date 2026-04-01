import api from './axiosConfig';

export const groupChatApi = {
  // Get all messages for a group chat
  getMessages: (groupId) => api.get(`/groupchat/${groupId}/messages`),

  // Send a new message to the group chat
  sendMessage: (groupId, messageText) =>
    api.post(`/groupchat/${groupId}/messages`, { messageText }),
};
