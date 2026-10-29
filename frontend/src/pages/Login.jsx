import AuthForm from '../components/AuthForm'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  return (
    <AuthLayout>
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
