import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function TestConnection() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testServer = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('Testing server connection...');
      console.log('URL:', `https://${projectId}.supabase.co/functions/v1/make-server-b12e21f5/health`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b12e21f5/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      console.log('Response:', response);

      if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Data:', data);

      setResult({
        success: true,
        message: 'Server ishlayapti! ✅',
        data
      });
    } catch (error: any) {
      console.error('Test error:', error);
      
      setResult({
        success: false,
        message: error.message || 'Noma\'lum xato',
        error: error.toString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">Server Connection Test</h1>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2"><strong>Project ID:</strong></p>
            <code className="text-sm bg-white px-2 py-1 rounded">{projectId}</code>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2"><strong>Test URL:</strong></p>
            <code className="text-xs bg-white px-2 py-1 rounded break-all">
              https://{projectId}.supabase.co/functions/v1/make-server-b12e21f5/health
            </code>
          </div>
        </div>

        <Button 
          onClick={testServer} 
          disabled={testing}
          className="w-full mb-6"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Server Connection'
          )}
        </Button>

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.message}
                </h3>
                
                {result.data && (
                  <pre className="text-sm bg-white p-3 rounded mt-2 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                
                {result.error && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-red-800 mb-1">Error details:</p>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Agar xato chiqsa:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Supabase Dashboard'ni oching</li>
            <li>Edge Functions bo'limiga o'ting</li>
            <li>
              <code className="bg-white px-1 rounded">make-server-b12e21f5</code> funksiyasi deploy qilinganligini tekshiring
            </li>
            <li>Function logs'larini tekshiring</li>
            <li>Environment variables (GEMINI_API_KEY, SUPABASE_URL, etc.) mavjudligini tekshiring</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a href="/signup" className="text-purple-600 hover:underline">
            Signup sahifasiga qaytish →
          </a>
        </div>
      </Card>
    </div>
  );
}
