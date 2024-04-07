FROM node:18-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY . .
RUN npm i -g pnpm
RUN pnpm i

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["pnpm", "start"]