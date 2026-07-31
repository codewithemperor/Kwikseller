import { LoginPage as LoginPageComponent } from '@/components/auth';
import { MARKETPLACE_LOGIN_PORTAL as marketplacePortal } from '@/constants/auth';

export default function LoginPage() {
  return <LoginPageComponent portal={marketplacePortal} />;
}
