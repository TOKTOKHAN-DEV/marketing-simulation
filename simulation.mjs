import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import path from 'node:path';
import { validateCampaign, project } from './model.mjs';
export function readConfig(root) {
  let values = {};
  for (const file of ['.env', '.env.local']) {
    try { values = { ...values, ...parse(readFileSync(path.join(root, file))) }; }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  values = { ...values, ...process.env };
  const n = Number(values.OPEN_STAGE ?? 1);
  return { openStage: Number.isInteger(n) && n >= 0 && n <= 4 ? n : 0,
    workshopId: values.WORKSHOP_ID || 'marketing-2026',
    workshopName: values.WORKSHOP_NAME || '마케팅 전략 실전 워크숍', port: values.PORT || 3000 };
}
export function validateRequest(body, config) {
  if (!body || !Number.isInteger(body.stage) || body.stage < 1 || body.stage > 3) return { status: 400, message: '실행할 전략 단계를 선택해주세요.' };
  if (body.stage > config.openStage) return { status: 403, message: '강사가 아직 이 단계를 열지 않았어요. 새로고침 후 확인해주세요.' };
  if (body.workshopId !== config.workshopId) return { status: 409, message: '워크숍이 변경됐어요. 새로고침해주세요.' };
  const message = validateCampaign({...body,availableStage:config.openStage});
  if (message) return { status: 400, message };
  if (!Number.isInteger(body.round) || body.round < 1 || body.round > 3) return { status: 400, message: '각 단계에서는 3개월까지 진행할 수 있어요.' };
  return null;
}
export function simulate(body) {
  const forecast = project(body, 3);
  return { id: crypto.randomUUID(), stage: body.stage, round: body.round,
    createdAt: new Date().toISOString(), businessSnapshot: structuredClone(body.business),
    productSnapshot: structuredClone(body.product), productsSnapshot: structuredClone(body.products||[body.product]), plan: structuredClone(body.plan),
    metrics: forecast[0], forecast, memoryBefore: structuredClone(body.memory), memoryAfter: forecast[0].memoryAfter };
}
