# Campaign Manager - Better Auth + Prisma + PostgreSQL

Aplicação de gerenciamento de campanhas construída com Next.js 16, Better Auth, Prisma e PostgreSQL.

## Tecnologias

- **Next.js 16** - Framework React
- **Better Auth** - Autenticação com plugins Admin e Organization
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **Tailwind CSS v4** - Estilização
- **shadcn/ui** - Componentes de UI

## Configuração
v
### 1. Variáveis de Ambiente

As seguintes variáveis já foram configuradas no v0:

- `DATABASE_URL` - Connection string do PostgreSQL
- `BETTER_AUTH_SECRET` - Chave secreta para Better Auth (mínimo 32 caracteres)
- `BETTER_AUTH_URL` - URL da aplicação (http://localhost:8051 para desenvolvimento)

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar o Banco de Dados

Execute o seguinte comando para criar as tabelas no banco de dados:

```bash
pnpm db:push
```

Ou para criar uma migração:

```bash
pnpm db:migrate
```

### 4. Gerar o Prisma Client

```bash
pnpm db:generate
```

### 5. Executar o Projeto

```bash
pnpm dev
```

Acesse http://localhost:8051

## Estrutura do Projeto

```
├── app/
│   ├── api/auth/[...all]/     # API routes do Better Auth
│   ├── dashboard/             # Páginas do dashboard (protegidas)
│   │   ├── layout.tsx         # Layout com sidebar
│   │   ├── page.tsx           # Página principal do dashboard
│   │   └── campaign/          # Página de campanhas
│   ├── login/                 # Página de login
│   └── signup/                # Página de cadastro
├── components/
│   ├── app-sidebar.tsx        # Sidebar da aplicação
│   ├── auth-provider.tsx      # Provider de autenticação
│   └── ui/                    # Componentes shadcn/ui
├── lib/
│   ├── auth.ts                # Configuração do Better Auth
│   ├── auth-client.ts         # Cliente do Better Auth
│   └── prisma.ts              # Cliente do Prisma
└── prisma/
    └── schema.prisma          # Schema do banco de dados
```

## Funcionalidades

### Autenticação

- Login e Cadastro com email/senha
- Proteção de rotas
- Sessões persistentes
- Plugins Admin e Organization do Better Auth

### Dashboard

- Sidebar responsivo com navegação
- Página principal com métricas
- Página de gerenciamento de campanhas
- Layout consistente em todas as páginas

## Próximos Passos

1. Implementar a criação e edição de campanhas
2. Adicionar métricas reais no dashboard
3. Implementar funcionalidades de organização (multi-tenant)
4. Adicionar funcionalidades de admin
5. Implementar envio de emails para verificação

## Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Cria o build de produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm db:generate` - Gera o Prisma Client
- `pnpm db:push` - Sincroniza o schema com o banco de dados
- `pnpm db:migrate` - Cria uma nova migração
- `pnpm db:studio` - Abre o Prisma Studio


docker build -t educarrer .

docker run -d -p 8051:8051 --name educarrer-container educarrer

docker compose up -d ( "Para rodar compose pela primeira vez" )

docker compose up -d --build ( "Para rebuildar projeto apos a primeira vez" )


# Acessar banco de dados dentro do docker

- O su - postgres troca o usuário do terminal para o usuário postgres do sistema operacional (Linux)
su - postgres

- Acessar o banco de dados
psql -U educarrer -d edu_carrer_web
