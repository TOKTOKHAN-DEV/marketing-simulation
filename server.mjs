import express from 'express';
import { readConfig, simulate, validateRequest } from './simulation.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || readConfig(root).port || 3000);
const app = express();
// Raw applications contain personal data; only the allowlisted catalog is served.
app.use((req,res,next)=>{
  let pathname=req.path;
  try{pathname=decodeURIComponent(pathname);}catch{return res.sendStatus(400);}
  if(/applications-[^/]*\.csv$/i.test(pathname))return res.sendStatus(404);
  next();
});
app.use(express.json({ limit: '128kb' }));
app.get('/api/session', (_req, res) => {
  res.set('Cache-Control', 'no-store').json(readConfig(root));
});
app.post('/api/simulate', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const config = readConfig(root);
  const error = validateRequest(req.body, config);
  if (error) return res.status(error.status).json({ error: error.message });
  res.json(simulate(req.body));
});
app.use('/api', (_req, res) => res.status(404).json({ error: '요청을 찾을 수 없습니다.' }));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ root, server: { middlewareMode: true, hmr: { port: port + 1 } }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.status === 400 ? '요청 형식을 확인해주세요.' : '서버 요청에 실패했습니다. 다시 시도해주세요.' });
});
app.listen(port, '0.0.0.0', () => console.log(`Marketing Quest → http://localhost:${port}`));
