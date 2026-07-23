import { describe, expect, it } from 'vitest'
import { buildApiUrl } from './devProxy'

describe('buildApiUrl', () => {
  it('uses the same-origin proxy prefix when API proxy is enabled', () => {
    const result = buildApiUrl('http://api.example.com/v1', 'images/edits', null, true)
    expect(result.url).toBe('/api-proxy/images/edits')
    expect(result.proxyTarget).toBe('http://api.example.com/v1')
  })

  it('leaves API versioning to the proxy target when proxying', () => {
    const result = buildApiUrl('http://api.example.com', 'images/generations', null, true)
    expect(result.url).toBe('/api-proxy/images/generations')
    expect(result.proxyTarget).toBe('http://api.example.com')
  })

  it('uses a configured proxy prefix when one is available', () => {
    const result = buildApiUrl(
      'http://api.example.com/v1',
      'responses',
      {
        enabled: true,
        prefix: '/openai-proxy',
        target: 'http://api.example.com/v1',
        changeOrigin: true,
        secure: false,
      },
      true,
    )
    expect(result.url).toBe('/openai-proxy/responses')
    expect(result.proxyTarget).toBe('http://api.example.com/v1')
  })

  it('uses the configured API URL directly when API proxy is disabled', () => {
    const result = buildApiUrl('http://api.example.com/v1', 'responses', null, false)
    expect(result.url).toBe('http://api.example.com/v1/responses')
    expect(result.proxyTarget).toBeUndefined()
  })
})
