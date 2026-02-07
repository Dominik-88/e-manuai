# Contributing Guidelines - e-ManuAI

Děkujeme za váš zájem přispět do projektu e-ManuAI! Tento dokument obsahuje pravidla a best practices pro vývoj.

## 🎯 Základní principy

### Design Philosophy
1. **Mobile-first**: Vždy začínejte návrhem pro mobil
2. **Accessibility-first**: WCAG AA compliance je povinná
3. **Performance-first**: Optimalizace je priorita
4. **User-first**: UX má přednost před technologií

### Code Quality
- **TypeScript strict mode**: Vždy používejte typy
- **ESLint**: Dodržujte pravidla linteru
- **Prettier**: Konzistentní formátování
- **Comments**: Vysvětlující komentáře pro složitou logiku

## 📱 Mobile & Touch Guidelines

### Touch Targets
```tsx
// ✅ SPRÁVNĚ - minimálně 44x44px
<button className="min-h-[44px] min-w-[44px]">
  <Icon className="h-5 w-5" />
</button>

// ❌ ŠPATNĚ - příliš malé
<button className="h-8 w-8">
  <Icon className="h-4 w-4" />
</button>
```

### Safe Area
```tsx
// ✅ SPRÁVNĚ - respektuje notch
<nav style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>

// ❌ ŠPATNĚ - ignoruje safe area
<nav className="pb-4">
```

### iOS Input Zoom Prevention
```css
/* ✅ SPRÁVNĚ - font-size >= 16px */
input {
  font-size: max(16px, 1em);
}

/* ❌ ŠPATNĚ - způsobí zoom na iOS */
input {
  font-size: 14px;
}
```

## ♿ Accessibility Guidelines

### ARIA Labels
```tsx
// ✅ SPRÁVNĚ - má aria-label
<button aria-label="Zavřít dialog">
  <X className="h-4 w-4" />
</button>

// ❌ ŠPATNĚ - chybí aria-label
<button>
  <X className="h-4 w-4" />
</button>
```

### Semantic HTML
```tsx
// ✅ SPRÁVNĚ - semantic elements
<nav role="navigation" aria-label="Hlavní navigace">
  <header>
    <h1>Nadpis</h1>
  </header>
  <main role="main">
    <section aria-labelledby="section-heading">
      <h2 id="section-heading">Sekce</h2>
    </section>
  </main>
</nav>

// ❌ ŠPATNĚ - div soup
<div>
  <div>
    <div>Nadpis</div>
  </div>
  <div>
    <div>
      <div>Sekce</div>
    </div>
  </div>
</div>
```

### Focus Management
```tsx
// ✅ SPRÁVNĚ - viditelný focus
<button className="focus-visible:outline-2 focus-visible:outline-ring">

// ❌ ŠPATNĚ - skrytý focus
<button className="outline-none">
```

## 🎨 Design System

### Barvy
```tsx
// ✅ SPRÁVNĚ - používejte CSS variables
<div className="bg-primary text-primary-foreground">

// ❌ ŠPATNĚ - hardcoded barvy
<div style={{ backgroundColor: '#3d7acc', color: '#fff' }}>
```

### Spacing
```tsx
// ✅ SPRÁVNĚ - Tailwind spacing scale
<div className="space-y-4 p-4">

// ❌ ŠPATNĚ - custom spacing
<div style={{ gap: '17px', padding: '13px' }}>
```

### Typography
```tsx
// ✅ SPRÁVNĚ - semantic classes
<h1 className="text-2xl font-bold">
<p className="text-sm text-muted-foreground">
<code className="font-mono text-xs">

// ❌ ŠPATNĚ - inline styles
<div style={{ fontSize: '24px', fontWeight: 700 }}>
```

## 🔧 Component Guidelines

### Props Interface
```tsx
// ✅ SPRÁVNĚ - typed props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  'aria-label'?: string;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // ...
}
```

