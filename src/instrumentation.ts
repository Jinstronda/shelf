export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initServerJsonLogging } = await import('@/lib/logger')
    initServerJsonLogging()
  }
}
