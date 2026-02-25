/**
 * Token 验证路由 - 供其他服务验证 Token
 */

export default async function tokenRoutes(fastify, prisma) {

  // ========== Token 验证接口（供其他服务调用）==========
  fastify.post('/api/token/verify', async (request, reply) => {
    const { token } = request.body

    if (!token) {
      return reply.code(400).send({ error: 'Token required' })
    }

    try {
      // 验证 JWT
      const decoded = fastify.jwt.verify(token)

      // 检查会话是否存在且未过期
      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              username: true,
              email: true,
              displayName: true,
              avatar: true
            }
          }
        }
      })

      if (!session) {
        return reply.code(401).send({ valid: false, error: 'Session expired or not found' })
      }

      return {
        valid: true,
        user: {
          ...session.user,
          userId: session.user.id // 兼容字段
        }
      }

    } catch (err) {
      return reply.code(401).send({ valid: false, error: 'Invalid token' })
    }
  })

  // ========== Token 刷新 ==========
  fastify.post('/api/token/refresh', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const oldToken = request.headers.authorization?.replace('Bearer ', '')
    const userId = request.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    // 生成新 token
    const newToken = fastify.jwt.sign({
      userId: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar
    })

    // 更新会话
    await prisma.session.updateMany({
      where: { token: oldToken },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return {
      token: newToken,
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

  // ========== 获取用户所有会话 ==========
  fastify.get('/api/token/sessions', {
    onRequest: [authenticate]
  }, async (request) => {
    const userId = request.user.userId
    const currentToken = request.headers.authorization?.replace('Bearer ', '')

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
        token: true
      }
    })

    return sessions.map(s => ({
      ...s,
      isCurrent: s.token === currentToken,
      token: undefined // 不返回完整 token
    }))
  })

  // ========== 撤销指定会话 ==========
  fastify.delete('/api/token/sessions/:sessionId', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { sessionId } = request.params
    const userId = request.user.userId
    const currentToken = request.headers.authorization?.replace('Bearer ', '')

    const session = await prisma.session.findFirst({
      where: {
        id: parseInt(sessionId),
        userId
      }
    })

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' })
    }

    // 不允许删除当前会话（应该用 logout）
    if (session.token === currentToken) {
      return reply.code(400).send({ error: 'Use /api/auth/logout to logout current session' })
    }

    await prisma.session.delete({
      where: { id: parseInt(sessionId) }
    })

    return { success: true }
  })

  // ========== 撤销所有其他会话 ==========
  fastify.post('/api/token/sessions/revoke-others', {
    onRequest: [authenticate]
  }, async (request) => {
    const userId = request.user.userId
    const currentToken = request.headers.authorization?.replace('Bearer ', '')

    const result = await prisma.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken }
      }
    })

    return { success: true, revokedCount: result.count }
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
