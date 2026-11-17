
"use client";

import { useCallback, useEffect, useState } from "react";

type OrderItem = {
  id: string;
  product_name_zh: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  options: Record<string, string> | null;
};

type Order = {
  id: string;
  order_number: string;
  dining_type: string;
  table_number: number | null;
  subtotal: number;
  packaging_fee: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  new: "新订单",
  preparing: "制作中",
  completed: "已完成",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "读取订单失败");
      setOrders(data.orders || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取订单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 10000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  async function updateStatus(id: string, status: string) {
    try {
      setUpdating(id);
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新失败");
      await loadOrders();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失败");
    } finally {
      setUpdating("");
    }
  }

  const newCount = orders.filter(o => o.status === "new").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const completedCount = orders.filter(o => o.status === "completed").length;

  return (
    <main style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      color: "#222",
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <h1 style={{ marginBottom: 5 }}>Joy Teahouse</h1>
          <p style={{ color: "#777", marginTop: 0 }}>订单管理后台</p>
        </div>
        <button onClick={loadOrders} style={buttonStyle}>
          刷新订单
        </button>
      </header>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        margin: "20px 0",
      }}>
        <Count title="新订单" count={newCount} />
        <Count title="制作中" count={preparingCount} />
        <Count title="已完成" count={completedCount} />
      </section>

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {loading && <p>正在加载订单...</p>}

      {!loading && orders.length === 0 && (
        <p>目前还没有订单。</p>
      )}

      {orders.map(order => (
        <article key={order.id} style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          background: "#fff",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}>
            <strong style={{ fontSize: 20 }}>
              {order.order_number}
            </strong>
            <strong>{statusLabels[order.status] || order.status}</strong>
          </div>

          <p style={{ color: "#666" }}>
            {order.dining_type === "dine_in"
              ? `堂食 · ${order.table_number}号桌`
              : "外带"}
            {" · "}
            {new Date(order.created_at).toLocaleString()}
          </p>

          <hr />

          {order.items.map(item => (
            <div key={item.id} style={{ margin: "12px 0" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}>
                <strong>
                  {item.product_name_zh} × {item.quantity}
                </strong>
                <strong>{Number(item.line_total).toFixed(2)} JD</strong>
              </div>

              {item.options && (
                <p style={{ color: "#777", fontSize: 13, margin: "5px 0" }}>
                  {item.options.size === "small" ? "小杯" :
                    item.options.size === "large" ? "大杯" : ""}
                  {item.options.temperature === "iced" ? " · 冰饮" :
                    item.options.temperature === "hot" ? " · 热饮" : ""}
                  {item.options.sweetness
                    ? ` · ${item.options.sweetness}甜度` : ""}
                </p>
              )}
            </div>
          ))}

          <hr />

          <p>商品小计：{Number(order.subtotal).toFixed(2)} JD</p>
          <p>包装费：{Number(order.packaging_fee).toFixed(2)} JD</p>
          <h2 style={{ textAlign: "right" }}>
            总计：{Number(order.total).toFixed(2)} JD
          </h2>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}>
            {order.status === "new" && (
              <button
                disabled={updating === order.id}
                onClick={() => updateStatus(order.id, "preparing")}
                style={buttonStyle}
              >
                确认接单 · 开始制作
              </button>
            )}

            {order.status === "preparing" && (
              <button
                disabled={updating === order.id}
                onClick={() => updateStatus(order.id, "completed")}
                style={buttonStyle}
              >
                完成订单
              </button>
            )}

            {order.status !== "completed" && (
              <button
                disabled={updating === order.id}
                onClick={() => updateStatus(order.id, "new")}
                style={{ ...buttonStyle, background: "#777" }}
              >
                恢复新订单
              </button>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}

function Count({ title, count }: { title: string; count: number }) {
  return (
    <div style={{
      background: "#f4f4f4",
      borderRadius: 10,
      padding: 14,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 25, fontWeight: "bold" }}>{count}</div>
      <div style={{ color: "#666" }}>{title}</div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "#287b52",
  color: "white",
  border: 0,
  borderRadius: 8,
  padding: "12px 16px",
  cursor: "pointer",
};
