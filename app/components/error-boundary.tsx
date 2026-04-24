import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

// Fix for React 19 / Framer Motion type conflict
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * QUANTUM CYBERPUNK ERROR BOUNDARY
 * Catches rendering errors and displays Safe Mode UI
 * Maintains Quantum Cyberpunk aesthetic with glitch effects
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    this.setState((prevState) => ({
      ...prevState,
      errorInfo,
    }));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <SafeModeUI error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Safe Mode UI - Glitchy Cyberpunk Emergency Screen
 */
function SafeModeUI({
  error,
  onReset,
}: {
  error?: Error;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex items-center justify-center p-6">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1a0000 1px, transparent 1px), linear-gradient(to bottom, #1a0000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl"
      >
        {/* Glitch border effect */}
        <div className="relative">
          <div className="absolute inset-0 border-2 border-red-500/30 rounded-lg" />
          <div
            className="absolute inset-0 border-2 border-orange-500/20 rounded-lg"
            style={{
              transform: 'translate(4px, 4px)',
            }}
          />

          {/* Content */}
          <div className="relative bg-black/80 border border-red-500/50 rounded-lg p-8 backdrop-blur-sm">
            {/* Warning Header */}
            <div className="mb-8">
              <MotionDiv
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-center"
              >
                <div className="text-5xl font-black text-red-500 mb-2 tracking-wider">
                  ⚠ SYSTEM OVERRIDE
                </div>
                <div className="text-sm uppercase tracking-widest text-orange-400">
                  Safe Mode Activated // Neural Link Interrupted
                </div>
              </MotionDiv>
            </div>

            {/* Error Details */}
            <div className="space-y-4 mb-8">
              <div className="bg-black/50 border border-red-500/30 rounded p-4">
                <div className="text-xs uppercase tracking-widest text-red-400 font-bold mb-2">
                  Error Report
                </div>
                <div className="font-mono text-sm text-gray-300 space-y-2 max-h-48 overflow-y-auto">
                  {error?.message && (
                    <div>
                      <span className="text-red-500">[ERROR_TYPE]:</span> {error.message}
                    </div>
                  )}
                  {error?.stack && (
                    <div className="text-xs text-gray-500 mt-4 border-t border-red-500/20 pt-4">
                      <span className="text-red-500">[STACK_TRACE]:</span>
                      <pre className="whitespace-pre-wrap text-gray-400 mt-2">
                        {error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-black/50 border border-orange-500/20 rounded p-3">
                  <div className="text-orange-400 font-bold mb-1">TIMESTAMP</div>
                  <div className="text-gray-300 font-mono">
                    {new Date().toISOString()}
                  </div>
                </div>
                <div className="bg-black/50 border border-orange-500/20 rounded p-3">
                  <div className="text-orange-400 font-bold mb-1">SYSTEM_STATUS</div>
                  <div className="text-gray-300 font-mono">CRITICAL_FAILURE</div>
                </div>
              </div>
            </div>

            {/* Recovery Options */}
            <div className="space-y-3">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReset}
                className="w-full bg-red-500/10 border border-red-500/50 rounded px-6 py-3 text-red-500 font-bold uppercase tracking-wider text-sm hover:bg-red-500/20 transition-all"
              >
                ATTEMPT RECOVERY
              </MotionButton>
              <div className="text-xs text-gray-500 text-center">
                If problem persists, contact system administrator or check console logs
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-red-500/20">
              <div className="text-xs text-gray-600 text-center space-y-1">
                <div>AMRIKYY LAB // QUANTUM CYBERPUNK SYSTEM</div>
                <div>NEURAL_LINK_FAILURE // SAFE_MODE_ENGAGED</div>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* Glitch animation */}
      <style jsx>{`
        @keyframes glitch {
          0% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
          20% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
          40% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
          60% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
          80% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
          100% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
          }
        }
      `}</style>
    </div>
  );
}
