import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminGate} from '@/lib/admin-gate';
import {isValidLogin,normalizeLogin} from '@/lib/login';

const schema=z.object({id:z.string().uuid(),username:z.string().min(3).optional(),password:z.string().min(6).optional(),active:z.boolean().optional()}).refine(v=>v.username!==undefined||v.password!==undefined||v.active!==undefined,{message:'Nenhuma alteração'});
export async function PATCH(req:Request){
  const g=await adminGate();if('error'in g)return g.error;
  const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Revise login, senha e situação.'},{status:400});
  const d=p.data;
  const changes:any={};
  if(d.username!==undefined){const u=normalizeLogin(d.username);if(!isValidLogin(u))return NextResponse.json({error:'O login deve ter 3 a 32 caracteres: letras, números, ponto, hífen ou underline.'},{status:400});const {data:exists}=await g.admin.from('profiles').select('id').ilike('username',u).neq('id',d.id).maybeSingle();if(exists)return NextResponse.json({error:'Este login já está em uso.'},{status:409});changes.username=u;}
  if(d.active!==undefined)changes.active=d.active;
  if(Object.keys(changes).length){const {error}=await g.admin.from('profiles').update(changes).eq('id',d.id);if(error)return NextResponse.json({error:error.message},{status:400});}
  if(d.password!==undefined){const {error}=await g.admin.auth.admin.updateUserById(d.id,{password:d.password});if(error)return NextResponse.json({error:error.message},{status:400});}
  return NextResponse.json({ok:true});
}
