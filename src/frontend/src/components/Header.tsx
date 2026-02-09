import { Link, useNavigate } from '@tanstack/react-router';
import { Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsCallerAdmin } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { identity, clear, login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brewers-navy/10 bg-brewers-navy shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img 
            src="/assets/generated/brewers-logo-transparent.dim_200x200.png" 
            alt="Milwaukee Brewers" 
            className="h-10 w-10"
          />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-brewers-gold">Brewers Card Catalog</h1>
            <Package className="h-5 w-5 text-brewers-gold" />
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/import">
              <Button
                variant="outline"
                size="sm"
                className="border-brewers-gold text-brewers-gold hover:bg-brewers-gold hover:text-brewers-navy"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Cards
              </Button>
            </Link>
          )}
          <Button
            onClick={handleAuth}
            disabled={disabled}
            size="sm"
            className={
              isAuthenticated
                ? 'bg-brewers-gold/20 hover:bg-brewers-gold/30 text-brewers-gold border border-brewers-gold'
                : 'bg-brewers-gold hover:bg-brewers-gold/90 text-brewers-navy'
            }
          >
            {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
    </header>
  );
}
