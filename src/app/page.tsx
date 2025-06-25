import OpenAIChat from '@/components/OpenAIChat';
import ConditionProcessor from '@/components/ConditionProcessor';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-left mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Medical AI Copywriter
          </h1>
          <p className="text-xl text-gray-600 mx-auto text-left">
            A web app made for CLS marketing team to generate medical content and copy.
          </p>
        </div>

        <div className="space-y-12">
          {/* Batch Processing for Files */}
          <ConditionProcessor />
          
        </div>
      </div>
    </main>
  );
}
