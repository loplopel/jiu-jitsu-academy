# v2.0.6 — Presença manual + QR universal iPhone

## Presença manual pelo professor
- Na lista de inscritos, alunos aguardando agora têm **Confirmar presença**.
- A presença manual registra horário, professor responsável e origem manual.
- Presenças manuais podem ser desfeitas pelo professor da aula/Administrador.
- Presenças feitas por QR não são apagadas pelo botão de desfazer manual.
- QR continua sendo o fluxo principal; presença manual cobre celular esquecido, bateria ou problema de câmera.

## QR universal / iPhone
- A câmera interna é aberta antes de verificar suporte ao BarcodeDetector.
- Android/Chrome usa BarcodeDetector quando disponível.
- iPhone/Safari/PWA usa leitor JS de fallback sobre o vídeo.
- Há botão **Câmera/foto do iPhone** usando a câmera nativa (`capture=environment`) para fotografar e ler o QR.
- Continua possível usar a câmera padrão do iPhone e tocar no link do QR.
- Token, expiração, uso único, aula, horário, localização e sessão continuam validados pela API.

## Limpeza de professores
- Incluído SQL `supabase/v2.0.6-manter-somente-osmar.sql`.
- Preserva somente **Osmar Rodrigues** (login `osmar`) como Professor.
- Reassocia alunos, aulas, horários, graduações, presenças manuais e histórico de QR ao Osmar antes de excluir os demais professores.
- Administrador e alunos não são removidos.
