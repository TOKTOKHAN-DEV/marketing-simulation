import {readConfig} from '../simulation.mjs';
import {replayRequest} from '../replay-request.mjs';
export default function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST 요청만 사용할 수 있어요.'});}
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(Buffer.byteLength(JSON.stringify(body??{}),'utf8')>2*1024*1024)return res.status(413).json({error:'재계산할 기록이 너무 큽니다.'});
  const {status,...result}=replayRequest(body,readConfig(process.cwd()));
  return res.status(status).json(result);
 }catch(error){return res.status(error instanceof SyntaxError?400:500).json({error:'월별 기록을 다시 계산하지 못했어요. 원래 결과는 유지됩니다.'});}
}
