import { ReactNode } from 'react';
import { useIsCallerAdmin } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogIn } from 'lucide-react';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { identity, login, loginStatus, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Show loading state while checking authentication or admin status
  if (isInitializing || isCheckingAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brewers-navy mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md px-4">
          <LogIn className="h-16 w-16 text-brewers-navy mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brewers-navy mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please log in to access this page.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="bg-brewers-gold hover:bg-brewers-gold/90 text-brewers-navy"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md px-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brewers-navy mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access this page. Admin privileges are required.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
}
