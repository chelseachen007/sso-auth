import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

/**
 * Token 服务 - JWT 生成与验证
 */

// 从 JWT payload 中提取用户信息
export function extractUserFromToken(token, fastify) {
  try {
    const decoded = fastify.jwt.verify(token)
    return decoded
  } catch (err) {
    return null
  }
}

// 生成访问 Token
export function generateAccessToken(fastify, user) {
  return fastify.jwt.sign({
    userId: user.id,
    uuid: user.uuid,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar
  })
}

// 验证密码
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// 哈希密码
export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

// 生成 Client ID
export function generateClientId() {
  return `client_${uuidv4().replace(/-/g, '')}`
}

// 生成 Client Secret
export function generateClientSecret() {
  return `secret_${uuidv4().replace(/-/g, '')}_${Date.now().toString(36)}`
}
