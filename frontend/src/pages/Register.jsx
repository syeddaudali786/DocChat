import AuthForm from '../components/AuthForm'
import AuthLayout from '../components/AuthLayout'

export default function Register() {
  return (
    <AuthLayout>
      <AuthForm mode="register" />
    </AuthLayout>
  )
}
