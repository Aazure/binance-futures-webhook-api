FROM oven/bun:latest

WORKDIR /app

COPY package.json ./
COPY bun.lockb ./

RUN bun install --frozen-lockfile

COPY . .
CMD ["bun", "run", "index.ts"]