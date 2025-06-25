export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  success: boolean;
  data?: {
    role: string;
    content: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

export async function callOpenAI(
  messages: Message[],
  model: string = 'gpt-3.5-turbo',
  temperature: number = 0.7
): Promise<OpenAIResponse> {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to call OpenAI API');
    }

    return data;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Helper function for simple chat completion
export async function generateChatCompletion(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const messages: Message[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: userMessage });

  const response = await callOpenAI(messages);
  
  if (response.success && response.data) {
    return response.data.content;
  } else {
    throw new Error(response.error || 'Failed to generate completion');
  }
} 