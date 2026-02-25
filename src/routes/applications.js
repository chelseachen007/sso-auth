import { generateClientId, generateClientSecret } from '../services/tokenService.js'

/**
 * 应用管理路由 - 注册/管理接入 SSO 的应用
 */

export default async function appRoutes(fastify, prisma) {

  // ========== 注册新应用 ==========
  fastify.post('/api/applications', async (request, reply) => {
    const { name, redirectUris } = request.body

    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return reply.code(400).send({ error: 'Name and redirectUris (array) required' })
    }

    const clientId = generateClientId()
    const clientSecret = generateClientSecret()

    const application = await prisma.application.create({
      data: {
        name,
        clientId,
        clientSecret,
        redirectUris: JSON.stringify(redirectUris)
      }
    })

    return {
      id: application.id,
      name: application.name,
      clientId: application.clientId,
      clientSecret: application.clientSecret, // 只在创建时返回一次
      redirectUris: JSON.parse(application.redirectUris),
      isActive: application.isActive,
      createdAt: application.createdAt
    }
  })

  // ========== 获取所有应用 ==========
  fastify.get('/api/applications', async (request) => {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return applications.map(app => ({
      id: app.id,
      name: app.name,
      clientId: app.clientId,
      redirectUris: JSON.parse(app.redirectUris),
      isActive: app.isActive,
      createdAt: app.createdAt
    }))
  })

  // ========== 获取单个应用 ==========
  fastify.get('/api/applications/:id', async (request, reply) => {
    const { id } = request.params

    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) }
    })

    if (!application) {
      return reply.code(404).send({ error: 'Application not found' })
    }

    return {
      id: application.id,
      name: application.name,
      clientId: application.clientId,
      redirectUris: JSON.parse(application.redirectUris),
      isActive: application.isActive,
      createdAt: application.createdAt
    }
  })

  // ========== 更新应用 ==========
  fastify.put('/api/applications/:id', async (request, reply) => {
    const { id } = request.params
    const { name, redirectUris, isActive } = request.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (redirectUris !== undefined) updateData.redirectUris = JSON.stringify(redirectUris)
    if (isActive !== undefined) updateData.isActive = isActive

    const application = await prisma.application.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return {
      id: application.id,
      name: application.name,
      clientId: application.clientId,
      redirectUris: JSON.parse(application.redirectUris),
      isActive: application.isActive,
      createdAt: application.createdAt
    }
  })

  // ========== 重新生成 Client Secret ==========
  fastify.post('/api/applications/:id/regenerate-secret', async (request, reply) => {
    const { id } = request.params

    const newSecret = generateClientSecret()

    const application = await prisma.application.update({
      where: { id: parseInt(id) },
      data: { clientSecret: newSecret }
    })

    return {
      id: application.id,
      name: application.name,
      clientSecret: newSecret // 只返回一次
    }
  })

  // ========== 删除应用 ==========
  fastify.delete('/api/applications/:id', async (request, reply) => {
    const { id } = request.params

    await prisma.application.delete({
      where: { id: parseInt(id) }
    })

    return { success: true }
  })

  // ========== 验证应用（内部使用）==========
  fastify.post('/api/applications/validate', async (request, reply) => {
    const { clientId, clientSecret, redirectUri } = request.body

    const application = await prisma.application.findUnique({
      where: { clientId }
    })

    if (!application) {
      return reply.code(404).send({ valid: false, error: 'Application not found' })
    }

    if (!application.isActive) {
      return reply.code(403).send({ valid: false, error: 'Application is disabled' })
    }

    if (application.clientSecret !== clientSecret) {
      return reply.code(401).send({ valid: false, error: 'Invalid client secret' })
    }

    const redirectUris = JSON.parse(application.redirectUris)
    if (redirectUri && !redirectUris.includes(redirectUri)) {
      return reply.code(400).send({ valid: false, error: 'Redirect URI not allowed' })
    }

    return {
      valid: true,
      application: {
        id: application.id,
        name: application.name
      }
    }
  })
}
