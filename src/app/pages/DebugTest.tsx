import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function DebugTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-b12e21f5/health`;
      console.log('Testing URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult({
        success: true,
        status: response.status,
        data
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      setResult({
        success: false,
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Debug Test - Server Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>API URL:</strong> https://{projectId}.supabase.co/functions/v1/make-server-b12e21f5</p>
          </div>
          
          <Button onClick={testConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Qanday foydalanish:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>"Test Connection" tugmasini bosing</li>
              <li>Browser console'ni oching (F12)</li>
              <li>Network tabini tekshiring</li>
              <li>Console'dagi xatolarni o'qing</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
