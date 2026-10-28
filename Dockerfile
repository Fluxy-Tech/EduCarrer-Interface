# Imagem base
FROM node:20-alpine

WORKDIR /usr/app

COPY package.json package-lock.json ./

# Instala dependências para build de addons nativos (como better-sqlite3)
RUN apk add --no-cache python3 py3-pip make g++

# Instala exatamente as versões do package-lock.json (evita divergência de
# pacotes com versionamento beta, como o better-auth, entre host e container)
RUN npm ci --legacy-peer-deps

COPY . .

# Gera os arquivos Prisma (caso use)
RUN npx prisma generate

# Variáveis necessárias em tempo de build (módulos como OpenAI/Better Auth
# são instanciados durante a coleta de dados das páginas do Next.js)
ARG BETTER_AUTH_SECRET
ARG OPENAI_API_KEY
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Gera o build de produção do Next.js
RUN npm run build

# Expõe a porta da aplicação
EXPOSE 8051

# Comando de inicialização
CMD ["npm", "start"]
# CMD ["npm", "run", "dev"]