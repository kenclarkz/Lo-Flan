import type { Metadata } from 'next'
import { AdminLogin } from './login'

export const metadata: Metadata = {
  title: 'Admin Login',
}

export default function AdminPage() {
  return <AdminLogin />
}
