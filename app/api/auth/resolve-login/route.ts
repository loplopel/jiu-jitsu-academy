import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeLogin } from '@/lib/login';

const schema = z.object({ login: z.string().min(3) });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Informe o login.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Informe o login.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  }

  const rawLogin = parsed.data.login.trim();
  const normalizedLogin = normalizeLogin(rawLogin);

  let profile: { id: string; active: boolean | null; role: string } | null = null;

  if (normalizedLogin) {
    const { data } = await admin
      .from('profiles')
      .select('id,active,role')
      .ilike('username', normalizedLogin)
      .maybeSingle();
    profile = data;
  }

  // Compatibilidade com contas antigas enquanto a migração é concluída.
  if (!profile && rawLogin.includes('@')) {
    const { data } = await admin
      .from('profiles')
      .select('id,active,role')
      .ilike('email', rawLogin)
      .maybeSingle();
    profile = data;
  }

  if (!profile || profile.active === false) {
    return NextResponse.json({ error: 'Login ou senha inválidos.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
  const authEmail = userData.user?.email;

  if (userError || !authEmail) {
    return NextResponse.json(
      { error: 'Acesso não configurado. Procure o administrador da academia.' },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { authEmail, role: profile.role },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
