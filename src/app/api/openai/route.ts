import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages, model = 'o3', temperature = 0.7 } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });

    // Return the completion response
    return NextResponse.json({
      success: true,
      data: completion.choices[0].message,
      usage: completion.usage,
    });

  } catch (error: unknown) {
    console.error('OpenAI API Error:', error);
    
    // Handle different types of errors
    if (error instanceof Error && 'code' in error) {
      const openAIError = error as { code: string };
      
      if (openAIError.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 402 }
        );
      }
      
      if (openAIError.code === 'invalid_api_key') {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OpenAI API endpoint is running',
    endpoints: {
      POST: '/api/openai - Send messages to OpenAI chat completions'
    }
  });
} 