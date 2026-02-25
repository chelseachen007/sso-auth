FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install

# 复制 Prisma 文件
COPY prisma ./prisma/
RUN npx prisma generate

# 复制源代码
COPY src ./src

# 创建数据库目录
RUN mkdir -p /app/database

# 暴露端口
EXPOSE 3002

# 启动命令（先运行迁移）
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
