# Rewind_site

This is a static frontend that uses Supabase for auth and data storage. Deploy with Vercel and configure environment variables for Supabase.

Steps to deploy to Vercel + Supabase:

1. Create a Supabase project and run the SQL in `rewind-site/supabase-setup.sql` to create the required tables.

2. In the project settings, get the Project URL and anon/public key. Set these in Vercel as environment variables `SUPABASE_URL` and `SUPABASE_KEY`.

3. In Supabase dashboard → Authentication → Settings:
   - `Site URL`: `http://localhost:3000` (for local testing) and your Vercel URL
   - `Redirect URLs`: add `http://localhost:3000` and your Vercel deployment URL
   - `Allowed redirect URLs`: add the same URLs

4. In Vercel, set the Root Directory to `rewind-site`.
   - Build command: `npm run build`
   - Output directory: leave empty (Vercel will serve files from the selected root)

4. Vercel will run `npm run build` inside `rewind-site`, which generates `env.js` with your Supabase credentials and then serve the static files.

Security note:
- Role changes and enforcement are currently partially handled in client-side JS. For production, add Row Level Security (RLS) policies in Supabase to enforce role-based access server-side. I can add recommended RLS policies if you want.
