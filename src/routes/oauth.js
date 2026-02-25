import { generateAccessToken } from '../services/tokenService.js'

/**
 * OAuth 第三方登录路由 - GitHub/Google
 */

// 动态获取 GitHub OAuth 配置
function getGitHubConfig() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userApiUrl: 'https://api.github.com/user',
    emailApiUrl: 'https://api.github.com/user/emails'
  }
}

// 动态获取 Google OAuth 配置
function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userApiUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  }
}

export default async function oauthRoutes(fastify, prisma) {

  // ========== GitHub OAuth ==========

  // GitHub OAuth 授权入口 - 直接重定向到 GitHub
  fastify.get('/api/oauth/github', async (request, reply) => {
    const githubConfig = getGitHubConfig()

    if (!githubConfig.clientId) {
      return reply.code(503).send({ error: 'GitHub OAuth not configured' })
    }

    const { redirect_uri, state } = request.query

    // 存储自定义 redirect_uri 到 state 中
    const stateData = state || Buffer.from(JSON.stringify({ redirect_uri })).toString('base64')

    const params = new URLSearchParams({
      client_id: githubConfig.clientId,
      redirect_uri: `${request.protocol}://${request.hostname}/api/oauth/github/callback`,
      scope: 'read:user user:email',
      state: stateData
    })

    const authorizeUrl = `${githubConfig.authorizeUrl}?${params}`

    // 直接重定向到 GitHub 授权页面
    return reply.redirect(authorizeUrl)
  })

  // GitHub OAuth 回调
  fastify.get('/api/oauth/github/callback', async (request, reply) => {
    const githubConfig = getGitHubConfig()
    const { code, state } = request.query

    if (!code) {
      return reply.code(400).send({ error: 'Authorization code required' })
    }

    try {
      // 1. 用 code 换取 access token
      const tokenResponse = await fetch(githubConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: githubConfig.clientId,
          client_secret: githubConfig.clientSecret,
          code,
          redirect_uri: `${request.protocol}://${request.hostname}/api/oauth/github/callback`
        })
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error)
      }

      const githubAccessToken = tokenData.access_token

      // 2. 获取 GitHub 用户信息
      const userResponse = await fetch(githubConfig.userApiUrl, {
        headers: {
          'Authorization': `Bearer ${githubAccessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      const githubUser = await userResponse.json()

      if (!githubUser.id) {
        throw new Error('Failed to get GitHub user info')
      }

      // 3. 获取用户邮箱（如果公开邮箱不可用）
      let email = githubUser.email
      if (!email) {
        const emailResponse = await fetch(githubConfig.emailApiUrl, {
          headers: {
            'Authorization': `Bearer ${githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        const emails = await emailResponse.json()
        const primaryEmail = emails.find(e => e.primary && e.verified)
        if (primaryEmail) {
          email = primaryEmail.email
        }
      }

      // 4. 查找或创建用户
      let user = await findOrCreateUserFromOAuth(prisma, {
        provider: 'github',
        providerId: String(githubUser.id),
        profileData: {
          username: githubUser.login,
          displayName: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          email
        }
      })

      // 5. 生成 SSO token
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

      // 6. 解析 state 获取 redirect_uri
      let redirectUri = null
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
          redirectUri = stateData.redirect_uri
        } catch (e) {
          // state 可能是简单字符串
        }
      }

      // 7. 重定向回应用或返回 token
      if (redirectUri) {
        const redirectUrl = new URL(redirectUri)
        redirectUrl.searchParams.set('token', token)
        redirectUrl.searchParams.set('user', JSON.stringify({
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        }))
        return reply.redirect(redirectUrl.toString())
      }

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

    } catch (error) {
      fastify.log.error('GitHub OAuth error:', error)
      return reply.code(500).send({ error: 'OAuth authentication failed', message: error.message })
    }
  })

  // ========== Google OAuth ==========

  // Google OAuth 授权入口 - 直接重定向到 Google
  fastify.get('/api/oauth/google', async (request, reply) => {
    const googleConfig = getGoogleConfig()

    if (!googleConfig.clientId) {
      return reply.code(503).send({ error: 'Google OAuth not configured' })
    }

    const { redirect_uri, state } = request.query

    // 存储自定义 redirect_uri 到 state 中
    const stateData = state || Buffer.from(JSON.stringify({ redirect_uri })).toString('base64')

    const params = new URLSearchParams({
      client_id: googleConfig.clientId,
      redirect_uri: `${request.protocol}://${request.hostname}/api/oauth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state: stateData,
      access_type: 'offline'
    })

    const authorizeUrl = `${googleConfig.authorizeUrl}?${params}`

    // 直接重定向到 Google 授权页面
    return reply.redirect(authorizeUrl)
  })

  // Google OAuth 回调
  fastify.get('/api/oauth/google/callback', async (request, reply) => {
    const googleConfig = getGoogleConfig()
    const { code, state } = request.query

    if (!code) {
      return reply.code(400).send({ error: 'Authorization code required' })
    }

    try {
      // 1. 用 code 换取 access token
      const tokenResponse = await fetch(googleConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: googleConfig.clientId,
          client_secret: googleConfig.clientSecret,
          code,
          redirect_uri: `${request.protocol}://${request.hostname}/api/oauth/google/callback`,
          grant_type: 'authorization_code'
        })
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error)
      }

      const googleAccessToken = tokenData.access_token

      // 2. 获取 Google 用户信息
      const userResponse = await fetch(googleConfig.userApiUrl, {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`
        }
      })

      const googleUser = await userResponse.json()

      if (!googleUser.id) {
        throw new Error('Failed to get Google user info')
      }

      // 3. 查找或创建用户
      let user = await findOrCreateUserFromOAuth(prisma, {
        provider: 'google',
        providerId: googleUser.id,
        profileData: {
          username: null,
          displayName: googleUser.name,
          avatar: googleUser.picture,
          email: googleUser.email
        }
      })

      // 4. 生成 SSO token
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

      // 5. 解析 state 获取 redirect_uri
      let redirectUri = null
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
          redirectUri = stateData.redirect_uri
        } catch (e) {
          // state 可能是简单字符串
        }
      }

      // 6. 重定向回应用或返回 token
      if (redirectUri) {
        const redirectUrl = new URL(redirectUri)
        redirectUrl.searchParams.set('token', token)
        redirectUrl.searchParams.set('user', JSON.stringify({
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        }))
        return reply.redirect(redirectUrl.toString())
      }

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

    } catch (error) {
      fastify.log.error('Google OAuth error:', error)
      return reply.code(500).send({ error: 'OAuth authentication failed', message: error.message })
    }
  })

  // ========== 绑定第三方账号 ==========
  fastify.post('/api/oauth/bind/:provider', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { provider } = request.params
    const userId = request.user.userId

    if (!['github', 'google'].includes(provider)) {
      return reply.code(400).send({ error: 'Unsupported provider' })
    }

    const config = provider === 'github' ? getGitHubConfig() : getGoogleConfig()

    if (!config.clientId) {
      return reply.code(503).send({ error: `${provider} OAuth not configured` })
    }

    const stateData = Buffer.from(JSON.stringify({
      action: 'bind',
      userId
    })).toString('base64')

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `${request.protocol}://${request.hostname}/api/oauth/${provider}/bind/callback`,
      scope: provider === 'github' ? 'read:user user:email' : 'openid email profile',
      state: stateData,
      ...(provider === 'google' && { response_type: 'code', access_type: 'offline' })
    })

    const authorizeUrl = `${config.authorizeUrl}?${params}`

    return { authorizeUrl }
  })

  // 解绑第三方账号
  fastify.delete('/api/oauth/unbind/:provider', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { provider } = request.params
    const userId = request.user.userId

    const result = await prisma.authProvider.deleteMany({
      where: {
        userId,
        provider
      }
    })

    return { success: true, deleted: result.count }
  })
}

