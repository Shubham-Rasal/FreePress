import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

// Health check routes
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'freepress-backend'
  })
})

app.get('/health/ready', (c) => {
  // Add any readiness checks here (database, external services, etc.)
  const isReady = true // TODO: Add actual readiness checks
  
  if (isReady) {
    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } else {
    return c.json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    }, 503)
  }
})

app.get('/health/live', (c) => {
  // Liveness probe - basic check that the service is running
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  })
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const port = parseInt(process.env.PORT || '4000', 10)

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
