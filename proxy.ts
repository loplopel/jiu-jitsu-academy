import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths=['/','/login','/api/auth/login'];

function isSupabaseAuthCookie(name:string){
  return name.startsWith('sb-') && name.includes('-auth-token');
}

function clearSupabaseAuthCookies(request:NextRequest,response:NextResponse){
  request.cookies.getAll().forEach(({name})=>{
    if(isSupabaseAuthCookie(name)) response.cookies.set(name,'',{path:'/',maxAge:0});
  });
}

export async function proxy(request: NextRequest) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||url.includes('SEU-PROJETO')) return NextResponse.next({request});

  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){ return request.cookies.getAll(); },
      setAll(cookiesToSet){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });

  const pathname=request.nextUrl.pathname;
  const isPublic=publicPaths.some(path=>pathname===path);
  const {data:{user},error}=await supabase.auth.getUser();

  if(error?.code==='refresh_token_not_found' || error?.message?.toLowerCase().includes('refresh token')){
    const cleanResponse=isPublic?NextResponse.next({request}):NextResponse.redirect(new URL('/login',request.url));
    clearSupabaseAuthCookies(request,cleanResponse);
    return cleanResponse;
  }

  if(!user&&!isPublic){
    const redirect=request.nextUrl.clone();
    redirect.pathname='/login';
    return NextResponse.redirect(redirect);
  }
  if(user&&pathname==='/login'){
    const redirect=request.nextUrl.clone();
    redirect.pathname='/dashboard';
    return NextResponse.redirect(redirect);
  }
  return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
