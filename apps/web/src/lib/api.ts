import type { ApiResponse } from '@kitchensync/shared'


const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const options: RequestInit = { 
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, options)
    const json: ApiResponse<T> = await res.json()
    return json
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export function get<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>('GET', path)
}

export function post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>('POST', path, body)
}

export function put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>('PUT', path, body)
}

export function patch<T>(
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return request<T>('PATCH', path, body)
}

export function del<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>('DELETE', path)
}
