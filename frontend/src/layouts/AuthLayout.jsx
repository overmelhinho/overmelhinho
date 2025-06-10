import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <>
      {/* Layout de cabeçalho/menu aqui se quiser */}
      <Outlet />
    </>
  )
}
