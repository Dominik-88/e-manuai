import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Satellite, Wrench, HelpCircle, Navigation, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

const STORAGE_KEY = 'emanuai-chat-history';
const DEFAULT_MESSAGE: Message = {
  role: 'assistant',
  content: `Dobrý den! 👋 Jsem AI asistent specializovaný na stroj **Barbieri XRot 95 EVO**.

Mohu vám pomoci s:
- 🔧 Servisními dotazy a intervaly
- 📖 Technickou dokumentací
- 🛰️ RTK navigací a kalibrací
- 📍 Informacemi o areálech
- ❓ Řešením problémů

Na co se chcete zeptat?`,
  timestamp: Date.now(),
};

const quickPrompts = [
  { icon: Wrench, label: 'Kdy je další servis?', message: 'Kdy je naplánován další servis a co bude potřeba udělat?' },
  { icon: Satellite, label: 'RTK nastavení', message: 'Jak správně nastavit RTK připojení přes CZEPOS?' },
  { icon: Navigation, label: 'S-Mode režimy', message: 'Jaké jsou dostupné S-Mode režimy a kdy který použít?' },
  { icon: HelpCircle, label: 'Robot nejede rovně', message: 'Robot nejede rovně, jak to opravit? Jaké jsou možné příčiny?' },
  { icon: Zap, label: 'Výměna oleje', message: 'Jak provést výměnu oleje? Jaký olej a kolik?' },
];

function renderMarkdown(text: string) {
  // Simple markdown: **bold**, *italic*, `code`, lists
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed: React.ReactNode = line;

    // Bold
    if (typeof processed === 'string') {
      const parts = processed.split(/\*\*(.*?)\*\*/g);
      if (parts.length > 1) {
        processed = parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p);
      }
    }

    // Code inline
    if (typeof processed === 'string') {
      const parts = processed.split(/`([^`]+)`/g);
      if (parts.length > 1) {
        processed = parts.map((p, j) => j % 2 === 1 ? <code key={j} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{p}</code> : p);
      }
    }

    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return <div key={i} className="flex gap-2 pl-2"><span className="text-muted-foreground">•</span><span>{typeof processed === 'string' ? processed.replace(/^[-•]\s*/, '') : processed}</span></div>;
    }

    if (!trimmed) return <div key={i} className="h-1.5" />;

    return <div key={i}>{processed}</div>;
  });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useAuth();
  const { machine } = useMachine();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Nepřihlášen.');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          machineContext: machine ? {
            id: machine.id, model: machine.model,
            vyrobni_cislo: machine.vyrobni_cislo,
            aktualni_mth: machine.aktualni_mth, stav: machine.stav,
          } : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Příliš mnoho požadavků.');
        if (response.status === 402) throw new Error('Vyčerpány AI kredity.');
        throw new Error(`Chyba AI (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now() }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${error instanceof Error ? error.message : 'Chyba při zpracování.'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([DEFAULT_MESSAGE]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Asistent</h1>
            {machine && (
              <p className="text-[11px] text-muted-foreground font-mono">
                {machine.vyrobni_cislo} • {machine.aktualni_mth} mth
              </p>
            )}
          </div>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-destructive transition-colors" aria-label="Vymazat chat">
            <Trash2 className="h-3.5 w-3.5" />
            Smazat
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-1" ref={scrollRef}>
        <div className="space-y-3 py-2">
          {messages.map((message, index) => (
            <div key={index} className={cn('flex gap-2.5', message.role === 'user' && 'justify-end')}>
              {message.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn('max-w-[85%] space-y-1')}>
                <div className={cn(
                  'rounded-2xl px-3.5 py-2.5',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted/80 border border-border rounded-tl-sm'
                )}>
                  <div className="text-sm leading-relaxed">
                    {renderMarkdown(message.content)}
                  </div>
                </div>
                {message.timestamp && (
                  <p className={cn('text-[10px] text-muted-foreground/60 px-1', message.role === 'user' && 'text-right')}>
                    {formatTime(message.timestamp)}
                  </p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted/80 border border-border px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick prompts - show only at start */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qp.message)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-muted hover:border-primary/30"
            >
              <qp.icon className="h-3.5 w-3.5 text-primary" />
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napište svůj dotaz..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={isLoading}
            aria-label="Váš dotaz pro AI asistenta"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all',
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground active:scale-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Odeslat zprávu"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
          AI asistent • Barbieri XRot 95 EVO
        </p>
      </div>
    </div>
  );
}
