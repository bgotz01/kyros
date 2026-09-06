import { redirect } from 'next/navigation';

// The engine is per-domain. AI is the only one built; markets and geopolitics
// have corpora but no engine yet, so /engine resolves to the one that exists.
export default function EngineIndex() {
    redirect('/engine/ai');
}
