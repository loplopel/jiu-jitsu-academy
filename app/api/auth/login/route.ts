import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeLogin } from '@/lib/login';

function loginUrl(request: NextRequest, error?: string) {
  const url = new URL('/login', request.url);

  if (error) {
    url.searchParams.set('error', error);
  }

  return url;
}

function destinationForRole(role?: string) {
  if (role === 'admin') return '/dashboard';
  if (role === 'professor') return '/professor';

  return '/meu-painel';
}

function isSupabaseAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('-auth-token');
}

export async function POST(request: NextRequest) {

  const form = await request.formData();

  const rawLogin = String(form.get('login') || '').trim();
  const password = String(form.get('password') || '');
  const next = String(form.get('next') || '');

  if (!rawLogin || !password) {
    return NextResponse.redirect(
      loginUrl(request, 'Informe login e senha.'),
      303
    );
  }


  const admin = getSupabaseAdmin();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;


  if (!admin || !url || !key) {
    return NextResponse.redirect(
      loginUrl(request, 'Supabase não configurado.'),
      303
    );
  }


  const normalizedLogin = normalizeLogin(rawLogin);


  let profile: {
    id: string;
    active: boolean | null;
    role: string;
    email: string | null;
  } | null = null;



  // Busca pelo login
  if (normalizedLogin) {

    const { data } = await admin
      .from('profiles')
      .select('id,active,role,email')
      .ilike('username', normalizedLogin)
      .maybeSingle();


    profile = data;
  }



  // Busca por email caso seja utilizado
  if (!profile && rawLogin.includes('@')) {

    const { data } = await admin
      .from('profiles')
      .select('id,active,role,email')
      .ilike('email', rawLogin)
      .maybeSingle();


    profile = data;
  }



  if (!profile || profile.active === false) {

    return NextResponse.redirect(
      loginUrl(request, 'Login ou senha inválidos.'),
      303
    );

  }



  const authEmail = profile.email;


  if (!authEmail) {

    return NextResponse.redirect(
      loginUrl(request, 'Acesso não configurado.'),
      303
    );

  }



  let response = NextResponse.redirect(

    new URL(
      next.startsWith('/') && !next.startsWith('//')
        ? next
        : destinationForRole(profile.role),
      request.url
    ),

    303

  );



  // Remove sessões antigas quebradas

  request.cookies
    .getAll()
    .forEach(({ name }) => {

      if (isSupabaseAuthCookie(name)) {

        response.cookies.set(
          name,
          '',
          {
            path: '/',
            maxAge: 0
          }
        );

      }

    });



  const supabase = createServerClient(
    url,
    key,
    {

      cookies: {

        getAll() {

          return request.cookies
            .getAll()
            .filter(({ name }) => !isSupabaseAuthCookie(name));

        },


        setAll(cookiesToSet) {

          cookiesToSet.forEach(
            ({ name, value, options }) => {

              response.cookies.set(
                name,
                value,
                options
              );

            }
          );

        },

      },

    }

  );



  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({

    email: authEmail,
    password

  });



  if (error || !data.session) {

    return NextResponse.redirect(
      loginUrl(request, 'Login ou senha inválidos.'),
      303
    );

  }



  return response;

}