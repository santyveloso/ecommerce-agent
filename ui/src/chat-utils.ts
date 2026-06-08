import type { Message, ChatSession } from './types'

/**
 * Processa comandos slash (/clear, /help).
 * Retorna true se foi um comando processado, false caso contrário.
 */
export function processSlashCommand(
  msg: string,
  activeSessionId: string,
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  setChatInputValue: React.Dispatch<React.SetStateAction<string>>,
): boolean {
  if (msg === '/clear') {
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [] } : s
    ))
    setChatInputValue('')
    return true
  }

  if (msg === '/help') {
    const helpMsg: Message = {
      role: 'assistant',
      content: '### Comandos Disponiveis\n\n- `/clear` — Limpa a conversa atual\n- `/help` — Mostra esta ajuda\n\nTambem podes usar `@` para mencionar imagens do Creative Studio.',
      timestamp: new Date().toISOString(),
    }
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [...s.messages, helpMsg] } : s
    ))
    setChatInputValue('')
    return true
  }

  return false
}

/**
 * Cria uma mensagem de user.
 */
export function createUserMessage(content: string): Message {
  return {
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Cria uma mensagem de assistant vazia (placeholder para streaming).
 */
export function createAssistantMessage(): Message {
  return {
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Determina se deve fazer auto-title da sessão.
 */
export function shouldAutoTitle(session: ChatSession): boolean {
  return session.messages.length === 0 && session.title === 'Nova Conversa'
}

/**
 * Extrai o título da conversa a partir da primeira mensagem.
 */
export function deriveTitle(msg: string): string {
  return msg.slice(0, 50) + (msg.length > 50 ? '...' : '')
}

/**
 * Constrói o array de mensagens para enviar à API (limpa campos não-seriais).
 */
export function buildConversationContext(
  messages: Message[],
  newMessage: string,
): Array<{ role: string; content: string }> {
  const ctx = messages
    .filter(m => m.content)
    .map(m => ({ role: m.role, content: m.content }))
  ctx.push({ role: 'user', content: newMessage })
  return ctx
}

/**
 * Converte as mensagens de uma sessão em contexto de conversa (trunca a partir de um índice).
 */
export function buildConversationContextFromIndex(
  messages: Message[],
  upToIndex: number,
  newContent?: string,
): Array<{ role: string; content: string }> {
  const truncated = messages.slice(0, upToIndex)
  const ctx = truncated
    .filter(m => m.content)
    .map(m => ({ role: m.role, content: m.content }))
  if (newContent !== undefined) {
    ctx.push({ role: 'user', content: newContent })
  }
  return ctx
}
