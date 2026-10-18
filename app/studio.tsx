"use client";
import { useEffect, useState } from 'react';
import App from '../src/App';
export default function Studio({ account }: { account: { id: string; name: string } | null }) {
  const [ready, setReady] = useState(false); useEffect(() => setReady(true), []);
  return ready ? <App account={account} /> : <main style={{padding:40}}>Profile Up · 正在载入工作室…</main>;
}
