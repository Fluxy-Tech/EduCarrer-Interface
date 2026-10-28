"use client"

import { Fragment, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquarePlus, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToastPersonalizado } from "@/components/toast";
import {
  AgentMessage,
  getAgentHistory,
  sendAgentMessage,
  startNewAgentHistory,
} from "@/app/services/agent.swr";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 2000;

// Formata **negrito** e `código`, que são o markdown mais comum nas respostas da IA
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="rounded bg-ink/5 px-1 py-0.5 text-[13px]">{part.slice(1, -1)}</code>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  )
}

function MessageBubble({ message }: { message: AgentMessage }) {
  return (
    <div className={cn("flex gap-3", message.isBot ? "justify-start" : "justify-end")}>
      {message.isBot && (
        <span className="grid place-items-center size-8 shrink-0 rounded-xl bg-ink text-gold">
          <Bot className="size-4" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
          message.isBot ? "rounded-tl-md bg-sky text-ink/90" : "rounded-tr-md bg-brand text-white"
        )}
      >
        <InlineText text={message.text} />
      </div>
    </div>
  )
}

export function AgentChat({ studyId, eyebrow, title, description, suggestions = [], className }: {
  studyId?: string
  eyebrow: string
  title: string
  description: string
  suggestions?: string[]
  className?: string
}) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Sempre continua a última conversa em andamento
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const res = await getAgentHistory(studyId);
        if (active) setMessages(res.history?.messages ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false };
  }, [studyId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (value: string) => {
    const message = value.trim();
    if (!message || sending) return;

    // Mostra a pergunta na hora, enquanto a IA responde
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, isBot: false, text: message, createdAt: new Date(), historyId: "" }]);
    setText("");
    setSending(true);

    try {
      const res = await sendAgentMessage(message, studyId);

      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), ...res.messages]);

      if (!res.status) ToastPersonalizado({ mensagem: res.message });
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(message);
      ToastPersonalizado({ mensagem: "Tivemos um erro inesperado ao enviar a mensagem." });
    } finally {
      setSending(false);
    }
  };

  // Encerra a conversa atual e começa um novo histórico
  const handleNewConversation = async () => {
    try {
      setResetting(true);
      const res = await startNewAgentHistory(studyId);

      if (!res.status) {
        ToastPersonalizado({ mensagem: res.message });
        return;
      }

      setMessages([]);
      setText("");
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Não conseguimos iniciar uma nova conversa." });
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className={cn("surface overflow-hidden flex flex-col", className)}>
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-ink text-gold">
            <Bot className="size-5" />
          </span>
          <div>
            <p className="eyebrow text-brand">{eyebrow}</p>
            <h2 className="mt-0.5 font-display text-3xl leading-tight text-ink">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          onClick={handleNewConversation}
          disabled={resetting || sending || messages.length === 0}
        >
          {resetting ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
          Nova conversa
        </Button>
      </div>

      <div ref={listRef} className="flex h-[420px] flex-col gap-4 overflow-y-auto p-6">
        {loading ? (
          <div className="m-auto">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Comece uma conversa. Algumas ideias:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="cursor-pointer rounded-full border border-input bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand/40 hover:bg-brand-soft/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {sending && (
              <div className="flex items-center gap-3">
                <span className="grid place-items-center size-8 shrink-0 rounded-xl bg-ink text-gold">
                  <Bot className="size-4" />
                </span>
                <span className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-sky px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Pensando...
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <form
        className="flex items-end gap-3 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(text);
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift + Enter quebra a linha
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(text);
            }
          }}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Digite sua pergunta..."
          disabled={loading}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/50"
        />
        <Button type="submit" variant="create" size="icon-lg" disabled={!text.trim() || sending || loading}>
          {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </form>
    </section>
  )
}
