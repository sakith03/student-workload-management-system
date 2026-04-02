// frontend/src/api/goalParserApi.js
import api from './axiosConfig';

export const goalParserApi = {
    /**
     * Send a PDF/DOCX to the backend, which proxies it through n8n + Gemini.
     * Returns a ParsedGoalResponseDto.
     *
     * @param {File}   file       - The uploaded file object
     * @param {string} subjectId  - The selected module/subject ID
     */
    parseDocument: (file, subjectId) => {
        const formData = new FormData();
        formData.append('file', file);

        const query = subjectId ? `?subjectId=${subjectId}` : '';

        return api.post(`/goals/parse-document${query}`, formData, {
            headers:  { 'Content-Type': 'multipart/form-data' },
            timeout:  120_000   // 2 minutes — n8n + Gemini can be slow on free tier
        });
    }
};