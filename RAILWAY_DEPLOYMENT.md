# Deploy FUNDORA BLOX to Railway

## Step 1: Set Up Neon Database

1. Go to https://neon.tech and create a new database
2. Copy your connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)

## Step 2: Configure Railway Environment Variables

In your Railway project settings, add these environment variables:

```
DATABASE_URL=your_neon_connection_string_here
SESSION_SECRET=generate_a_random_32_character_string
NODE_ENV=production
PORT=5000
```

**Important:** Make sure `DATABASE_URL` is your full Neon Postgres connection string.

## Step 3: Push Database Schema

Before deploying, push the database schema to your Neon database:

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push
```

If you get a data loss warning, use:
```bash
npm run db:push -- --force
```

## Step 4: Verify Your Railway Configuration

Make sure your `railway.toml` or Railway settings have:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Watch Paths:** (optional)
```
/**
```

## Step 5: Deploy

1. Push to GitHub
2. Railway will automatically detect changes and deploy
3. Wait for build to complete

## Step 6: Verify Deployment

Once deployed, check:

1. **Database Connection:** Check Railway logs for "serving on port 5000" without database errors
2. **Static Assets:** Make sure all files in `client/public/` are included in your repo
3. **Sounds:** Verify `/sounds/` folder exists with hit.wav, success.wav, bg-music.wav
4. **Environment:** Check that all environment variables are set in Railway dashboard

## Common Issues & Fixes

### Issue 1: "Cannot connect to database"
**Fix:** Check that `DATABASE_URL` is set correctly in Railway environment variables

### Issue 2: Game loads but no sound
**Fix:** Make sure these files exist in your repo:
- `client/public/sounds/hit.wav`
- `client/public/sounds/success.wav`
- `client/public/sounds/bg-music.wav`

### Issue 3: White screen / No UI
**Fix:** Run `npm run build` locally first to verify build works, then push

### Issue 4: "Module not found" errors
**Fix:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue 5: Database tables don't exist
**Fix:** Run `npm run db:push` to create tables in Neon DB

## Required Files in Repository

Make sure these are committed to GitHub:

```
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ vite.config.ts
✅ tailwind.config.ts
✅ postcss.config.js
✅ drizzle.config.ts
✅ client/ (entire folder)
✅ server/ (entire folder)
✅ shared/ (entire folder)
✅ client/public/sounds/ (all .wav files)
✅ client/public/textures/ (all texture files if any)
```

**DON'T commit:**
```
❌ .env
❌ node_modules/
❌ dist/
❌ .env.local
```

## Test Your Build Locally First

Before pushing to Railway, test the production build locally:

```bash
# Build the app
npm run build

# Set environment variables
export DATABASE_URL="your_neon_connection_string"
export SESSION_SECRET="your_secret_key"
export NODE_ENV="production"

# Run production server
npm start
```

Visit http://localhost:5000 - if it works here, it will work on Railway!

## Railway-Specific Configuration

Create a `railway.toml` file in your project root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Port Configuration

The server is configured to use `process.env.PORT || 5000`. Railway will automatically set the PORT variable, so no changes needed.

## Still Having Issues?

Check Railway deployment logs:
1. Go to your Railway project
2. Click on your deployment
3. Check the "Deployments" tab for build logs
4. Check the "Observability" tab for runtime logs

Look for errors like:
- "Connection refused" → Database connection issue
- "Module not found" → Missing dependencies
- "ENOENT" → Missing files
- "Port already in use" → Port configuration issue

## Success Checklist

Once deployed successfully, you should see:

✅ Railway shows "Active" status
✅ Game loads at your Railway URL
✅ You can start a game
✅ Blocks move and stack
✅ Sounds play (after unmuting)
✅ Game feed shows recent games
✅ No errors in browser console