### Loading States
```tsx
// ✅ SPRÁVNĚ - shimmer loading
{isLoading ? (
  <div className="shimmer h-24 rounded-xl" role="status" aria-label="Načítání">
    <span className="sr-only">Načítání...</span>
  </div>
) : (
  <Content />
)}

// ❌ ŠPATNĚ - žádný loading state
{data && <Content />}
```

### Error Handling
```tsx
// ✅ SPRÁVNĚ - graceful error handling
{error ? (
  <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
    <p className="text-sm text-destructive">{error.message}</p>
  </div>
) : (
  <Content />
)}

// ❌ ŠPATNĚ - žádné error handling
<Content />
```

## 📊 Performance Guidelines

### Lazy Loading
```tsx
// ✅ SPRÁVNĚ - lazy load routes
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

// ❌ ŠPATNĚ - eager loading
import DashboardPage from '@/pages/DashboardPage';
```

### Memoization
```tsx
// ✅ SPRÁVNĚ - memoize expensive computations
const filteredData = useMemo(() => 
  data.filter(item => item.active), 
  [data]
);

// ❌ ŠPATNĚ - compute on every render
const filteredData = data.filter(item => item.active);
```

### Debouncing
```tsx
// ✅ SPRÁVNĚ - debounce search
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useMemo(
  () => debounce((value: string) => performSearch(value), 300),
  []
);

// ❌ ŠPATNĚ - search on every keystroke
onChange={(e) => performSearch(e.target.value)}
```

## 🧪 Testing Guidelines

### Unit Tests
```tsx
// ✅ SPRÁVNĚ - test user behavior
test('should submit form when button is clicked', async () => {
  render(<Form />);
  const button = screen.getByRole('button', { name: /odeslat/i });
  await userEvent.click(button);
  expect(mockSubmit).toHaveBeenCalled();
});

// ❌ ŠPATNĚ - test implementation details
test('should call handleSubmit', () => {
  const { result } = renderHook(() => useForm());
  result.current.handleSubmit();
  expect(mockSubmit).toHaveBeenCalled();
});
```

## 📝 Commit Guidelines

### Commit Messages
```bash
# ✅ SPRÁVNĚ - conventional commits
feat: přidání exportu do CSV
fix: oprava RTK připojení
docs: aktualizace README
style: formátování kódu
refactor: zjednodušení komponenty
perf: optimalizace načítání dat
test: přidání testů pro Dashboard

# ❌ ŠPATNĚ - vague messages
update
fix bug
changes
wip
```

### Commit Structure
```bash
# Format:
<type>: <subject>

<body>

<footer>

# Příklad:
feat: přidání exportu servisních záznamů do CSV

- Implementace CSV exportu
- Přidání tlačítka do UI
- Testy pro export funkci

Closes #123
```

## 🔍 Code Review Checklist

### Před odesláním PR
- [ ] Kód prošel linterem bez chyb
- [ ] Všechny testy procházejí
- [ ] Přidány testy pro novou funkcionalitu
- [ ] Dokumentace aktualizována
- [ ] Accessibility zkontrolována
- [ ] Mobile responsiveness otestována
- [ ] Performance impact vyhodnocen
- [ ] Breaking changes zdokumentovány

### Co kontrolovat v PR
- [ ] Čitelnost kódu
- [ ] Type safety
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility
- [ ] Performance
- [ ] Security
- [ ] Tests coverage

## 🚀 Deployment Checklist

### Před nasazením
- [ ] Build prochází bez chyb
- [ ] Všechny testy zelené
- [ ] Lighthouse score > 90
- [ ] Accessibility audit prošel
- [ ] Mobile testing dokončen
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Security audit

## 📚 Užitečné odkazy

### Dokumentace
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/docs)

### Accessibility
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Mobile
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io/)

## 💬 Komunikace

### Otázky a diskuze
- GitHub Issues pro bug reporty
- GitHub Discussions pro obecné otázky
- Pull Requests pro code review

### Response Time
- Bug reports: 24-48 hodin
- Feature requests: 1 týden
- Pull requests: 2-3 dny

---

**Děkujeme za váš příspěvek! 🙏**
