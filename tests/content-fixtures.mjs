import {initialMemory} from '../model.mjs';
// Established content base for tests isolating CPC, creative fatigue, funding and replay.
// Startup/content-gating scenarios continue to use initialMemory().
export const establishedMemory=(patch={})=>({...initialMemory(),organicAssets:100.8,contentPublished:{existing:{owned:100,'owned-sns':20}},...patch});
