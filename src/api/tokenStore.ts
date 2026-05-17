let _token: string | null = null
let _setter: ((t: string | null) => void) | null = null

export const tokenStore = {
  get: (): string | null => _token,
  set: (t: string | null) => {
    _token = t
    _setter?.(t)
  },
  register: (setter: (t: string | null) => void) => {
    _setter = setter
  },
}
