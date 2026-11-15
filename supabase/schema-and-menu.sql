-- JOY TEAHOUSE fresh schema
-- WARNING: This script creates/updates the JOY TEAHOUSE ordering tables.
-- It does NOT delete existing products or orders.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null default '',
  name_ar text not null default '',
  category text not null check (category in ('drinks','rice','snack','food','desserts')),
  subcategory text not null default '',
  price numeric(10,2) not null default 0,
  size_prices jsonb,
  is_drink boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- For an existing products table, add the new columns if they are missing.
alter table public.products add column if not exists name_zh text;
alter table public.products add column if not exists name_en text not null default '';
alter table public.products add column if not exists name_ar text not null default '';
alter table public.products add column if not exists subcategory text not null default '';
alter table public.products add column if not exists size_prices jsonb;
alter table public.products add column if not exists is_drink boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists is_active boolean not null default true;

-- Remove the previous category check safely, then install the intended categories.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid = 'public.products'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%category%'
  loop
    execute format('alter table public.products drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.products add constraint products_category_check
  check (category in ('drinks','rice','snack','food','desserts'));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  dining_type text not null check (dining_type in ('dine_in','takeaway')),
  table_number integer,
  subtotal numeric(10,2) not null,
  packaging_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint table_number_rule check (
    (dining_type = 'takeaway' and table_number is null) or
    (dining_type = 'dine_in' and table_number between 1 and 10)
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_zh text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- Seed menu rows only when no product with the same Chinese name exists.
insert into public.products
(name_zh,name_en,name_ar,category,subcategory,price,size_prices,is_drink,sort_order,is_active)
select v.name_zh,v.name_en,v.name_ar,v.category,v.subcategory,v.price,v.size_prices,v.is_drink,v.sort_order,v.is_active
from (values
('抹茶奶茶', 'Matcha Milk Tea', 'شاي الحليب ماتشا', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 1, TRUE),
('香芋奶茶', 'Taro Milk Tea', 'شاي الحليب بالقلقاس', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 2, TRUE),
('港式奶茶', 'Hong Kong Milk Tea', 'شاي الحليب على الطريقة香港', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 3, TRUE),
('经典红茶', 'Classic Black Tea', 'الشاي الأسود الكلاسيكي', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 4, TRUE),
('鸳鸯奶茶', 'Yuenyeung Milk Tea', 'شاي يوانيانغ', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 5, TRUE),
('紫薯奶茶', 'Purple Sweet Potato Milk Tea', 'شاي الحليب بالبطاطا الحلوة البنفسجية', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 6, TRUE),
('绿茶奶茶', 'Green Tea Milk Tea', 'شاي الحليب الأخضر', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 7, TRUE),
('茉莉花奶茶', 'Jasmine Milk Tea', 'شاي الحليب بالياسمين', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 8, TRUE),
('焦糖奶茶', 'Caramel Milk Tea', 'شاي الحليب بالكراميل', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 9, TRUE),
('乌龙奶茶', 'Oolong Milk Tea', 'شاي الحليب أولونغ', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 10, TRUE),
('经典奶茶', 'Classic Milk Tea', 'شاي الحليب الكلاسيكي', 'drinks', '奶茶 Milk Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 11, TRUE),
('苹果果茶', 'Apple Fruit Tea', 'شاي الفواكه بالتفاح', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 12, TRUE),
('芒果果茶', 'Mango Fruit Tea', 'شاي الفواكه بالمانجو', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 13, TRUE),
('草莓果茶', 'Strawberry Fruit Tea', 'شاي الفواكه بالفراولة', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 14, TRUE),
('桃子果茶', 'Peach Fruit Tea', 'شاي الفواكه بالخوخ', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 15, TRUE),
('黑糖果茶', 'Brown Sugar Fruit Tea', 'شاي الفواكه بالسكر البني', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 16, TRUE),
('奇异果果茶', 'Kiwi Fruit Tea', 'شاي الفواكه بالكيوي', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 17, TRUE),
('荔枝果茶', 'Lychee Fruit Tea', 'شاي الفواكه بالليتشي', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 18, TRUE),
('百香果果茶', 'Passion Fruit Tea', 'شاي الفواكه بفاكهة العاطفة', 'drinks', '果茶 Fruit Tea', 0.00, '{"small": 3.10, "large": 3.60}'::jsonb, TRUE, 19, TRUE),
('奇异果柠檬', 'Kiwi Lemon Tea', 'شاي الليمون بالكيوي', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 20, TRUE),
('乌龙茶', 'Oolong Tea', 'شاي أولونغ', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 21, TRUE),
('柠檬薄荷茶', 'Lemon Mint Tea', 'شاي الليمون والنعناع', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 22, TRUE),
('红茶柠檬', 'Black Tea Lemon', 'شاي أسود بالليمون', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 23, TRUE),
('绿茶柠檬', 'Green Tea Lemon', 'شاي أخضر بالليمون', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 24, TRUE),
('柠檬水', 'Lemonade', 'ليمونادة', 'drinks', '柠檬茶 Lemon Tea', 0.00, '{"small": 2.00, "large": 2.50}'::jsonb, TRUE, 25, TRUE),
('饺子', 'Dumplings', 'زلابية', 'snack', '食品 Food', 3.00, NULL, FALSE, 26, TRUE),
('鸡肉饺', 'Chicken Dumplings', 'زلابية بالدجاج', 'snack', '食品 Food', 3.50, NULL, FALSE, 27, TRUE),
('虾饺', 'Shrimp Dumplings', 'زلابية بالروبيان', 'snack', '食品 Food', 3.50, NULL, FALSE, 28, TRUE),
('米饭', 'Steamed Rice', 'أرز', 'rice', '食品 Food', 3.00, NULL, FALSE, 29, TRUE),
('炒面条', 'Fried Noodles', 'نودلز مقلية', 'food', '食品 Food', 3.00, NULL, FALSE, 30, TRUE),
('寿司', 'Sushi', 'سوشي', 'snack', '食品 Food', 3.00, NULL, FALSE, 31, TRUE),
('米粉', 'Rice Noodles', 'شعيرية الأرز', 'food', '食品 Food', 3.50, NULL, FALSE, 32, TRUE),
('牛肉饺', 'Beef Dumplings', 'زلابية باللحم البقري', 'snack', '食品 Food', 3.50, NULL, FALSE, 33, TRUE),
('虾炒饭', 'Shrimp Fried Rice', 'أرز مقلي بالروبيان', 'rice', '食品 Food', 3.50, NULL, FALSE, 34, TRUE),
('虾炒面条', 'Shrimp Fried Noodles', 'نودلز مقلية بالروبيان', 'food', '食品 Food', 3.50, NULL, FALSE, 35, TRUE),
('牛肉炒饭', 'Beef Fried Rice', 'أرز مقلي باللحم البقري', 'rice', '食品 Food', 3.50, NULL, FALSE, 36, TRUE),
('牛肉炒面条', 'Beef Fried Noodles', 'نودلز مقلية باللحم البقري', 'food', '食品 Food', 3.50, NULL, FALSE, 37, TRUE),
('心太软蛋糕', 'Molten Chocolate Cake', 'كعكة الشوكولاتة السائلة', 'desserts', '甜品 Desserts', 3.00, NULL, FALSE, 38, TRUE),
('港式鸡蛋仔', 'Hong Kong Egg Waffles', 'وافل البيض على الطريقة香港', 'desserts', '甜品 Desserts', 3.00, NULL, FALSE, 39, TRUE)
) as v(name_zh,name_en,name_ar,category,subcategory,price,size_prices,is_drink,sort_order,is_active)
where not exists (select 1 from public.products p where p.name_zh = v.name_zh);

-- Service role key is used only on the server. Do not expose it in browser code.
