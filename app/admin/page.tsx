
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  phone: string | null;
  subtotal: number;
  packaging_fee: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "服务器返回了非 JSON 内容：" + text.slice(0, 200)
    );
  }
}

function playTone(context: AudioContext) {
  if (context.state !== "running") return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;

  gain.gain.setValueAtTime(0.35, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime + 0.5
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}


function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!
  );
}

function printOrder(order: Order) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("打印窗口被拦截，请允许浏览器弹出窗口");
    return;
  }
const phoneLine = order.phone
  ? `<p>顾客电话：${escapeHtml(order.phone)}</p>`
  : "";
  const items = order.items
    .map((item) => {
      const options = item.options
        ? Object.entries(item.options)
            .map(
              ([key, value]) =>
                `${escapeHtml(key)}: ${escapeHtml(value)}`
            )
            .join(" · ")
        : "";

      return `
        <div class="item">
          <div>
            <strong>${escapeHtml(item.product_name_zh)}</strong>
            <div class="options">${options}</div>
            <div>数量：${item.quantity}</div>
          </div>
          <strong>${Number(item.line_total).toFixed(2)} JOD</strong>
        </div>
      `;
    })
    .join("");

  const kitchenItems = order.items
    .map((item) => {
      const options = item.options
        ? Object.entries(item.options)
            .map(
              ([key, value]) =>
                `${escapeHtml(key)}: ${escapeHtml(value)}`
            )
            .join(" · ")
        : "";

      return `
        <div class="item">
          <div>
            <strong>${escapeHtml(item.product_name_zh)}</strong>
            <div class="options">${options}</div>
          </div>
          <strong>× ${item.quantity}</strong>
        </div>
      `;
    })
    .join("");

  const dining =
    order.dining_type === "dine_in"
      ? `堂食 · 桌号 ${order.table_number ?? "-"}`
      : "外带";

  const date = new Date(order.created_at).toLocaleString();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Joy Teahouse Receipt</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 3mm;
        }
        body {
          width: 72mm;
          margin: 0 auto;
          color: #000;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }
        .ticket {
          padding: 4mm 0;
          page-break-after: always;
          break-after: page;
        }
        .ticket:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        h2 {
          text-align: center;
          font-size: 19px;
          margin: 4px 0;
        }
        .center {
          text-align: center;
        }
        .line {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px dotted #aaa;
        }
        .options {
          font-size: 11px;
          margin: 4px 0;
          white-space: normal;
        }
        .total {
          display: flex;
          justify-content: space-between;
          margin: 7px 0;
        }
        .big {
          font-size: 16px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>

      <section class="ticket">
        <h2>JOY TEAHOUSE</h2>
        <h2>厨房制作单</h2>
        <div class="line"></div>
        <p>订单：${escapeHtml(order.order_number)}</p>
        <p>${escapeHtml(dining)}</p>
        <p>时间：${escapeHtml(date)}</p>
        ${phoneLine}
        <div class="line"></div>
        ${kitchenItems}
        <div class="line"></div>
        <p class="center">厨房制作单 · KITCHEN</p>
      </section>

      <section class="ticket">
        <h2>JOY TEAHOUSE</h2>
        <p class="center">顾客收据 · CUSTOMER RECEIPT</p>
        <div class="line"></div>
        <p>订单：${escapeHtml(order.order_number)}</p>
        <p>${escapeHtml(dining)}</p>
        <p>时间：${escapeHtml(date)}</p>
        ${phoneLine}
        <div class="line"></div>
        ${items}
        <div class="line"></div>
        <div class="total">
          <span>商品金额</span>
          <span>${Number(order.subtotal).toFixed(2)} JOD</span>
        </div>
        <div class="total">
          <span>包装费</span>
          <span>${Number(order.packaging_fee).toFixed(2)} JOD</span>
        </div>
        <div class="total big">
          <span>总金额</span>
          <span>${Number(order.total).toFixed(2)} JOD</span>
        </div>
        <div class="line"></div>
        <p class="center">THANK YOU!</p>
        <p class="center">Thank you for choosing Joy Teahouse</p>
      </section>

    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}


function getAmmanDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Amman",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alertOrders, setAlertOrders] = useState<Order[]>([]);

  const audioRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  
  const todayKey = getAmmanDateKey(new Date().toISOString());

  const groupedOrders = orders.reduce<
    { date: string; orders: Order[] }[]
  >((groups, order) => {
    const date = getAmmanDateKey(order.created_at);

    let group = groups.find((item) => item.date === date);

    if (!group) {
      group = { date, orders: [] };
      groups.push(group);
    }

    group.orders.push(order);
    return groups;
  }, []);


  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await readJson<{ orders?: Order[]; error?: string }>(res);

      if (res.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "读取订单失败");
      }

      const latestOrders = data.orders ?? [];

      // 第一次读取只建立基准，不提醒已有旧订单
      if (knownOrderIdsRef.current === null) {
        knownOrderIdsRef.current = new Set(
          latestOrders.map((order) => order.id)
        );
      } else {
        const knownIds = knownOrderIdsRef.current;

        const newOrders = latestOrders.filter(
          (order) => !knownIds.has(order.id)
        );

        latestOrders.forEach((order) => knownIds.add(order.id));

        // 发现新订单：声音 + 屏幕弹窗
        if (newOrders.length > 0) {
          setAlertOrders((previous) =>
            [...previous, ...newOrders].slice(-10)
          );

          if (soundEnabledRef.current && audioRef.current) {
            playTone(audioRef.current);
          }
        }
      }

      setOrders(latestOrders);
      setError("");
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

        const data = await readJson<{
          authenticated?: boolean;
          error?: string;
        }>(res);

        if (!res.ok) {
          throw new Error(data.error || "检查登录状态失败");
        }

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

  // 每 5 秒检查一次新订单
  useEffect(() => {
    if (!authenticated) return;

    const timer = setInterval(loadOrders, 5000);

    return () => clearInterval(timer);
  }, [authenticated, loadOrders]);

  async function toggleSound() {
    if (soundEnabled) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }

      await audioRef.current.resume();

      soundEnabledRef.current = true;
      setSoundEnabled(true);

      // 开启时播放测试音
      playTone(audioRef.current);
    } catch {
      setError("无法开启声音，请检查浏览器声音设置");
    }
  }

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

      const data = await readJson<{ error?: string }>(res);

      if (!res.ok) {
        throw new Error(data.error || "PIN 不正确");
      }

      setPin("");
      knownOrderIdsRef.current = null;
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

      const data = await readJson<{
        success?: boolean;
        error?: string;
      }>(res);

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

  useEffect(() => {
    return () => {
      audioRef.current?.close();
    };
  }, []);

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
      {/* 新订单弹窗 */}
      {alertOrders.length > 0 && (
        <div style={styles.overlay}>
          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>🔔</div>
            <h2>收到新订单！</h2>
            <p>请及时查看并准备制作。</p>

            {alertOrders.map((order) => (
              <div key={order.id} style={styles.alertOrder}>
                <strong>{order.order_number}</strong>
                <span>
                  {order.dining_type === "dine_in"
                    ? `堂食 · 桌号 ${order.table_number ?? "-"}`
                    : "外带"}
                </span>
              </div>
            ))}

            <button
              style={styles.alertButton}
              onClick={() => {
                setAlertOrders([]);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              我知道了，查看订单
            </button>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Joy Teahouse 订单管理</h1>
          <p style={styles.subtitle}>每 5 秒自动检查新订单</p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={{
              ...styles.soundButton,
              background: soundEnabled ? "#16803c" : "#777",
            }}
            onClick={toggleSound}
          >
            {soundEnabled ? "🔊 声音已开启" : "🔇 开启声音"}
          </button>

          <button style={styles.refreshButton} onClick={loadOrders}>
            刷新订单
          </button>
        </div>
      </header>

      {error && <p style={styles.error}>{error}</p>}

     {orders.length === 0 ? (
  <p style={styles.empty}>目前没有订单</p>
) : (
  <section style={styles.list}>
    {groupedOrders.map((group) => (
      <div key={group.date}>
        <h2
          style={{
            margin: "20px 0 12px",
            padding: "12px 16px",
            background: group.date === todayKey ? "#e8f5e9" : "#eeeeee",
            borderRadius: 8,
            fontSize: 18,
          }}
        >
          {group.date === todayKey ? "📅 今天" : "📅"} {group.date}
          <span style={{ fontSize: 14, color: "#666", marginLeft: 10 }}>
            {group.orders.length} 笔订单
          </span>
        </h2>

        <div style={styles.list}>
          {group.orders.map((order) => (
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
<p>
  📱 顾客电话：{order.phone || "未填写"}
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
                <button
                  style={styles.printButton}
                  onClick={() => printOrder(order)}
                >
                  🖨️ 打印两张小票
                </button>

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
        </div>
      </div>
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
    flexWrap: "wrap",
    gap: 12,
  },
  headerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
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
  soundButton: {
    padding: "10px 16px",
    border: 0,
    borderRadius: 8,
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
  printButton: {
  padding: "10px 14px",
  border: "none",
  borderRadius: 8,
  background: "#333333",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
},
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertBox: {
    background: "white",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
  },
  alertIcon: {
    fontSize: 48,
  },
  alertOrder: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    marginTop: 8,
    background: "#fff3cd",
    borderRadius: 8,
  },
  alertButton: {
    width: "100%",
    padding: 14,
    marginTop: 20,
    border: 0,
    borderRadius: 8,
    background: "#16803c",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },
};
