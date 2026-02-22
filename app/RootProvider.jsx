'use client';
import { Provider } from 'react-redux';
import { store } from '@/lib/stores/store';
import { Toaster } from "@/components/ui/sonner"

export default function RootProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster richColors position="top-center" />
    </Provider>
  );
}
