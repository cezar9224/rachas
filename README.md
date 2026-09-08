# Rachas

MVP para gerenciamento de rachas de futebol amador, construído com Next.js, TypeScript, Tailwind CSS, PostgreSQL e Prisma.

## Estado atual

Etapa 11 concluída e módulo de resultados adicionado: autenticação, gestão multi-racha, perfis, partidas, avaliações, sorteio inteligente, campo responsivo, histórico e estatísticas.

## Arquitetura

O MVP é um monólito modular em Next.js App Router. Server Components fazem leituras, Server Actions e Route Handlers recebem comandos, e módulos de domínio concentram validação, autorização e regras de negócio. Apenas os repositórios e serviços server-side acessam o Prisma.

```text
Browser
  -> Next.js App Router (pages/layouts)
  -> Server Actions / Route Handlers (Zod)
  -> auth + authorization guards
  -> domain services
  -> Prisma ORM
  -> PostgreSQL
```

Estrutura planejada:

```text
prisma/
  schema.prisma             # schema aprovado na Etapa 3
  seed.ts
src/
  app/
    (auth)/                 # login e cadastro
    (app)/                  # dashboard autenticado
    racha/[rachaId]/        # área protegida por membership
    api/
  components/
    ui/                     # primitivas visuais
    racha/                  # componentes do domínio
  modules/
    auth/
    rachas/
    players/
    matches/
    ratings/
    teams/
  server/
    db.ts
    auth.ts
    authorization.ts
  lib/
    validation/
    utils.ts
tests/
```

### Autenticação

- Uma conta global por e-mail normalizado e único.
- Senhas com hash `bcrypt`, nunca persistidas ou registradas em texto puro.
- Sessões opacas persistidas no banco; o navegador recebe somente um token aleatório em cookie `httpOnly`, `sameSite=lax`, `secure` em produção.
- O token é armazenado no banco apenas como hash e tem expiração e revogação.
- O `userId` de qualquer mutação vem da sessão, nunca do payload.

### Autorização e isolamento

- `requireUser()` valida a sessão.
- `requireRachaMember(rachaId)` consulta a associação ativa do usuário autenticado.
- `requireRachaAdmin(rachaId)` aceita apenas `OWNER` ou `ADMIN` obtidos do banco.
- Consultas filhas combinam o identificador do recurso com `rachaId`; não basta validar um ID fornecido pelo cliente.
- Operações concorrentes sensíveis, como promoção da lista de espera, usam transação.
- Cada racha tem exatamente um `OWNER`, garantido pelo serviço transacional de criação e protegido nas alterações de papel.

### Balanceamento de times

`teamBalancer` será uma função pura e determinística quando receber uma seed. Ela valida capacidade, separa goleiros, cria várias alocações iniciais e melhora cada uma por trocas locais dentro de um limite de iterações. Mantém a solução de menor custo:

```text
score = ratingPenalty
      + positionPenalty
      + goalkeeperPenalty * 1000
      + teamSizePenalty * 1000
```

O componente de nota minimiza a dispersão entre médias; o posicional penaliza equipes sem cobertura adequada ao formato. O limite de tentativas evita processamento não controlado. Os testes cobrirão os seis cenários exigidos, unicidade, completude, capacidade e distribuição de goleiros.

## Sequência de implementação

1. Requisitos, arquitetura e schema proposto.
2. Projeto e dependências-base.
3. PostgreSQL, Prisma, migration inicial e seed.
4. Cadastro, login e sessões.
5. Rachas, convites e memberships.
6. Perfis e posições.
7. Partidas, presença e lista de espera.
8. Avaliações.
9. Balanceamento e persistência dos times.
10. Campo responsivo com coordenadas normalizadas.
11. Testes integrados e acabamento do fluxo de demonstração.

## Desenvolvimento

Pré-requisitos: Node.js 24+, npm e Docker com Compose.

```bash
npm install
copy .env.example .env
npm run db:generate
docker compose up -d postgres
npm run db:deploy
npm run db:seed
npm run dev
npm.cmd run db:seed
```

O seed cria o racha `Arena Rio Branco`, posições FUT7, 16 jogadores e uma próxima partida com 14 confirmados e 2 jogadores na lista de espera.

Credenciais de demonstração:

```text
E-mail: anderson@rachas.app
Senha: Rachas@123
Código do racha: ARB7K2
```

### Banco de dados

- `npm run db:migrate`: cria uma nova migration durante o desenvolvimento.
- `npm run db:deploy`: aplica migrations existentes sem interação, indicado para deploy.
- `npm run db:seed`: recria os dados do racha de demonstração de forma idempotente.
- `npm run db:studio`: abre a interface local do Prisma.

### Autenticação

- Cadastro: `http://localhost:3000/cadastro`
- Login: `http://localhost:3000/entrar`
- Área autenticada: `http://localhost:3000/app`
- A senha é armazenada com bcrypt e o cookie contém apenas um token aleatório.
- Somente o hash SHA-256 do token de sessão é persistido no banco.
- A recuperação de senha usa token aleatório de uso único, persiste somente seu hash e expira em 30 minutos.
- Depois da redefinição, todas as sessões e tokens de recuperação da conta são revogados.
- Em desenvolvimento, o link é mostrado na tela de recuperação; em produção, a entrega por e-mail deve ser conectada antes do deploy.

### Rachas

