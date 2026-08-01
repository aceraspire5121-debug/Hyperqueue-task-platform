import type { Metadata } from 'next';
import './globals.css';
import Providers from './Providers';
import { Navbar } from '../components/layout/Navbar';

export const metadata: Metadata = {
  title: 'HyperQueue Engine - Micro SaaS Task Automation Platform',
  description: 'Production-ready task automation and asynchronous job processing platform with real-time WebSockets and BullMQ retries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
