# v2.0.4 — Performance

Versão focada exclusivamente em velocidade e estabilidade, sem alterar o fluxo funcional aprovado.

## Melhorias

- índices PostgreSQL nas consultas mais frequentes do app;
- contador do sino de notificações agora busca apenas a quantidade de não lidas;
- lista de notificações limitada aos 100 itens mais recentes;
- Dashboard passa a agrupar presença e reservas em memória com mapas, evitando filtros repetidos;
- Ranking/Gamificação elimina filtros repetidos por aluno;
- atualização de conquistas deixa de fazer consultas individuais para cada atleta e passa a trabalhar em lote;
- atualização de conquistas usa um único `upsert` em lote;
- mantidos login próprio, PWA, QR, IEA, permissões e cadastros da v2.0.3.

## Banco

Executar uma vez no Supabase:

`supabase/v2.0.4-performance.sql`

O script é aditivo e usa `create index if not exists`. Não apaga registros.
