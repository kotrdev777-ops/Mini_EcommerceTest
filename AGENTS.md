# AI editing guide for Mini E-commerce

- This is a single-store Next.js App Router app. Keep it as one web service plus PostgreSQL and object storage.
- Prices and totals are integer satang. Never trust browser cart prices; calculate from PostgreSQL in a transaction.
- Preserve order status transitions and stock reservation/restoration logic in `src/app/actions.ts`.
- Product images are public through the media route; payment slips must remain admin-only.
- Keep `SESSION_SECRET`, database credentials, and bucket credentials in environment variables. Never put them in source or client components. The starter password is used only before the first Admin is created. When `SESSION_SECRET` is absent, keep the generated session key in PostgreSQL.
- For schema changes, add a Prisma migration and run `npm run build` before reporting completion.
- Make small changes, summarize touched files, and explain any changed customer setup steps.
