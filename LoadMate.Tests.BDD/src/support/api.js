const { config } = require("./env");

async function apiRequest(method, path, { token, json } = {}) {
  const url = new URL(path.replace(/^\//, ""), config.apiBaseUrl.endsWith("/") ? config.apiBaseUrl : `${config.apiBaseUrl}/`);
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === "object" && data && data.message ? data.message : `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

module.exports = {
  apiRequest,

  register: (payload) => apiRequest("POST", "/auth/register", { json: payload }),
  login: async (email, password) => {
    const data = await apiRequest("POST", "/auth/login", { json: { email, password } });
    return data.token;
  },

  setupProfile: (token, academicYear = 1, semester = 1) =>
    apiRequest("POST", "/academic/profile/setup", { token, json: { academicYear, semester } }),

  addSubject: (token, { code, name, creditHours = 10, color = "#3b82f6" }) =>
    apiRequest("POST", "/academic/subjects", { token, json: { code, name, creditHours, color } }),

  getSubjects: (token) => apiRequest("GET", "/academic/subjects", { token }),

  createGroup: (token, { subjectId, name, description = "", maxMembers = 6 }) =>
    apiRequest("POST", "/groups", { token, json: { subjectId, name, description, maxMembers } }),

  sendInvitation: (token, { groupId, email }) =>
    apiRequest("POST", "/invitations", { token, json: { groupId, email } }),
};

