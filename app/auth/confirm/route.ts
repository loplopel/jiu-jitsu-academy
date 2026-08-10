import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const allowedTypes = new Set<EmailOtpType>(['recovery','invite','email','email_change']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const rawType = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') || '/update-password';
  const origin = url.origin;

  if (!tokenHash || !rawType || !allowedTypes.has(rawType)) {
    return NextResponse.redirect(`${origin}/update-password?error_code=invalid_link`);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/update-password?error_code=auth_unavailable`);
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType,
  });

  if (error) {
    const target = new URL('/update-password', origin);
    target.searchParams.set('error_code', error.code || 'otp_invalid');
    return NextResponse.redirect(target);
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/update-password';
  return NextResponse.redirect(new URL(safeNext, origin));
}
