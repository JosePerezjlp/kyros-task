import 'dotenv/config';
import { validateEnv } from './utils/envValidator';

// Validate env before anything else
validateEnv();

import { createApp } from './app';

const PORT = parseInt(process.env.PORT as string, 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});
