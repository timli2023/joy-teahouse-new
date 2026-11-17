
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";

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

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (res.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "读取订单失败");
      }

      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取订单失败");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        if (data.authenticated) {
          setAuthenticated(true);
          await loadOrders();
        }
      } catch {
        if (active) {
          setError("无法检查登录状态，请刷新页面");
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [loadOrders]);

  useEffect(() => {
    if (!authenticated) return;

    const timer = setInterval(loadOrders, 10000);
    return () => clearInterval(timer);
  }, [authenticated, loadOrders]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const text = await res.text();
const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.error || "PIN 不正确");
      }

      setPin("");
      setAuthenticated(true);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const text = await res.text();
      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "服务器返回了非 JSON 内容：" + text.slice(0, 200)
          );
        }
      }

      if (res.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        setError("登录已过期，请重新输入 PIN");
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.error || `更新订单失败，HTTP ${res.status}`
        );
      }

      if (!data.success) {
        throw new Error(data.error || "服务器没有确认订单更新");
      }

      setError("");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新订单失败");
    }
  }

  if (checking) {
    return <main style={styles.center}>正在检查登录状态...</main>;
  }

  if (!authenticated) {
    return (
      <main style={styles.center}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <h1 style={styles.heading}>Joy Teahouse</h1>
          <p style={styles.subtitle}>管理员登录</p>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="请输入管理员 PIN"
            style={styles.input}
            required
          />

          <button type="submit" disabled={loading} style={styles.loginButton}>
            {loading ? "正在登录..." : "登录"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Joy Teahouse 订单管理</h1>
          <p style={styles.subtitle}>每 10 秒自动刷新订单</p>
        </div>

        <button style={styles.refreshButton} onClick={loadOrders}>
          刷新订单
        </button>
      </header>

      {error && <p style={styles.error}>{error}</p>}

      {orders.length === 0 ? (
        <p style={styles.empty}>目前没有订单</p>
      ) : (
        <section style={styles.list}>
          {orders.map((order) => (
            <article key={order.id} style={styles.card}>
              <div style={styles.orderHeader}>
                <strong>{order.order_number}</strong>
                <span style={styles.status}>
                  {order.status === "new"
                    ? "新订单"
                    : order.status === "preparing"
                    ? "制作中"
                    : "已完成"}
                </span>
              </div>

              <p>
                {order.dining_type === "dine_in"
                  ? `堂食 · 桌号 ${order.table_number ?? "-"}`
                  : "外带"}
              </p>

              <p style={styles.time}>
                {new Date(order.created_at).toLocaleString()}
              </p>

              <div style={styles.items}>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.item}>
                    <div>
                      <strong>{item.product_name_zh}</strong>
                      <p style={styles.options}>
                        {item.options
                          ? Object.entries(item.options)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" · ")
                          : ""}
                      </p>
                      <span>数量：{item.quantity}</span>
                    </div>
                    <strong>
                      {Number(item.line_total).toFixed(2)} JOD
                    </strong>
                  </div>
                ))}
              </div>

              <div style={styles.total}>
                <span>商品金额</span>
                <span>{Number(order.subtotal).toFixed(2)} JOD</span>
              </div>

              <div style={styles.total}>
                <span>包装费</span>
                <span>{Number(order.packaging_fee).toFixed(2)} JOD</span>
              </div>

              <div style={styles.total}>
                <strong>订单总额</strong>
                <strong>{Number(order.total).toFixed(2)} JOD</strong>
              </div>

              <div style={styles.actions}>
                {order.status !== "preparing" && (
                  <button
                    style={styles.actionButton}
                    onClick={() => updateStatus(order.id, "preparing")}
                  >
                    开始制作
                  </button>
                )}

                {order.status !== "completed" && (
                  <button
                    style={styles.completeButton}
                    onClick={() => updateStatus(order.id, "completed")}
                  >
                    完成订单
                  </button>
                )}

                {order.status !== "new" && (
                  <button
                    style={styles.restoreButton}
                    onClick={() => updateStatus(order.id, "new")}
                  >
                    恢复新订单
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#f5f5f5",
  },
  loginCard: {
    width: "100%",
    maxWidth: 360,
    padding: 30,
    borderRadius: 16,
    background: "white",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#f5f5f5",
    color: "#222",
  },
  header: {
    maxWidth: 800,
    margin: "0 auto 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heading: {
    fontSize: 24,
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#777",
    margin: 0,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    margin: "20px 0 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 18,
  },
  loginButton: {
    width: "100%",
    padding: 14,
    border: 0,
    borderRadius: 8,
    background: "#222",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },
  refreshButton: {
    padding: "10px 16px",
    border: 0,
    borderRadius: 8,
    background: "#222",
    color: "white",
    cursor: "pointer",
  },
  error: {
    color: "#c62828",
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#777",
  },
  list: {
    maxWidth: 800,
    margin: "0 auto",
    display: "grid",
    gap: 16,
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 18,
  },
  status: {
    color: "#8a5b00",
    background: "#fff3cd",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 13,
  },
  time: {
    color: "#888",
    fontSize: 13,
  },
  items: {
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    margin: "14px 0",
    padding: "10px 0",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
  },
  options: {
    color: "#777",
    fontSize: 12,
    margin: "4px 0",
  },
  total: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 8,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  completeButton: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 8,
    background: "#16803c",
    color: "white",
    cursor: "pointer",
  },
  restoreButton: {
    padding: "10px 14px",
    border: 0,
    borderRadius: 8,
    background: "#777",
    color: "white",
    cursor: "pointer",
  },
};
