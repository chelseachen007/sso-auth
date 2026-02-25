import bcrypt from 'bcryptjs'
import { generateAccessToken, verifyPassword, hashPassword } from '../services/tokenService.js'

/**
 * 认证相关路由 - 登录/注册/登出
 */
export default async function authRoutes(fastify, prisma) {

  // ========== 用户名/密码注册 ==========
  fastify.post('/api/auth/register', async (request, reply) => {
    const { username, email, password } = request.body

    if (!username && !email) {
      return reply.code(400).send({ error: 'Username or email required' })
    }

    if (!password) {
      return reply.code(400).send({ error: 'Password required' })
    }

    // 检查用户名是否已存在
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUsername) {
        return reply.code(400).send({ error: 'Username already exists' })
      }
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return reply.code(400).send({ error: 'Email already exists' })
      }
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: username || email.split('@')[0]
      }
    })

    const token = generateAccessToken(fastify, user)

    // 创建会话
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 天
      }
    })

    return {
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    }
  })

  // ========== 用户名/密码登录 ==========
  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, email, password } = request.body

    if (!username && !email) {
      return reply.code(400).send({ error: 'Username or email required' })
    }

    // 通过用户名或邮箱查找用户
    let user = null
    if (username) {
      user = await prisma.user.findUnique({ where: { username } })
    }
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } })
    }

    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = generateAccessToken(fastify, user)

    // 创建会话
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return {
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    }
  })

  // ========== 获取当前用户信息 ==========
  fastify.get('/api/auth/me', {
    onRequest: [authenticate]
  }, async (request) => {
    const userId = request.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        authProviders: {
          select: {
            provider: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      throw { statusCode: 404, message: 'User not found' }
    }

    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      authProviders: user.authProviders
    }
  })

  // ========== 登出 ==========
  fastify.post('/api/auth/logout', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '')

    if (token) {
      // 删除会话
      await prisma.session.deleteMany({
        where: { token }
      })
    }

    return { success: true, message: 'Logged out successfully' }
  })

  // ========== 更新用户信息 ==========
  fastify.put('/api/auth/profile', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId
    const { displayName, avatar, email } = request.body

    // 检查邮箱是否被其他用户占用
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      })
      if (existingEmail) {
        return reply.code(400).send({ error: 'Email already in use' })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(avatar !== undefined && { avatar }),
        ...(email !== undefined && { email })
      }
    })

    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar
    }
  })

  // ========== 修改密码 ==========
  fastify.put('/api/auth/password', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId
    const { currentPassword, newPassword } = request.body

    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ error: 'Current and new password required' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || !user.passwordHash) {
      return reply.code(400).send({ error: 'Cannot change password for OAuth-only accounts' })
    }

    const validPassword = await verifyPassword(currentPassword, user.passwordHash)
    if (!validPassword) {
      return reply.code(401).send({ error: 'Current password is incorrect' })
    }

    const newPasswordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    })

    return { success: true, message: 'Password updated successfully' }
  })
}

// 认证中间件
async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' })
  }
}
