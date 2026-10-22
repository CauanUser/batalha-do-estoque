# Batalha do Estoque

Quiz web responsivo de logística e controle de estoque, com 15 perguntas, painel de apresentador, cronômetro de 15 segundos e ranking demonstrativo.

## Versão web
O projeto está preparado para publicação gratuita no GitHub Pages.

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Abra a aba **Actions** e execute **Deploy web version to GitHub Pages** (ou aguarde o workflow automático após um push).
4. Quando concluir, abra o endereço publicado indicado na execução do workflow.

Repositório: https://github.com/CauanUser/batalha-do-estoque

## Importante sobre o estado atual
- A interface web e o quiz demonstrativo funcionam no navegador.
- O modo atual ainda não sincroniza jogadores entre aparelhos diferentes.
- O QR Code/link de entrada compartilhado e o multiplayer real dependem da integração com Supabase.
- O arquivo `supabase.sql` é um protótipo e suas políticas permissivas não devem ser usadas em produção pública sem revisão de segurança.
- Não coloque chaves secretas nem a chave `service_role` no código do site.

## Ativar multiplayer
1. Criar um projeto Supabase.
2. Executar o SQL de estrutura no SQL Editor, depois revisar as políticas de acesso.
3. Conectar a URL do projeto e a chave pública anon no frontend.
4. Implementar e testar sincronização de salas, jogadores, respostas e cronômetro.

## APK Android de teste
O workflow **Build Android APK** também gera um APK de demonstração. O APK não adiciona multiplayer por si só.
