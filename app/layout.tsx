import type { Metadata } from 'next';
import '../src/styles.css';
import '../src/collegiate.css';
import '../src/cloud.css';
export const metadata: Metadata = { title: 'Profile Up — 个人网站与学术简历', description: 'Academic website and curriculum vitae generation', icons: { icon: '/favicon.svg' } };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html>; }
