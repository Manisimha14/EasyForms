# Migrations

Place idempotent migration scripts in this directory.
Each script should be a standalone Node.js ES module that can be run with:

```bash
node migrations/<script-name>.js
```

## Naming convention

Use the ISO date prefix format:
```
YYYYMMDD_description.js
```

Example:
```
20261025_add-form-slug-index.js
```

## Template

```js
// migrations/YYYYMMDD_description.js
// Description: <what this migration does>

import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const MONGODB_URI = env.MONGODB_URI;

async function run() {
  console.log('Connecting to', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));
  await mongoose.connect(MONGODB_URI);

  // ---- Your idempotent migration logic here ----
  // Example:
  // const db = mongoose.connection.db;
  // await db.collection('forms').createIndex({ slug: 1 }, { unique: true, sparse: true });

  console.log('Migration complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

## Rules

1. **Idempotent**: Every script must be safe to run multiple times.
2. **No data loss**: Use `$set` / `$unset` with filters. Never `drop()` in production.
3. **Log progress**: Print what the script is doing so operators can follow along.
4. **Exit cleanly**: Always `mongoose.disconnect()` and `process.exit()`.
