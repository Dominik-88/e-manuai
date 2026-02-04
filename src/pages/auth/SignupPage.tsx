import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vyplňte email a heslo');
      return;
    }

    if (password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Hesla se neshodují');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Tento email je již zaregistrován');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Registrace úspěšná! Zkontrolujte svůj email pro potvrzení účtu.');
        navigate('/prihlaseni');
      }
    } catch (err) {
      toast.error('Došlo k chybě při registraci');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md steel-frame">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
            <span className="font-mono text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <CardTitle className="text-2xl">Vytvořit účet</CardTitle>
          <CardDescription>
            Zaregistrujte se pro přístup k aplikaci
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Jméno a příjmení</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jan Novák"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="h-12"
              />
            </div>

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
                  autoComplete="new-password"
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-12"
              />
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
                  <UserPlus className="mr-2 h-5 w-5" />
                  Zaregistrovat se
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Máte již účet? </span>
            <Link to="/prihlaseni" className="text-primary hover:underline">
              Přihlaste se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
