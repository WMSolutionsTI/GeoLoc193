FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instala dependências
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia código-fonte
COPY . .

# Build do Next
RUN npm run build

# Entrypoint com migração + seed + start
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
