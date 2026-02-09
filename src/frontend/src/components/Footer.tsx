import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-brewers-navy/10 bg-brewers-navy/5">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            © 2025. Built with <Heart className="h-4 w-4 fill-brewers-gold text-brewers-gold" /> using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-brewers-navy hover:text-brewers-gold transition-colors hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
