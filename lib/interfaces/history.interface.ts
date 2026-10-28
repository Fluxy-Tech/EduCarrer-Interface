// GET
export interface MessageDTO {
  id: string;
  isBot: boolean;
  text: string;
  createdAt: Date;
  historyId: string;
}

export interface HistoryDTO {
  id: string;
  createdAt: Date;
  finishAt: Date | null;
  stopConversation: boolean;
  userId: string;
  studyId: string | null;
  messages: MessageDTO[];
}

// POST
export interface CreateMessageDTO {
  historyId: string;
  isBot: boolean;
  text: string;
}

// Mensagem no formato que a OpenAI espera para manter o contexto da conversa
export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
}
