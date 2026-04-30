FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👇 ADD THIS
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 👇 build now gets env
RUN npm run build

# serve build
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]