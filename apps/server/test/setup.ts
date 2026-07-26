export default function setup() {
  process.env.DATABASE_URL = "postgres://localhost:5432/yopem_test"
  process.env.AUTH_ISSUER = "https://auth.example.com"
  process.env.REDIS_URL = "redis://localhost:6379"
  process.env.REDIS_KEY_PREFIX = "test:"
}
