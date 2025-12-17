import { createClient } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// 会話一覧を取得
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
};

// 新しい会話を作成
export const createConversation = async (userId: string, title: string = '新しい会話'): Promise<Conversation> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, title }])
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data;
};

// 会話タイトルを更新
export const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
};

// 会話を削除
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const supabase = createClient();

  // First delete all messages in the conversation
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId);

  if (messagesError) {
    console.error('Error deleting messages:', messagesError);
    throw messagesError;
  }

  // Then delete the conversation
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// 会話のメッセージを取得
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data || [];
};

// メッセージを保存
export const saveMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, role, content }])
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

// 会話を検索
export const searchConversations = async (userId: string, query: string): Promise<Conversation[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }

  return data || [];
};

// 全会話を削除
export const deleteAllConversations = async (userId: string): Promise<void> => {
  const supabase = createClient();

  // 該当ユーザーの全会話IDを取得
  const { data: conversations, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (fetchError) {
    console.error('Error fetching conversations:', fetchError);
    throw fetchError;
  }

  if (!conversations || conversations.length === 0) return;

  const conversationIds = conversations.map((c) => c.id);

  // 全メッセージを削除
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .in('conversation_id', conversationIds);

  if (messagesError) {
    console.error('Error deleting messages:', messagesError);
    throw messagesError;
  }

  // 全会話を削除
  const { error: convError } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId);

  if (convError) {
    console.error('Error deleting conversations:', convError);
    throw convError;
  }
};

// エクスポート用: 会話とメッセージを取得
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export const getConversationsWithMessages = async (userId: string): Promise<ConversationWithMessages[]> => {
  const supabase = createClient();

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('Error fetching conversations:', convError);
    throw convError;
  }

  if (!conversations || conversations.length === 0) return [];

  const result: ConversationWithMessages[] = [];

  for (const conv of conversations) {
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    result.push({
      ...conv,
      messages: messages || [],
    });
  }

  return result;
};
