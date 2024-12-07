import { serve } from '@hono/node-server';
import app from './server';

const port = process.env.PORT || 3001;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port)
});

export default app; 