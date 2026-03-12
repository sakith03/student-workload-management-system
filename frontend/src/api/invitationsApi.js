// FILE PATH:
// frontend/src/api/invitationsApi.js

import api from './axiosConfig';

export const invitationsApi = {
    // Send invite email (authenticated)
    sendInvitation: (groupId, email) =>
        api.post('/invitations', { groupId, email }),

    // Preview invite info (public — no auth needed)
    previewInvitation: (token) =>
        api.get(`/invitations/preview/${token}`),

    // Accept invitation (authenticated)
    acceptInvitation: (token) =>
        api.post(`/invitations/accept/${token}`),
};