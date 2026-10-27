import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleCreateStudentAccounts } from './src/server/adminStudentServer.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables from .env and .env.local without filtering
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'admin-student-creation-endpoint',
        configureServer(server) {
          // Status inspection endpoint for admin UI
          server.middlewares.use('/api/admin/server-status', (req, res) => {
            const hasServiceKey = Boolean(env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
            const hasSupabaseUrl = Boolean(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              configured: hasSupabaseUrl,
              hasServiceKey,
              mode: hasServiceKey ? 'admin_service_role' : 'publishable_fallback'
            }));
          });

          // Secure server-side student accounts batch creation endpoint
          server.middlewares.use('/api/admin/create-students', async (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }

            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const students = body.students || [];
                const result = await handleCreateStudentAccounts(students, env);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = result.success ? 200 : (result.summary?.successCount > 0 ? 207 : 400);
                res.end(JSON.stringify(result));
              } catch (err) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({
                  success: false,
                  message: err.message || 'Internal server error while creating accounts.'
                }));
              }
            });
          });
        }
      }
    ]
  };
});
