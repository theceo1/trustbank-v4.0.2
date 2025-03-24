'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Convert errorInfo to a plain object that Sentry can handle
    const errorInfoObj = {
      componentStack: errorInfo.componentStack,
      ...errorInfo
    };

    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfoObj);
      Sentry.captureException(error);
    });

    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReport = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: 'Something went wrong',
      subtitle: 'Our team has been notified.',
      subtitle2: 'If you would like to help, tell us what happened below.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      errorGeneric: 'An unknown error occurred while submitting your report. Please try again.',
      errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
      successMessage: 'Your feedback has been sent. Thank you!'
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-600 mb-8">
                  We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-8 text-left">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Details:</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                      {this.state.error?.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleReport}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 