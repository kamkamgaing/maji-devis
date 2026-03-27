FROM node:20-alpine

WORKDIR /app

ARG CACHEBUST=1

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY db/ ./db/

EXPOSE ${PORT:-8080}

CMD ["node", "backend/src/server.js"]
