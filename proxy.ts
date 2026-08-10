import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessPath, homeForRole } from '@/lib/permissions';
import type { Role } from '@/lib/types';

const publicPaths=['/','/login','/offline','/api/auth/login','/api/auth/logout'];

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
    redirect.searchParams.set('next',pathname);
    return NextResponse.redirect(redirect);
  }

  if(!user) return response;

  const {data:profile}=await supabase.from('profiles').select('role,active').eq('id',user.id).maybeSingle();
  const role=(profile?.role || 'aluno') as Role;
  const home=homeForRole[role];

  if(profile?.active===false){
    const cleanResponse=NextResponse.redirect(new URL('/login?error=Acesso+inativo.+Procure+o+administrador.',request.url));
    clearSupabaseAuthCookies(request,cleanResponse);
    return cleanResponse;
  }

  if(pathname==='/' || pathname==='/login'){
    return NextResponse.redirect(new URL(home,request.url));
  }

  if(!pathname.startsWith('/api/') && !canAccessPath(role,pathname)){
    return NextResponse.redirect(new URL(home,request.url));
  }

  return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
