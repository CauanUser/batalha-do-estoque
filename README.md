# Batalha do Estoque

Quiz de logística e controle de estoque com 15 perguntas, painel de apresentador e participante, cronômetro de 15 segundos e ranking.

## Gerar APK Android de teste
1. Abra a aba **Actions** deste repositório.
2. Selecione **Build Android APK**.
3. Clique em **Run workflow** e confirme.
4. Quando a execução terminar com sucesso, abra-a e baixe o artefato **batalha-do-estoque-debug-apk**.
5. Extraia o ZIP no Android e instale o APK. Talvez seja necessário autorizar a instalação pelo navegador ou gerenciador de arquivos.

O workflow também roda automaticamente quando arquivos principais são alterados.

## Estado atual
- Primeira interface e as 15 perguntas do quiz adicionadas.
- Fluxo de demonstração local para apresentador e participante.
- Pipeline de compilação de APK de teste incluído.
- **Multiplayer entre celulares ainda não está conectado**: o app atual guarda participantes apenas na memória do aparelho.
- QR Code real, sincronização de sala, cronômetro compartilhado e ranking em tempo real ainda precisam de integração com Supabase.
- `supabase.sql` é uma estrutura inicial, não uma integração pronta. As políticas permissivas são inseguras para produção e devem ser substituídas antes de abrir publicamente.

## Próxima etapa
Criar um projeto Supabase, aplicar e revisar o SQL, e então integrar Realtime e regras seguras de apresentador/participante. Use apenas a chave pública `anon` no cliente; nunca coloque a chave `service_role` no app.
