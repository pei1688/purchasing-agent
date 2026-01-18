import { toast } from "sonner";
import supabase from "../lib/supabase";
import type { ProductFormData, ProductVariant } from "../types/products";

// services/apiProducts.ts
export async function createProducts({
  productData,
  variants,
}: {
  productData: ProductFormData;
  variants: ProductVariant[];
}) {
  // 1. 先建立產品
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (productError) throw productError;

  // 2. 如果有變體,建立變體
  if (variants.length > 0) {
    const variantsWithProductId = variants.map((v) => ({
      ...v,
      product_id: product.id,
    }));

    const { error: variantsError } = await supabase
      .from("variants")
      .insert(variantsWithProductId);

    if (variantsError) throw variantsError;
  }

  return product;
}

export async function updateProduct(id: string, productData: ProductFormData) {
  try {
    // 1. 從 productData 中分離出商品資料和變體資料
    const { variants, ...productFields } = productData;

    // 2. 更新商品基本資料
    const { data: updatedProduct, error: productError } = await supabase
      .from("products")
      .update(productFields)
      .eq("id", id)
      .select()
      .single();

    if (productError) {
      console.error("更新商品失敗:", productError);
      toast.error("更新商品失敗");
      throw productError;
    }

    // 3. 處理變體
    if (variants) {
      // 3a. 先刪除該商品的所有舊變體
      const { error: deleteError } = await supabase
        .from("variants")
        .delete()
        .eq("product_id", id);

      if (deleteError) {
        console.error("刪除舊變體失敗:", deleteError);
        toast.error("更新變體失敗");
        throw deleteError;
      }

      // 3b. 如果有新變體，插入它們
      if (variants.length > 0) {
        const variantsToInsert = variants.map((variant) => ({
          product_id: id,
          name: variant.name,
          stock: variant.stock,
          price: variant.price,
        }));

        const { error: insertError } = await supabase
          .from("variants")
          .insert(variantsToInsert);

        if (insertError) {
          console.error("插入新變體失敗:", insertError);
          toast.error("更新變體失敗");
          throw insertError;
        }
      }
    }
    return updatedProduct;
  } catch (error) {
    console.error("更新商品過程發生錯誤:", error);
    throw error;
  }
}

export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("獲取商品失敗:", error);
  }
  return data;
}

export async function getProduct({ productId }: { productId: string }) {
  const { data, error } = await supabase
    .from("products")
    .select("*,variants(*)")
    .eq("id", productId)
    .single();
  if (error) {
    console.error("獲取商品失敗:", error);
  }
  return data;
}

export async function uploadProductImage(file: File): Promise<string> {
  try {
    // 檔名處理：加上亂數與時間戳避免重複
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // 上傳到 Supabase Storage（bucket 名稱自行對應）
    const { error: uploadError } = await supabase.storage
      .from("productImage") // ⚠️ 確保 bucket 名稱正確
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 取得公開 URL
    const { data } = supabase.storage
      .from("productImage")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("無法取得圖片 URL");

    console.log("上傳成功:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("圖片上傳失敗:", error);
    toast.error("圖片上傳失敗，請重試");
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  try {
    // 1. 先獲取商品資料，取得圖片 URL
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("productImages")
      .eq("id", productId)
      .single();

    if (fetchError) {
      console.error("獲取商品資料失敗:", fetchError);
      throw new Error(fetchError.message);
    }

    // 2. 刪除商品記錄（會自動刪除關聯的 variants，如果設定了 cascade）
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("刪除商品失敗:", deleteError);
      throw new Error(deleteError.message);
    }

    // 3. 刪除圖片
    if (product?.productImages && product.productImages.length > 0) {
      // 從 URL 中提取檔案路徑
      const filePaths = product.productImages
        .map((url: string) => {
          // URL 格式: https://xxx.supabase.co/storage/v1/object/public/productImage/products/filename.jpg
          // 需要提取: products/filename.jpg
          const match = url.match(/productImage\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      console.log("準備刪除的圖片路徑:", filePaths);

      // 批量刪除圖片
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("productImage")
          .remove(filePaths);

        if (storageError) {
          console.error("刪除圖片失敗:", storageError);
          // 不拋出錯誤，因為商品已經刪除成功
          toast.warning("商品已刪除，但部分圖片刪除失敗");
        } else {
          console.log("圖片刪除成功");
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("刪除商品過程發生錯誤:", error);
    throw error;
  }
}
