FROM node:18-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /code

COPY package*.json ./
RUN pnpm install

EXPOSE 3000
COPY . .

CMD ["node", "src/index.js"]