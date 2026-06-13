// Lightweight fetch wrapper. Token is read from localStorage for admin calls.

const TOKEN_KEY = "havi_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Public
  getSite: () => request("/site"),
  submitContact: (body) => request("/contact", { method: "POST", body }),
  getBlogs: () => request("/site/blogs"),
  getBlog: (slug) => request(`/site/blogs/${slug}`),
  getAds: () => request("/site/ads"),
  getAd: (id) => request(`/site/ads/${id}`),
  submitAd: (body) => request("/site/ads", { method: "POST", body }),

  // Auth
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me", { auth: true }),

  // Admin generic helpers
  list: (resource) => request(`/admin/${resource}`, { auth: true }),
  create: (resource, body) =>
    request(`/admin/${resource}`, { method: "POST", body, auth: true }),
  update: (resource, id, body) =>
    request(`/admin/${resource}/${id}`, { method: "PUT", body, auth: true }),
  remove: (resource, id) =>
    request(`/admin/${resource}/${id}`, { method: "DELETE", auth: true }),

  // Settings
  getSettings: () => request("/admin/settings", { auth: true }),
  saveSettings: (key, body) =>
    request(`/admin/settings/${key}`, { method: "PUT", body, auth: true }),

  // Messages
  listMessages: () => request("/contact", { auth: true }),
  markMessage: (id, read) =>
    request(`/contact/${id}`, { method: "PATCH", body: { read }, auth: true }),
  deleteMessage: (id) =>
    request(`/contact/${id}`, { method: "DELETE", auth: true }),

  // Upload (multipart)
  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/admin/upload", {
      method: "POST",
      body: fd,
      auth: true,
      isForm: true,
    });
  },
};
