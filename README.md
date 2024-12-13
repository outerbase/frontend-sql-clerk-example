
## Getting Started

### Step 1: Deploy a StarbaseDB instance
```
curl https://starbasedb.com/install.sh | bash
```

### Step 2: Enable StarbaseDB features

The first command pulled down the StarbaseDB repository and deployed it. Now we want to enable two features in that configuration for our demo so edit the following values in the `wrangler.toml` of that project like so:

```
ENABLE_ALLOWLIST = 1
ENABLE_RLS = 1
AUTH_ALGORITHM = "RS256"
AUTH_JWKS_ENDPOINT = ""    # Put your JWKS endpoint from the next step in here
```

### Step 3: Add a `todos` table

Run the following SQL query against your StarbaseDB internal source. If you need help understanding how to run queries against your instance please reference the README here: https://github.com/outerbase/starbasedb
```
CREATE TABLE "todos"(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT,
  "text" TEXT
, "completed" INTEGER NOT NULL DEFAULT '0')
```

### Step 4: Create a Clerk account

Create an account on clerk.com that will serve as your user authentication method. You will need a `PUBLISHABLE_KEY` and `SECRET_KEY` that we will put in a local environment file shortly. When you create your JWT template be sure to select RS256 as your algorithm.

### Step 5: Update `.env.local` file

If you don't already have a `.env.local` file at the root of this project, create one and place the following values in it:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR-VALUE-HERE
CLERK_SECRET_KEY=sk_test_YOUR-VALUE-HERE
NEXT_PUBLIC_STARBASEDB_URL=https://starbasedb.YOUR-IDENTIFIER.workers.dev
```


### Step 6: Run the project
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
