import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Dobrý den! 👋 Jsem AI asistent specializovaný na stroj **Barbieri XRot 95 EVO**.

Mohu vám pomoci s:
- 🔧 Servisními dotazy a intervaly
- 📖 Technickou dokumentací
- 🛰️ RTK navigací a kalibrací
- 📍 Informacemi o areálech
- ❓ Řešením problémů

Na co se chcete zeptat?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useAuth();
  const { machine } = useMachine();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Nepřihlášen. Prosím přihlaste se.');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          machineContext: machine ? {
            id: machine.id,
            model: machine.model,
            vyrobni_cislo: machine.vyrobni_cislo,
            aktualni_mth: machine.aktualni_mth,
            stav: machine.stav,
          } : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Příliš mnoho požadavků. Zkuste to později.');
        if (response.status === 402) throw new Error('Vyčerpány AI kredity. Kontaktujte administrátora.');
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Chyba AI (${response.status}): ${errorBody || 'Neznámá chyba'}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
          } catch {
            // Incomplete JSON
          }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${error instanceof Error ? error.message : 'Došlo k chybě při zpracování dotazu.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
      // Refocus input after send
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-1" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'justify-end'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input - fixed send button with larger touch target */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napište svůj dotaz..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            aria-label="Váš dotaz pro AI asistenta"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg transition-colors',
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Odeslat zprávu"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI asistent pro Barbieri XRot 95 EVO • Odpovědi založeny na technické dokumentaci
        </p>
      </div>
    </div>
  );
}
