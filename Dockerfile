FROM node:20-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Instala dependências
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia código-fonte
COPY . .

# Build do Next.js
RUN npm run build

# Configurar para produção
ENV NODE_ENV=production

# Copiar arquivos estáticos para standalone
RUN cp -r .next/static .next/standalone/.next/static || true
RUN cp -r public .next/standalone/public || true

# Criar pastas de uploads com permissões
RUN mkdir -p .next/standalone/uploads .next/standalone/public/uploads
RUN chmod -R 755 .next/standalone/uploads .next/standalone/public/uploads

# Entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
