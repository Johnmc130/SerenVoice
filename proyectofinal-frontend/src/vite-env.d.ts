/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  // más variables de entorno...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
