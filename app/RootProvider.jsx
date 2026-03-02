'use client';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { store } from '@/lib/stores/store';
import { Toaster } from "@/components/ui/sonner"

export default function RootProvider({ children }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        {children}
        <Toaster richColors position="top-center" />
      </Provider>
    </SessionProvider>
  );
}
