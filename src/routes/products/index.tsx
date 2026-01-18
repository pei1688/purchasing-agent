import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";

import { toast } from "sonner";
import { deleteProduct, getProducts } from "../../services/apiProducts";

export const Route = createFileRoute("/products/")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    isLoading,
    data: products,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
  // 搜尋與過濾
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const queryClient = useQueryClient();
  // 排序控制
  const [sortKey, setSortKey] = useState<"id" | "qty" | "created_at">(
    "created_at",
  );
  const [sortAsc, setSortAsc] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 刪除 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // 刷新商品列表
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("商品刪除成功！");
      // 關閉對話框
      const modal = document.getElementById(
        "delete_modal",
      ) as HTMLDialogElement;
      modal?.close();
    },
    onError: (error: Error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });
  // 資料篩選與排序邏輯
  const filteredProducts = useMemo(() => {
    // 先檢查 products 是否存在
    if (!products || products.length === 0) {
      return [];
    }

    let list = [...products];

    // 搜尋商品名稱
    if (searchTerm.trim()) {
      list = list.filter((p) =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // 篩選分類
    if (filterCategory !== "全部") {
      list = list.filter((p) => p.productTags === filterCategory);
    }

    // 排序
    list.sort((a, b) => {
      let aVal, bVal;

      if (sortKey === "created_at") {
        // 將日期字串轉換為時間戳記進行比較
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, searchTerm, filterCategory, sortKey, sortAsc]);

  // 處理排序點擊
  const handleSort = (key: "id" | "qty" | "created_at") => {
    if (sortKey === key) {
      // 同一欄位：切換升降序
      setSortAsc(!sortAsc);
    } else {
      // 不同欄位：切換欄位，並直接觸發排序（不改變升降序方向）
      setSortKey(key);
    }
  };

  // 處理刪除按鈕點擊
  const handleDeleteClick = (id: string, name: string) => {
    setProductToDelete({ id, name });
    const modal = document.getElementById("delete_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  // 確認刪除
  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-warning">商品獲取失敗</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col space-y-6 px-4 py-8">
      <legend className="text-3xl font-bold">商品列表</legend>

      {/*filter 區塊 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 搜尋框 */}
        <input
          type="text"
          placeholder="搜尋商品名稱..."
          className="input input-bordered w-full sm:max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 分類篩選 - 根據 product_tags */}
        <select
          className="select select-bordered w-full sm:max-w-xs"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="全部">全部標籤</option>
          {/* 動態生成標籤選項 */}
          {products &&
            Array.from(
              new Set(products.map((p) => p.productTags).filter(Boolean)),
            ).map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
        </select>
      </div>

      {/* 📋 商品表格 */}
      <div className="rounded-box border-base-content/5 bg-base-100 overflow-x-auto border">
        <table className="table-zebra table">
          <thead>
            <tr>
              <th
                className="hover:bg-base-200 cursor-pointer select-none"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  商品編號
                  <span
                    className={
                      sortKey === "id" ? "text-accent" : "text-base-content/30"
                    }
                  >
                    {sortKey === "id" ? (sortAsc ? "▲" : "▼") : "▲"}
                  </span>
                </div>
              </th>
              <th>商品名稱</th>
              <th>商品圖片</th>
              <th>商品款式</th>
              <th
                className="hover:bg-base-200 cursor-pointer select-none"
                onClick={() => handleSort("qty")}
              >
                <div className="flex items-center gap-1">
                  商品數量
                  <span
                    className={
                      sortKey === "qty" ? "text-accent" : "text-base-content/30"
                    }
                  >
                    {sortKey === "qty" ? (sortAsc ? "▲" : "▼") : "▲"}
                  </span>
                </div>
              </th>
              <th
                className="hover:bg-base-200 cursor-pointer select-none"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  建立時間
                  <span
                    className={
                      sortKey === "created_at"
                        ? "text-accent"
                        : "text-base-content/30"
                    }
                  >
                    {sortKey === "created_at" ? (sortAsc ? "▲" : "▼") : "▲"}
                  </span>
                </div>
              </th>
              <th>選項</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover">
                <td>{p.inventoryNumber}</td>
                <td>{p.productName}</td>
                <td>
                  {p.productImages && p.productImages.length > 0 ? (
                    <img
                      src={p.productImages[0]}
                      alt={p.productName}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-base-200 flex h-12 w-12 items-center justify-center rounded text-xs">
                      無圖片
                    </div>
                  )}
                </td>
                <td>
                  <span className="badge badge-md badge-soft">
                    {p.productTags || "未分類"}
                  </span>
                </td>
                <td>{p.inventoryQuantity}</td>
                <td>{new Date(p.created_at).toLocaleDateString("zh-TW")}</td>
                <td className="flex items-center gap-4">
                  <Link to={`/products/${p.id}`}>
                    <svg
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      strokeWidth="1"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      color="currentColor"
                      className="text-accent hover:bg-base-200 cursor-pointer rounded-lg"
                    >
                      <path
                        d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </Link>

                  <div onClick={() => handleDeleteClick(p.id, p.productName)}>
                    <svg
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      strokeWidth="1"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      color="currentColor"
                      className="text-warning hover:bg-base-200 cursor-pointer rounded-lg"
                    >
                      <path
                        d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                      <path
                        d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-base-content/60 py-8 text-center"
                >
                  沒有符合條件的商品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 顯示結果統計 */}
      <div className="text-base-content/60 text-right text-sm">
        顯示 {filteredProducts.length} / {products?.length || 0} 筆商品
      </div>

      <dialog id="delete_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
              ✕
            </button>
          </form>
          <h3 className="text-warning text-lg font-bold">警告</h3>
          <p className="py-4">確定要刪除商品「{productToDelete?.name}」嗎？</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">取消</button>
            </form>
            <button
              onClick={handleConfirmDelete}
              className="btn btn-error btn-sm"
            >
              確定刪除
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
