const API_BASE = '/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('smart_mess_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: async (creds: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    return handleResponse(res);
  },
  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Dashboard
  getDashboardOverview: async () => {
    const res = await fetch(`${API_BASE}/dashboard/overview`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Members
  getMembers: async (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/members?${q}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  getMemberById: async (id: string) => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  createMember: async (data: any) => {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateMember: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  deleteMember: async (id: string) => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Meals
  getDailyMeals: async (date: string) => {
    const res = await fetch(`${API_BASE}/meals/daily?date=${date}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  bulkSaveDailyMeals: async (date: string, entries: any[]) => {
    const res = await fetch(`${API_BASE}/meals/daily/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ date, entries })
    });
    return handleResponse(res);
  },
  getMonthlyMeals: async (month: string) => {
    const res = await fetch(`${API_BASE}/meals/monthly?month=${month}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Market / Bazar
  getMarketTransactions: async (params?: { month?: string; date?: string; purchasedBy?: string; category?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/market?${q}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  createMarketTransaction: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/market`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  updateMarketTransaction: async (id: string, formData: FormData) => {
    const res = await fetch(`${API_BASE}/market/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  deleteMarketTransaction: async (id: string) => {
    const res = await fetch(`${API_BASE}/market/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  getMarketSummary: async (month: string) => {
    const res = await fetch(`${API_BASE}/market/summary?month=${month}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Deposits
  getDeposits: async (params?: { month?: string; member?: string; paymentMethod?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/deposits?${q}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  createDeposit: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/deposits`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  updateDeposit: async (id: string, formData: FormData) => {
    const res = await fetch(`${API_BASE}/deposits/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  deleteDeposit: async (id: string) => {
    const res = await fetch(`${API_BASE}/deposits/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Expenses & House bills
  getExpenses: async (params?: { month?: string; category?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/expenses?${q}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  createExpense: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  updateExpense: async (id: string, formData: FormData) => {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },
  deleteExpense: async (id: string) => {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  getBuaBills: async () => {
    const res = await fetch(`${API_BASE}/expenses/bua-bills`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Monthly Settlement
  getMonthlySettlement: async (month: string) => {
    const res = await fetch(`${API_BASE}/settlement?month=${month}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  closeMonth: async (data: { month: string; notes?: string; overrideMillRate?: number }) => {
    const res = await fetch(`${API_BASE}/settlement/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  reopenMonth: async (month: string) => {
    const res = await fetch(`${API_BASE}/settlement/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ month })
    });
    return handleResponse(res);
  },
  getMemberStatement: async (month: string, memberId: string) => {
    const res = await fetch(`${API_BASE}/settlement/member-statement?month=${month}&memberId=${memberId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  updateSettings: async (data: any) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },
  updateUserRole: async (id: string, role: string, isActive?: boolean) => {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ role, isActive })
    });
    return handleResponse(res);
  },
  resetPassword: async (id: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ newPassword })
    });
    return handleResponse(res);
  }
};

