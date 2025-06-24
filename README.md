# Medical Copy Writer

A Next.js application with OpenAI integration for generating medical content and copy. This project provides a complete setup with backend API routes ready for OpenAI API calls.

## Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** for styling
- ✅ **OpenAI Integration** with error handling
- ✅ **API Routes** ready for production
- ✅ **Environment Configuration** for secure API key management
- ✅ **React Components** for testing AI functionality

## Prerequisites

- Node.js 18+ installed
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Setup Instructions

### 1. Install Dependencies

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

Create or update the `.env.local` file with your OpenAI API key:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration
NODE_ENV=development
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── openai/
│   │       └── route.ts          # OpenAI API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/
│   └── OpenAIChat.tsx            # Chat interface component
└── lib/
    └── openai.ts                 # OpenAI utility functions
```

## API Endpoints

### POST /api/openai

Send messages to OpenAI for chat completions.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Hello, how are you?"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
  },
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 25,
    "total_tokens": 45
  }
}
```

### GET /api/openai

Returns information about the API endpoint.

## Usage Examples

### Using the React Component

The `OpenAIChat` component provides a simple interface to test the OpenAI integration:

```tsx
import OpenAIChat from '@/components/OpenAIChat';

export default function Page() {
  return (
    <div>
      <OpenAIChat />
    </div>
  );
}
```

### Using the API Utility

```tsx
import { generateChatCompletion } from '@/lib/openai';

// Simple usage
const response = await generateChatCompletion(
  "What are the benefits of exercise?",
  "You are a medical professional."
);

console.log(response);
```

### Direct API Call

```tsx
import { callOpenAI } from '@/lib/openai';

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
];

const response = await callOpenAI(messages, 'gpt-3.5-turbo', 0.7);
```

## Error Handling

The application includes comprehensive error handling for:

- Missing or invalid API keys
- API quota exceeded
- Network errors
- Invalid request formats

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - A secure secret for production

## Troubleshooting

### "OpenAI API key not configured" Error

Make sure you've:
1. Created the `.env.local` file
2. Added your actual OpenAI API key
3. Restarted the development server

### API Calls Failing

Check that:
1. Your OpenAI API key is valid and has credits
2. The API key has the necessary permissions
3. Your internet connection is stable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
# medblogwriter
