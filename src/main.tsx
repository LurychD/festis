import './polyfills';
import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';

import { AppSplashScreen } from './components/AppSplashScreen';
import { AuthProvider } from './AuthProvider.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { SkinProvider } from './context/SkinContext.tsx';
import './index.css';
import 'koin.js/styles.css';

const App = React.lazy(() => import('./App.tsx'));

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: '20px', color: 'red'}}><h1>Something went wrong.</h1><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
      console.warn('SW registration failed on load:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <SkinProvider>
            <React.Suspense fallback={<AppSplashScreen />}>
              <App />
            </React.Suspense>
          </SkinProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
);
