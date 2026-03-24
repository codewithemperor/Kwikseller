import { LoginPage as LoginPageComponent, PortalConfig } from '@/components/auth';

const marketplacePortal: PortalConfig = {
  name: 'KWIKSELLER',
  description: 'Sign in to your account to continue shopping',
  themeColor: 'blue',
  redirectPath: '/',
  showRegisterLink: true,
  registerPath: '/register',
};

export default function LoginPage() {
  return <LoginPageComponent portal={marketplacePortal} />;
}
