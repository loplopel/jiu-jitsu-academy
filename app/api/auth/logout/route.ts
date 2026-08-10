import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function isAuthCookie(name:string){return name.startsWith('sb-')&&name.includes('-auth-token')}

export async function GET(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const response=NextResponse.redirect(new URL('/login',request.url),303);

  if(url&&key){
    const supabase=createServerClient(url,key,{
      cookies:{
        getAll(){return request.cookies.getAll()},
        setAll(items){items.forEach(({name,value,options})=>response.cookies.set(name,value,options))}
      }
    });
    await supabase.auth.signOut().catch(()=>{});
  }

  request.cookies.getAll().forEach(({name})=>{
    if(isAuthCookie(name)) response.cookies.set(name,'',{path:'/',maxAge:0});
  });
  return response;
}
