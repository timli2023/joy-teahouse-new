# JOY TEAHOUSE QR Ordering (new starter)

This is a fresh Next.js 15 project based on the requirements discussed in ChatGPT.

## Included
- Chinese / English / Arabic language selector (Arabic layout direction)
- 39 menu products seeded by `supabase/schema-and-menu.sql`
- Drink options: small/large, iced/hot, 10/30/50/70/100% sweetness
- Dine in with table 1–10, or takeaway
- 0.25 JD packaging fee once per takeaway order if it contains food/rice/snacks
- Server-side price calculation and order creation

## Important before deployment
This is a fresh replacement starter, not a patch of your old repository. It does not include your old admin screen, product photos, QR codes, or any existing custom features. Review and test it before using it for real orders.

## Setup
1. Create/choose a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema-and-menu.sql`.
   - If your existing `products` table has different mandatory columns or incompatible foreign keys, stop and ask for a schema review before running it.
   - The script preserves existing products and orders; it adds menu items only if their Chinese name is not already present.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` to the project URL.
5. Set `SUPABASE_SERVICE_ROLE_KEY` to the Supabase service role secret. Keep it server-only; never put it in a `NEXT_PUBLIC_` variable or share it.
6. Run `npm install`, then `npm run dev`.
7. Deploy to Vercel with the same two environment variables.

## Notes
- The 0.25 JD fee is calculated on the server, once per takeaway order containing category `food`, `rice`, or `snack`.
- All drinks require size, temperature and sweetness in the order API.
- Product categories: drinks, rice, snack, food, desserts. Drink subcategories are displayed as Milk Tea, Fruit Tea and Lemon Tea.
- The SQL uses the user's supplied menu names and prices. Some translations are draft translations and should be reviewed by a fluent Arabic speaker.
