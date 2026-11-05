import {readConfig} from '../simulation.mjs';
export default function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'GET 요청만 사용할 수 있어요.'});}
 return res.status(200).json(readConfig(process.cwd()));
}
