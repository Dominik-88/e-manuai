import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vyplňte email a heslo');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Nesprávný email nebo heslo');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email nebyl potvrzen. Zkontrolujte svou emailovou schránku.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Přihlášení úspěšné');
        navigate('/');
      }
    } catch (err) {
      toast.error('Došlo k chybě při přihlášení');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md steel-frame">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
            <span className="font-mono text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <CardTitle className="text-2xl">e-ManuAI</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">by Dominik Schmied</p>
          <CardDescription>
            Přihlaste se pro přístup k aplikaci
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.cz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 pr-10"
                />
                <button
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full touch-target"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Přihlásit se
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Nemáte účet? </span>
            <Link to="/registrace" className="text-primary hover:underline">
              Zaregistrujte se
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
