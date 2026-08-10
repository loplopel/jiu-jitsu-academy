# v2.0.2 — Check-in QR pelo celular

- Corrige o fluxo do aluno ao tocar em **Check-in**: agora a página abre a câmera em vez de exibir imediatamente “QR Code inválido”.
- Leitura automática do QR usando a câmera traseira quando o navegador oferece leitura de QR nativa.
- Mantém compatibilidade com o QR em formato de URL (`/check-in/scan?token=...`).
- Mantém validação direta quando o QR é lido pela câmera padrão do celular.
- Mensagens específicas para câmera negada, câmera indisponível, QR expirado, sessão não autenticada e falha de conexão.
- Botão **Abrir câmera novamente** após erro.
- Nenhuma alteração no banco de dados é necessária.