// 查找或创建 OAuth 用户
async function findOrCreateUserFromOAuth(prisma, { provider, providerId, profileData }) {
  // 1. 查找已绑定的用户
  const existingProvider = await prisma.authProvider.findUnique({
    where: {
      provider_providerId: {
        provider,
        providerId
      }
    },
    include: { user: true }
  })

  if (existingProvider) {
    await prisma.authProvider.update({
      where: { id: existingProvider.id },
      data: { profileData: JSON.stringify(profileData) }
    })
    return existingProvider.user
  }

  // 2. 查找相同邮箱的用户
  let user = null
  if (profileData.email) {
    user = await prisma.user.findUnique({
      where: { email: profileData.email }
    })

    if (user) {
      await prisma.authProvider.create({
        data: {
          userId: user.id,
          provider,
          providerId,
          profileData: JSON.stringify(profileData)
        }
      })
      return user
    }
  }

  // 3. 创建新用户
  let username = profileData.username
  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      username = `${username}_${Date.now().toString(36)}`
    }
  } else {
    username = `${provider}_${providerId.substring(0, 8)}`
  }

  user = await prisma.user.create({
    data: {
      username,
      email: profileData.email,
      displayName: profileData.displayName || username,
      avatar: profileData.avatar,
      authProviders: {
        create: {
          provider,
          providerId,
          profileData: JSON.stringify(profileData)
        }
      }
    }
  })

  return user
}

// 认证中间件
async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' })
  }
}
