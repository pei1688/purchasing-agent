// 商品變體類型
export interface ProductVariant {
  id?: string;
  name: string;
  stock: number;
  price: number;
}

// 商品表單資料類型
export interface ProductFormData {
  productName: string;
  productDescription: string;
  productTags: string;
  productImages: string[];
  inventoryNumber: string;
  inventoryQuantity: number;
  exchangeRate: number;
  costPrice: number;
  productPrice: number;
  variants?: ProductVariant[];
}

// API 返回的商品資料類型
export interface Product extends ProductFormData {
  id: string;
  created_at: string;
  updated_at: string;
}

// 商品列表查詢參數
export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}
