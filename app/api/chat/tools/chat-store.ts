import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Chat {
  id: string;
  userId?: string;
  messages: Message[];
}

// Diretório para armazenar os arquivos de chat
const CHATS_DIR = path.join(process.cwd(), '.chats');

// Função para garantir que o diretório de chats exista
async function ensureChatsDir() {
  if (!existsSync(CHATS_DIR)) {
    await fs.mkdir(CHATS_DIR, { recursive: true });
  }
}

// Função para obter o caminho do arquivo de um chat específico
export function getChatFile(chatId: string): string {
  return path.join(CHATS_DIR, `${chatId}.json`);
}

// Função para criar um novo chat
export async function createChat(userId?: string): Promise<string> {
  await ensureChatsDir();
  const chatId = uuidv4();
  const chat: Chat = {
    id: chatId,
    userId: userId || '',
    messages: []
  };
  await fs.writeFile(getChatFile(chatId), JSON.stringify(chat));
  return chatId;
}

export async function saveMessage(chatId: string, message: Message): Promise<void> {
  await ensureChatsDir();
  const chatFile = getChatFile(chatId);
  const chat = await loadChat(chatId) || { id: chatId, messages: [] };
  chat.messages.push(message);
  await fs.writeFile(chatFile, JSON.stringify(chat));
}

export async function loadChat(chatId: string): Promise<Chat | null> {
  await ensureChatsDir();
  const chatFile = getChatFile(chatId);
  if (!existsSync(chatFile)) return null;
  const data = await fs.readFile(chatFile, 'utf-8');
  return JSON.parse(data);
}