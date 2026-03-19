"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type ClaimChatProps = {
  readonly claimId: string;
  readonly claimNumber: string;
};

const SUGGESTED_QUESTIONS = [
  "Why was this claim denied?",
  "Is this billed amount normal for this procedure?",
  "What are the appeal options?",
  "Explain the charges breakdown",
  "Is this provider in-network?",
] as const;

export function ClaimChat({ claimId, claimNumber }: ClaimChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/ai/chat",
      body: { claimId },
    }),
  });

  const isStreaming = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const handleSuggestion = (question: string) => {
    sendMessage({ text: question });
  };

  return (
    <Card className="border-purple-200 dark:border-purple-700">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Ask About This Claim
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Suggested questions about {claimNumber}:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestion(q)}
                    disabled={isStreaming}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div
              ref={scrollRef}
              className="max-h-80 overflow-y-auto space-y-3 rounded-lg border p-3 bg-muted/30"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white dark:bg-purple-500"
                        : "bg-background border"
                    }`}
                  >
                    {msg.parts
                      .filter((p): p is { type: "text"; text: string } => p.type === "text")
                      .map((part, i) => (
                        <span key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
              {isStreaming && messages.at(-1)?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-background border rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this claim..."
              disabled={isStreaming}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isStreaming || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
