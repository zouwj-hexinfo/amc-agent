FROM oven/bun:1

ARG PORT=3100
ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /app

COPY package.json bun.lock ./
COPY dist ./dist

EXPOSE ${PORT}

CMD ["bun", "run", "dist/server/index.js"]
