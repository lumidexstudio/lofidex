FROM node:18-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /code

COPY package*.json ./
RUN npm install

EXPOSE 3000
COPY . .

CMD ["npm", "start"]