
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name_zh: string;
  name_en: string;
  name_ar: string;
  category: string;
  price: number;
  is_active: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  async function loadProducts() {
    try {
      const res = await fetch("/api/admin/products", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "读取产品失败");
        return;
      }

      setProducts(data.products || []);
    } catch {
      alert("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function changeStatus(product: Product) {
    const nextStatus = !product.is_active;

    const confirmed = window.confirm(
      nextStatus
        ? `确定重新上架「${product.name_zh}」吗？`
        : `确定下架「${product.name_zh}」吗？`
    );

    if (!confirmed) return;

    setBusyId(product.id);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          isActive: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "更新失败");
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_active: nextStatus }
            : item
        )
      );
    } catch {
      alert("无法连接服务器");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return <main style={{ padding: 24 }}>正在读取产品...</main>;
  }

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Joy Teahouse 产品管理</h1>

      <p>产品总数：{products.length}</p>

      <button
        onClick={loadProducts}
        style={{ padding: "10px 18px", marginBottom: 20 }}
      >
        刷新产品
      </button>

      {products.length === 0 ? (
        <p>目前没有产品</p>
      ) : (
        products.map((product) => (
          <section
            key={product.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 15,
              marginBottom: 12,
            }}
          >
            <strong>{product.name_zh}</strong>
            <p>{product.name_en}</p>
            <p>{product.name_ar}</p>
            <p>分类：{product.category}</p>
            <p>价格：{Number(product.price).toFixed(2)}</p>

            <p>
              状态：
              {product.is_active ? "🟢 已上架" : "⚪ 已下架"}
            </p>

            <button
              disabled={busyId === product.id}
              onClick={() => changeStatus(product)}
              style={{
                padding: "9px 18px",
                border: "none",
                borderRadius: 6,
                background: product.is_active ? "#dc3545" : "#198754",
                color: "white",
                cursor: "pointer",
              }}
            >
              {busyId === product.id
                ? "处理中..."
                : product.is_active
                ? "下架产品"
                : "重新上架"}
            </button>
          </section>
        ))
      )}
    </main>
  );
}
