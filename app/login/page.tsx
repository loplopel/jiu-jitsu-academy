import Image from 'next/image';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-art">
        <span className="pill">CONEXÃO • DISCIPLINA • EVOLUÇÃO</span>
        <h1>Seu time conectado dentro e fora do tatame.</h1>
        <p className="muted">
          Aulas, presença por QR Code, mensalidades, graduações, eventos, rankings e evolução esportiva.
        </p>
      </section>

      <section className="auth-panel">
        <div className="card auth-box">
          <div className="brand">
            <Image src="/logo-conexao-paulista.png" width={82} height={82} className="logo-login" alt="Conexão Paulista" priority />
            <div>
              CONEXÃO PAULISTA<br />
              <span style={{ color: '#fb923c' }}>JIU-JITSU</span>
            </div>
          </div>

          <div style={{ margin: '26px 0 20px' }}>
            <h2 style={{ marginBottom: 6 }}>Bem-vindo de volta</h2>
            <div className="muted">Entre com o login criado pela academia.</div>
          </div>

          <form className="form-stack" action="/api/auth/login" method="post">
            {params.next ? <input type="hidden" name="next" value={params.next} /> : null}
            <div>
              <label className="label" htmlFor="login">Login</label>
              <input
                id="login"
                name="login"
                className="input"
                autoComplete="username"
                placeholder="Ex.: rodrigo"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {params.error ? <div className="notice error">{params.error}</div> : null}

            <button className="btn btn-primary" type="submit">Entrar no sistema</button>

            <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
              Esqueceu a senha? Procure o administrador da academia.
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
