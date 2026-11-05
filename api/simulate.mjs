import {readConfig,validateRequest,simulate} from '../simulation.mjs';
export default function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST 요청만 사용할 수 있어요.'});}
 try{
  let body=req.body;
  if(typeof body==='string')body=JSON.parse(body);
  if(Buffer.byteLength(JSON.stringify(body??{}),'utf8')>128*1024)return res.status(413).json({error:'요청 데이터가 너무 큽니다.'});
  const error=validateRequest(body,readConfig(process.cwd()));
  if(error)return res.status(error.status).json({error:error.message});
  return res.status(200).json(simulate(body));
 }catch(error){
  return res.status(error instanceof SyntaxError?400:500).json({error:error instanceof SyntaxError?'요청 형식을 확인해주세요.':'실행하지 못했어요. 잠시 후 다시 시도해주세요.'});
 }
}
