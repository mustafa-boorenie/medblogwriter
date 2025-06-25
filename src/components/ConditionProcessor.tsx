'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { callOpenAI, Message } from '@/lib/openai';

interface ProcessingResult {
  condition: string;
  result: string;
  status: 'success' | 'error';
  error?: string;
}

interface ProcessingStats {
  total: number;
  completed: number;
  successful: number;
  failed: number;
}

export default function ConditionProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({ total: 0, completed: 0, successful: 0, failed: 0 });
  const [systemPrompt, setSystemPrompt] = useState(`You are a highly skilled medical copywriter and SEO strategist specializing in healthcare content for a general audience. Your primary goal is to create comprehensive, accurate, and easy-to-understand blog posts about medical conditions that answer the most common patient questions, rank highly in search engines, and build reader trust.

Instructions:
For each assigned medical condition (represented by the variable {condition_name}), write a clear, well-structured, SEO-optimized blog post (1,200–2,000 words) addressing the following required sections in this exact order. Use informative headings, simple language, and bullet points or tables where helpful. Back up statements with reputable sources if relevant. Avoid jargon unless briefly defined. Always include a strong introduction and a summary or call-to-action at the end.

Required sections to answer (use the headings provided):

1. What is {condition_name}?
   - Define the condition clearly and concisely.
   - Briefly mention how common it is and who it affects.

2. What are the symptoms of {condition_name}?
   - List common and less common symptoms.
   - Distinguish between early and advanced symptoms if relevant.

3. How long does {condition_name} last?
   - Describe typical duration (acute, chronic, episodic, etc.).
   - Mention factors that can affect duration.

4. What are the common causes of {condition_name}?
   - List or explain the most frequent causes.
   - Include genetic, environmental, lifestyle, or infectious factors as appropriate.

5. What are the risk factors for {condition_name}?
   - Enumerate major and minor risk factors.
   - Use bullet points for clarity.

6. Are there various types of {condition_name}?
   - If yes, list and describe each type and highlight the key differences between them.
   - If no, briefly state that there is only one type and elaborate on its features.

7. How is {condition_name} diagnosed?
   - Outline typical steps in diagnosis.
   - Mention specific tests, exams, or criteria used by professionals.

8. What treatments are available for {condition_name}?
   - List main treatment options: medications, therapies, surgeries, lifestyle changes, etc.
   - Mention when to seek urgent care.
   - Highlight new or emerging treatments if notable.

9. What type of medical specialist should I see for {condition_name}?
   - Recommend the most appropriate specialist(s).
   - Mention whether a referral from a primary care doctor is usually needed.
   - Include tips on preparing for the first appointment.

SEO Guidelines:
- Incorporate the condition's name and relevant keywords naturally throughout the article, especially in headings and first paragraphs.
- Use short paragraphs and plenty of subheadings.
- Optimize for featured snippets where possible (clear Q&A format, concise lists).
- Include an FAQ section at the end (3–5 additional patient-focused questions and answers about the condition).
- End with a call-to-action encouraging readers to consult a healthcare professional for specific medical advice.

General Tone:
- Professional but conversational.
- Empathetic, reassuring, and empowering.
- Never provide personal medical advice—remind readers to consult their healthcare provider for diagnosis and treatment.

Example Template for Each Section:
## What is {condition_name}?
[Definition, brief prevalence, who it affects.]

## What are the symptoms of {condition_name}?
[Bullet points or short paragraphs. Separate common from uncommon if relevant.]

## How long does {condition_name} last?
[Duration and factors affecting it.]

## What are the common causes of {condition_name}?
[List causes clearly.]

## What are the risk factors for {condition_name}?
[Bullet points.]

## Are there various types of {condition_name}?
[List and describe types if any, with key differences. If only one type, explain.]

## How is {condition_name} diagnosed?
[Diagnosis process, tests, exams, criteria.]

## What treatments are available for {condition_name}?
[List treatment options and when to seek urgent care.]

## What type of medical specialist should I see for {condition_name}?
[Specialist type, referral info, appointment prep.]

## Frequently Asked Questions
- [Question 1]
- [Question 2]
- [Question 3]

Never provide false, misleading, or unverified medical information. Cite authoritative sources when possible (CDC, NIH, Mayo Clinic, peer-reviewed journals, etc.).`);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setResults([]);
    setStats({ total: 0, completed: 0, successful: 0, failed: 0 });

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      parseCsv(uploadedFile);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(uploadedFile);
    } else {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      setFile(null);
    }
  };

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: false,
      complete: (results) => {
        const conditionNames = results.data
          .flat()
          .filter((item: unknown) => item && typeof item === 'string' && item.trim() !== '')
          .map((item: unknown) => String(item).trim());
        
        setConditions(conditionNames);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file');
        setFile(null);
      }
    });
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const conditionNames = jsonData
          .flat()
          .filter((item: unknown) => item && typeof item === 'string' && item.trim() !== '')
          .map((item: unknown) => String(item).trim());
        
        setConditions(conditionNames);
      } catch (error) {
        console.error('Excel parsing error:', error);
        alert('Error parsing Excel file');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processConditions = async () => {
    if (conditions.length === 0) {
      alert('No conditions found in the file');
      return;
    }

    setProcessing(true);
    setResults([]);
    setStats({ total: conditions.length, completed: 0, successful: 0, failed: 0 });

    // Create promises for all API calls
    const promises = conditions.map(async (condition) => {
      try {
        const messages: Message[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Medical condition: ${condition}` }
        ];

        const response = await callOpenAI(messages);

        if (response.success && response.data) {
          return {
            condition,
            result: response.data.content,
            status: 'success' as const
          };
        } else {
          return {
            condition,
            result: '',
            status: 'error' as const,
            error: response.error || 'Unknown error'
          };
        }
      } catch (error) {
        return {
          condition,
          result: '',
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Process all promises concurrently and update stats as they complete
    const processedResults: ProcessingResult[] = [];
    let completed = 0;
    let successful = 0;
    let failed = 0;

    // Use Promise.allSettled to handle all promises regardless of failures
    const settledPromises = await Promise.allSettled(promises);
    
    settledPromises.forEach((settledPromise, index) => {
      if (settledPromise.status === 'fulfilled') {
        const result = settledPromise.value;
        processedResults.push(result);
        
        if (result.status === 'success') {
          successful++;
        } else {
          failed++;
        }
      } else {
        // Handle rejected promises
        processedResults.push({
          condition: conditions[index],
          result: '',
          status: 'error',
          error: 'Promise rejected: ' + settledPromise.reason
        });
        failed++;
      }
      
      completed++;
      setStats({
        total: conditions.length,
        completed,
        successful,
        failed
      });
    });

    setResults(processedResults);
    setProcessing(false);
  };

  const downloadResults = () => {
    const csvContent = [
      ['Condition', 'Generated Copy', 'Status', 'Error'],
      ...results.map(result => [
        result.condition,
        result.result,
        result.status,
        result.error || ''
      ])
    ];

    const csvString = csvContent.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-copy-results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Condition Batch Processor</h2>
      
      {/* System Prompt Configuration */}
      <div className="mb-6">
        <label htmlFor="systemPrompt" className="block text-sm font-medium text-black mb-2">
          AI System Prompt
        </label>
        <textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full p-3 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={8}
          placeholder="Set the behavior and context for the AI..."
        />
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Conditions File (.csv, .xlsx, .xls)
        </label>
        <input
          id="fileUpload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-2 text-sm text-green-600">
            Loaded: {file.name} ({conditions.length} conditions found)
          </p>
        )}
      </div>

      {/* Conditions Preview */}
      {conditions.length > 0 && !processing && results.length === 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Conditions Found ({conditions.length})</h3>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded border">
            {conditions.slice(0, 10).map((condition, index) => (
              <div key={index} className="text-sm text-gray-700 py-1">
                {index + 1}. {condition}
              </div>
            ))}
            {conditions.length > 10 && (
              <div className="text-sm text-gray-500 italic">
                ... and {conditions.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Button */}
      {conditions.length > 0 && (
        <div className="mb-6">
          <button
            onClick={processConditions}
            disabled={processing}
            className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Processing...' : `Process ${conditions.length} Conditions`}
          </button>
        </div>
      )}

      {/* Processing Stats */}
      {processing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-800 mb-2">Processing Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-black">Total: <span className="font-semibold text-black ">{stats.total}</span></div>
            <div className="text-black">Completed: <span className="font-semibold text-black">{stats.completed}</span></div>
            <div className="text-black">Successful: <span className="font-semibold text-green-600 text-black">{stats.successful}</span></div>
            <div className="text-black">Failed: <span className="font-semibold text-red-600 text-black">{stats.failed}</span></div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Results ({results.length})</h3>
            <button
              onClick={downloadResults}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Download CSV
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96 border border-gray-300 rounded-md">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated Copy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className={result.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs">
                      {result.condition}
                    </td>
                    <td className="px-4 py-3 text-sm text-black max-w-md">
                      {result.status === 'success' ? (
                        <div className="whitespace-pre-wrap">{result.result}</div>
                      ) : (
                        <span className="text-red-600">Error: {result.error}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 