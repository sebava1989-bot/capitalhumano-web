import type {
  LoginResponse, Product, Warehouse, StockItem, StockAlert,
  Movement, DTEDocument, DocumentItem, SuggestionItem, User,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stockia_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stockia_token');
      window.location.href = '/login';
    }
    throw new Error('No autorizado');
  }
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Error desconocido');
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  products: {
    list: () => request<Product[]>('/products'),
    create: (data: { name: string; sku?: string; category?: string; unit?: string; min_stock?: number }) =>
      request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Product, 'name' | 'sku' | 'category' | 'unit' | 'min_stock'>>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  stock: {
    list: () => request<StockItem[]>('/stock'),
    alerts: () => request<StockAlert[]>('/stock/alerts'),
  },
  movements: {
    list: (params?: Record<string, string>) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)))).toString()
        : '';
      return request<Movement[]>(`/movements${qs}`);
    },
    in: (data: { product_id: string; warehouse_id: string; quantity: number; responsible?: string }) =>
      request<Movement>('/movements/in', { method: 'POST', body: JSON.stringify(data) }),
    out: (data: { product_id: string; warehouse_id: string; quantity: number; responsible?: string }) =>
      request<Movement>('/movements/out', { method: 'POST', body: JSON.stringify(data) }),
  },
  documents: {
    list: () => request<DTEDocument[]>('/documents'),
    importXml: (xml: string) =>
      request<DTEDocument & { items: DocumentItem[] }>('/documents/import-xml', {
        method: 'POST',
        body: JSON.stringify({ xml }),
      }),
    items: (id: string) => request<DocumentItem[]>(`/documents/${id}/items`),
    suggestions: (id: string) => request<SuggestionItem[]>(`/documents/${id}/suggestions`),
    updateItem: (docId: string, itemId: string, productId: string | null) =>
      request<DocumentItem>(`/documents/${docId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ product_id: productId }),
      }),
    apply: (id: string, warehouseId: string) =>
      request<{ success: boolean }>(`/documents/${id}/apply`, {
        method: 'POST',
        body: JSON.stringify({ warehouse_id: warehouseId }),
      }),
  },
  warehouses: {
    list: () => request<Warehouse[]>('/warehouses'),
    create: (data: { name: string; location?: string }) =>
      request<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    list: () => request<User[]>('/users'),
    create: (data: { name: string; email: string; password: string; role?: string }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: string, role: string) =>
      request<User>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  },
};
