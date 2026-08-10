import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths=['/','/login','/forgot-password','/update-password','/api/auth/login'];

export async function proxy(request: NextRequest) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||url.includes('SEU-PROJETO')) return NextResponse.next({request});

  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){ return request.cookies.getAll(); },
      setAll(cookiesToSet,headers){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        Object.entries(headers).forEach(([header,value])=>response.headers.set(header,value));
      }
    }
  });

  const {data:{user}}=await supabase.auth.getUser();
  const pathname=request.nextUrl.pathname;
  const isPublic=publicPaths.some(path=>pathname===path||pathname.startsWith('/auth/'));
  if(!user&&!isPublic){const redirect=request.nextUrl.clone();redirect.pathname='/login';return NextResponse.redirect(redirect);}
  if(user&&(pathname==='/login'||pathname==='/forgot-password')){const redirect=request.nextUrl.clone();redirect.pathname='/dashboard';return NextResponse.redirect(redirect);}
  return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
