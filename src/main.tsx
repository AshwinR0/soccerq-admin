import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to automatically attach Supabase JWT token to all /api/ requests
const { fetch: originalFetch } = window;
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  
  if (url.startsWith("/api/")) {
    const { supabase } = await import("./supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      init = init || {};
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${session.access_token}`);
      init.headers = headers;
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <App />
);
