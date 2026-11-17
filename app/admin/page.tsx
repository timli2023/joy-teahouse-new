
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

      if (res.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        return;
      }

      const data = await res.json();

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
        if (active) setError("无法检查登录状态，请刷新页面");
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

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

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
        throw new Error("服务器返回了非 JSON 内容：" + text.slice(0, 200));
      }
    }

    if (res.status === 401) {
      setAuthenticated(false);
      setOrders([]);
      setError("登录已过期，请重新输入 PIN");
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || `更新订单失败，HTTP ${res.status}`);
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
