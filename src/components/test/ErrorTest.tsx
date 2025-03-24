'use client'
import { useState } from 'react';
import { useErrorMonitoring } from '@/hooks/useErrorMonitoring';

export default function ErrorTest() {
  const { captureError, captureMessage, SeverityLevel } = useErrorMonitoring();
  const [count, setCount] = useState(0);

  const handleThrowError = () => {
    try {
      throw new Error('Test error from ErrorTest component');
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, {
          component: 'ErrorTest',
          count,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  const handleLogMessage = () => {
    captureMessage(
      'Test message from ErrorTest component',
      SeverityLevel.Info,
      {
        component: 'ErrorTest',
        count,
        timestamp: new Date().toISOString(),
      }
    );
    setCount(prev => prev + 1);
  };

  const handleTriggerRenderError = () => {
    // This will trigger the error boundary
    throw new Error('Render error from ErrorTest component');
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Error Monitoring Test</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Test count: {count}</p>
          
          <div className="space-x-4">
            <button
              onClick={handleThrowError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Throw Caught Error
            </button>

            <button
              onClick={handleLogMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log Message
            </button>

            <button
              onClick={handleTriggerRenderError}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Trigger Error Boundary
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Instructions:</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Throw Caught Error:</strong> Simulates a caught error that will be logged to Sentry
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Log Message:</strong> Sends an info message to Sentry and increments the counter
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Trigger Error Boundary:</strong> Causes an uncaught error to test the error boundary
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 