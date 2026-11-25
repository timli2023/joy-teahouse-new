
"use client";

import { useEffect, useMemo, useState } from "react";

type Language = "zh" | "en" | "ar";

type Product = {
  id: string;
  name_zh: string;
  name_en: string;
  name_ar: string;
  category: string;
  subcategory: string;
  price: number;
  size_prices: { small: number; large: number } | null;
  is_drink: boolean;
  sort_order: number;
};

type CartLine = {
  product: Product;
  quantity: number;
  size?: "small" | "large";
  temperature?: "iced" | "hot";
  sweetness?: string;
};

const categories = [
  ["all", "全部", "All", "الكل"],
  ["drinks", "饮料", "Drinks", "المشروبات"],
  ["food", "食品", "Food", "الطعام"],
  ["rice", "米饭类", "Rice", "الأرز"],
  ["snack", "小吃", "Snacks", "الوجبات الخفيفة"],
  ["desserts", "甜品", "Desserts", "الحلويات"]
] as const;

const translations = {
  zh: {
    order: "用餐方式",
    dineIn: "店内用餐",
    takeaway: "打包带走",
    table: "桌号",
    loading: "正在加载菜单…",
    cart: "购物车",
    empty: "尚未选择商品",
    size: "杯型",
    small: "小杯",
    large: "大杯",
    temperature: "温度",
    iced: "冰的",
    hot: "热的",
    sweetness: "甜度",
    quantity: "数量",
    remove: "删除",
    subtotal: "商品小计",
    packaging: "食品打包费",
    total: "合计",
    submit: "确认下单",
    submitting: "提交中…",
    add: "加入购物车",
    addFirst: "请先添加商品",
    success: "下单成功！订单号",
    amount: "总额",
    failed: "下单失败",
    loadFailed: "菜单加载失败",
    jd: "JD"
  },
  en: {
    order: "Dining Option",
    dineIn: "Dine In",
    takeaway: "Takeaway",
    table: "Table",
    loading: "Loading menu…",
    cart: "Shopping Cart",
    empty: "Your cart is empty",
    size: "Size",
    small: "Small",
    large: "Large",
    temperature: "Temperature",
    iced: "Iced",
    hot: "Hot",
    sweetness: "Sweetness",
    quantity: "Quantity",
    remove: "Remove",
    subtotal: "Subtotal",
    packaging: "Packaging Fee",
    total: "Total",
    submit: "Place Order",
    submitting: "Submitting…",
    add: "Add to Cart",
    addFirst: "Please add products first",
    success: "Order successful! Order number",
    amount: "Total",
    failed: "Order failed",
    loadFailed: "Failed to load menu",
    jd: "JD"
  },
  ar: {
    order: "طريقة الطلب",
    dineIn: "تناول داخل المحل",
    takeaway: "سفري",
    table: "رقم الطاولة",
    loading: "جارٍ تحميل القائمة…",
    cart: "سلة التسوق",
    empty: "السلة فارغة",
    size: "الحجم",
    small: "صغير",
    large: "كبير",
    temperature: "درجة الحرارة",
    iced: "بارد",
    hot: "ساخن",
    sweetness: "مستوى السكر",
    quantity: "الكمية",
    remove: "حذف",
    subtotal: "المجموع الفرعي",
    packaging: "رسوم التغليف",
    total: "الإجمالي",
    submit: "تأكيد الطلب",
    submitting: "جارٍ الإرسال…",
    add: "أضف إلى السلة",
    addFirst: "يرجى إضافة المنتجات أولاً",
    success: "تم الطلب بنجاح! رقم الطلب",
    amount: "الإجمالي",
    failed: "فشل الطلب",
    loadFailed: "فشل تحميل القائمة",
    jd: "JD"
  }
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState<Language>("zh");
  const [diningType, setDiningType] =
    useState<"dine_in" | "takeaway">("dine_in");
  const [tableNumber, setTableNumber] = useState("1");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const words = translations[language];
  const rtl = language === "ar";

  useEffect(() => {
    fetch("/api/products")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || d.error) {
          throw new Error(d.error || words.loadFailed);
        }
        setProducts(d.products ?? []);
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          category === "all" ||
          (category === "drinks"
            ? p.is_drink
            : p.category === category)
      ),
    [products, category]
  );

  const subtotal = cart.reduce(
    (s, x) =>
      s +
      (x.product.is_drink
        ? Number(
            x.product.size_prices?.[x.size ?? "small"] ?? 0
          )
        : Number(x.product.price)) *
        x.quantity,
    0
  );

  const packagingFee =
    diningType === "takeaway" &&
    cart.some((x) =>
      ["food", "rice", "snack"].includes(x.product.category)
    )
      ? 0.25
      : 0;

  const total = Number((subtotal + packagingFee).toFixed(2));

  const label = (p: Product) =>
    language === "en"
      ? p.name_en || p.name_zh
      : language === "ar"
        ? p.name_ar || p.name_zh
        : p.name_zh;

  function add(p: Product) {
    const size = p.is_drink ? "small" : undefined;
    const temperature = p.is_drink ? "iced" : undefined;
    const sweetness = p.is_drink ? "100%" : undefined;

    setCart((old) => [
      ...old,
      { product: p, quantity: 1, size, temperature, sweetness }
    ]);
  }

  function update(i: number, patch: Partial<CartLine>) {
    setCart((old) =>
      old.map((x, n) => (n === i ? { ...x, ...patch } : x))
    );
  }

  function remove(i: number) {
    setCart((old) => old.filter((_, n) => n !== i));
  }

  async function submit() {
  if (!cart.length) {
    setMessage(words.addFirst);
    return;
  }

  const cleanPhone = phone.trim();

  if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
    setMessage(
      language === "zh"
        ? "请输入正确的手机号码"
        : language === "en"
        ? "Please enter a valid phone number"
        : "الرجاء إدخال رقم هاتف صحيح"
    );
    return;
  }

  setBusy(true);
  setMessage("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
  diningType,
  tableNumber,
  phone: cleanPhone,
  items: cart.map((x) => ({
            productId: x.product.id,
            quantity: x.quantity,
            size: x.size,
            temperature: x.temperature,
            sweetness: x.sweetness
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || words.failed);
      }

      setMessage(
        `${words.success}: ${data.orderNumber} | ${words.amount}: ${Number(data.total).toFixed(2)} JD`
      );

      setCart([]);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : words.failed
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={rtl ? "wrap rtl" : "wrap"} dir={rtl ? "rtl" : "ltr"}>
      <header className="top">
        <div>
          <h1>JOY TEAHOUSE</h1>
          <p>扫码点餐 · Order Online</p>
        </div>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value as Language)
          }
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </header>

      <section className="orderType">
        <h2>{words.order}</h2>

        <div className="row">
          <button
            className={diningType === "dine_in" ? "chosen" : ""}
            onClick={() => setDiningType("dine_in")}
          >
            {words.dineIn}
          </button>

          <button
            className={diningType === "takeaway" ? "chosen" : ""}
            onClick={() => setDiningType("takeaway")}
          >
            {words.takeaway}
          </button>
        </div>

        {diningType === "dine_in" && (
          <label>
            {words.table}
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
  {language === "zh"
    ? "手机号码（必填）"
    : language === "en"
    ? "Phone Number (Required)"
    : "رقم الهاتف (إجباري)"}
  <input
    type="tel"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    placeholder="0791234567"
    required
    dir="ltr"
  />
</label>
      </section>

      <nav className="cats">
        {categories.map((c) => (
          <button
            key={c[0]}
            className={category === c[0] ? "chosen" : ""}
            onClick={() => setCategory(c[0])}
          >
            {c[language === "zh" ? 1 : language === "en" ? 2 : 3]}
          </button>
        ))}
      </nav>

      {loading ? (
        <p>{words.loading}</p>
      ) : (
        <section className="grid">
          {visible.map((p) => (
            <article className="card" key={p.id}>
              <div className="prodName">{label(p)}</div>
              <div className="muted">{p.subcategory}</div>

              <div className="price">
                {p.is_drink
                  ? `${words.small} ${Number(p.size_prices?.small ?? 0).toFixed(2)} / ${words.large} ${Number(p.size_prices?.large ?? 0).toFixed(2)} JD`
                  : `${Number(p.price).toFixed(2)} JD`}
              </div>

              <button onClick={() => add(p)}>
                {words.add} +
              </button>
            </article>
          ))}
        </section>
      )}

      <section className="cart">
        <h2>{words.cart}</h2>

        {!cart.length && (
          <p className="muted">{words.empty}</p>
        )}

        {cart.map((x, i) => (
          <div
            className="cartLine"
            key={`${x.product.id}-${i}`}
          >
            <div className="lineTitle">
              {label(x.product)}
            </div>

            {x.product.is_drink && (
              <div className="options">
                <label>
                  {words.size}
                  <select
                    value={x.size}
                    onChange={(e) =>
                      update(i, {
                        size: e.target.value as "small" | "large"
                      })
                    }
                  >
                    <option value="small">{words.small}</option>
                    <option value="large">{words.large}</option>
                  </select>
                </label>

                <label>
                  {words.temperature}
                  <select
                    value={x.temperature}
                    onChange={(e) =>
                      update(i, {
                        temperature: e.target.value as "iced" | "hot"
                      })
                    }
                  >
                    <option value="iced">{words.iced}</option>
                    <option value="hot">{words.hot}</option>
                  </select>
                </label>

                <label>
                  {words.sweetness}
                  <select
                    value={x.sweetness}
                    onChange={(e) =>
                      update(i, { sweetness: e.target.value })
                    }
                  >
                    {["10%", "30%", "50%", "70%", "100%"].map(
                      (v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
            )}

            <div className="row">
              <label>
                {words.quantity}
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={x.quantity}
                  onChange={(e) =>
                    update(i, {
                      quantity: Math.max(
                        1,
                        Math.min(50, Number(e.target.value) || 1)
                      )
                    })
                  }
                />
              </label>

              <button
                className="danger"
                onClick={() => remove(i)}
              >
                {words.remove}
              </button>
            </div>
          </div>
        ))}

        <div className="totals">
          <p>
            {words.subtotal}: {subtotal.toFixed(2)} JD
          </p>
          <p>
            {words.packaging}: {packagingFee.toFixed(2)} JD
          </p>
          <h3>
            {words.total}: {total.toFixed(2)} JD
          </h3>
        </div>

        <button
          className="submit"
          disabled={busy || !cart.length}
          onClick={submit}
        >
          {busy ? words.submitting : words.submit}
        </button>

        {message && (
          <p className="message">{message}</p>
        )}
      </section>

      <footer>JOY TEAHOUSE</footer>
    </main>
  );
}