- Dashboard: `http://localhost:3000/app`
- Criar racha: `http://localhost:3000/app/rachas/novo`
- O criador recebe `OWNER` na mesma transação do racha e de suas posições.
- Convites sempre criam membros `PLAYER`; papéis enviados pelo navegador não são aceitos.
- A rota `/racha/[rachaId]` valida a associação usando o usuário da sessão.

### Jogadores

- Cada membership possui um perfil independente, sem duplicar a conta global.
- Fotos JPEG, PNG e WebP são validadas pelos bytes e limitadas a 2 MB.
- Posição principal e secundárias são aceitas somente quando pertencem ao racha acessado.
- Membros sem perfil são encaminhados para `/racha/[rachaId]/perfil`.
- A lista de jogadores está disponível em `/racha/[rachaId]/jogadores`.

### Partidas e presença

- `OWNER` e `ADMIN` podem criar partidas futuras com formato e capacidade configuráveis.
- A confirmação usa `CONFIRMED` enquanto há vagas e `WAITING_LIST` quando a capacidade é atingida.
- Confirmações concorrentes usam transações PostgreSQL com isolamento `Serializable` e retentativas limitadas.
- Ao cancelar uma presença confirmada, o primeiro membro da espera é promovido na mesma transação.
- Partidas e participantes sempre são consultados em conjunto com `rachaId` validado pela membership.

### Avaliações

- Cada membro pode avaliar outro jogador do mesmo racha de `0` a `10`, em intervalos de `0,5`.
- Não é permitido avaliar o próprio perfil ou um membro de outro racha.
- Existe apenas uma avaliação ativa por autor e jogador; uma nova nota atualiza a anterior.
- A nota atual é a média das avaliações recebidas. Sem avaliações, é usada a nota inicial definida por `OWNER` ou `ADMIN`.
- A lista de jogadores abre o perfil individual para consultar e atualizar avaliações.

### Times

- `OWNER` e `ADMIN` podem sortear ou refazer os times a partir dos jogadores confirmados na partida.
- O `teamBalancer` distribui goleiros primeiro e compara milhares de formações com penalidades de nota, posição, goleiros e tamanho.
- O sorteio possui limite de processamento, não duplica nem remove jogadores e persiste times e integrantes em uma transação.
- Mudanças na lista de presença invalidam a formação anterior para impedir times desatualizados.
- A página da partida mostra os times, suas médias e a diferença entre a maior e a menor média.

### Campo visual

- A formação de cada time é exibida sobre um campo responsivo com variações para Futsal, Fut7, Fut11 e personalizado.
- Jogadores recebem coordenadas normalizadas `x/y` conforme posição principal, com distribuição automática em linhas.
- As coordenadas são persistidas em `TeamPlayer`; sorteios antigos recebem uma formação calculada como compatibilidade.
- É possível alternar entre times e entre as visualizações de campo e lista.

### Resultados e estatísticas

- Cada racha semanal é armazenado como uma rodada independente com situação agendada, em andamento ou concluída.
- O administrador pode ajustar os times antes do primeiro jogo, registrar confrontos, corrigir placares e informar os autores dos gols.
- A classificação da rodada usa três pontos por vitória, um por empate, saldo de gols e gols marcados como critérios de desempate.
- A artilharia geral considera somente rodadas concluídas; o histórico mantém placares, times e a foto dos campeões do dia.
- Confirmações e novos sorteios são bloqueados depois do início, preservando os registros da rodada.

Verificações:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Resultado da validação final: 35 testes automatizados aprovados, sem erros de TypeScript ou lint, e build de produção concluído com sucesso.

## Deploy gratuito

A configuração recomendada para a primeira publicação é:

- Vercel para executar a aplicação Next.js.
- Neon para hospedar o PostgreSQL.
- Cloudinary para armazenar as fotos fora do banco de dados.

### 1. Criar o banco de produção

Crie um projeto no Neon e copie a connection string com pool de conexões habilitado. Ela deve possuir `sslmode=require` e será usada como `DATABASE_URL`.

Antes do primeiro deploy, aplique as migrations no banco remoto a partir de um terminal local:

```powershell
$env:DATABASE_URL="postgresql://USUARIO:SENHA@HOST-pooler.neon.tech/BANCO?sslmode=require"
npm.cmd run db:deploy
Remove-Item Env:DATABASE_URL
```

Não execute `db:seed` no banco de produção, pois esse comando cria dados de demonstração.

### 2. Configurar a Vercel

Importe o repositório GitHub na Vercel e cadastre estas variáveis nos ambientes `Production`, `Preview` e `Development` quando aplicável:

```text
DATABASE_URL=connection string do Neon
SESSION_COOKIE_NAME=rachas_session
SESSION_TTL_DAYS=30
CLOUDINARY_CLOUD_NAME=cloud name
CLOUDINARY_API_KEY=api key
CLOUDINARY_API_SECRET=api secret
```

O script `postinstall` gera o Prisma Client durante a instalação na Vercel. O build permanece como `npm run build`.

### 3. Publicar e validar

Depois do deploy, valide cadastro, login, criação de racha, presença, sorteio, envio de foto e registro de resultados. A recuperação de senha ainda não envia e-mail em produção e deve receber um provedor de e-mail antes de ser considerada completa.

Nunca cadastre segredos diretamente no GitHub ou no README. Use o painel de variáveis de ambiente da Vercel e mantenha o arquivo `.env` somente na máquina local.
