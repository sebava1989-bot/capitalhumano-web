export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  min_stock: string;
  active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  active: boolean;
}

export interface StockItem {
  product_id: string;
  warehouse_id: string;
  product_name: string;
  sku: string | null;
  unit: string;
  min_stock: string;
  warehouse_name: string;
  quantity: string;
}

export interface StockAlert {
  product_id: string;
  product_name: string;
  sku: string | null;
  min_stock: string;
  current_stock: string;
  warehouse_name: string;
}

export interface Movement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'transfer';
  quantity: string;
  responsible: string | null;
  created_at: string;
  product_name: string;
}

export interface DTEDocument {
  id: string;
  type: string;
  supplier: string;
  folio: string;
  date: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  document_id: string;
  product_name: string;
  quantity: string;
  unit_price: string | null;
  matched_product_id: string | null;
}

export interface SuggestionItem {
  item_id: string;
  product_name: string;
  quantity: string;
  matched_product_id: string | null;
  suggestions: {
    product_id: string;
    product_name: string;
    sku: string | null;
    confidence: 'exact' | 'partial';
    score: number;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'bodeguero';
  active: boolean;
}
