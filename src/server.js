import dotenv from 'dotenv'
import { join } from 'path'

// 根据 NODE_ENV 加载对应的环境文件
const env = process.env.NODE_ENV || 'development'
const projectRoot = process.cwd()
const envFile = env === 'production' ? '.env.production' : '.env.development'

// 先尝试加载环境特定文件，再尝试默认 .env
dotenv.config({ path: join(projectRoot, envFile), override: true })
dotenv.config({ path: join(projectRoot, '.env') })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'

// 导入路由模块
import authRoutes from './routes/auth.js'
import oauthRoutes from './routes/oauth.js'
import tokenRoutes from './routes/token.js'
import appRoutes from './routes/applications.js'

const prisma = new PrismaClient()
const fastify = Fastify({
  logger: true,
  pluginTimeout: 60000
})

// ========== 注册插件 ==========

await fastify.register(cors, {
  origin: true,
  credentials: true
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'sso-secret-key-change-in-production',
  sign: {
    expiresIn: '7d' // Token 有效期 7 天
  }
})

// Swagger 文档
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'SSO Authentication Server',
      version: '1.0.0',
      description: '单点登录认证服务 API'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
})

await fastify.register(swaggerUI, {
  routePrefix: '/docs'
})

// ========== 注册路由模块 ==========

await authRoutes(fastify, prisma)
await oauthRoutes(fastify, prisma)
await tokenRoutes(fastify, prisma)
await appRoutes(fastify, prisma)

// 健康检查
fastify.get('/health', async () => {
  return { status: 'ok', service: 'sso-server', timestamp: new Date().toISOString() }
})

// ========== 启动服务器 ==========

const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' })
    console.log('🔐 SSO Server running at http://localhost:3002')
    console.log('📚 API Docs at http://localhost:3002/docs')
    console.log(`🌍 Environment: ${env}`)
    console.log(`🔧 GitHub OAuth: ${process.env.GITHUB_CLIENT_ID ? 'Configured' : 'Not configured'}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

// ========== 优雅关闭 ==========

process.on('SIGTERM', async () => {
  await fastify.close()
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await fastify.close()
  await prisma.$disconnect()
})
