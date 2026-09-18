import type { Template } from './types';
import { supabase } from './supabase';

type GenerationCallbacks = {
  onStatus: (status: string) => void;
};

const STREAM_TOKENS = [
  'Analyzing your prompt',
  'Identifying components',
  'Selecting design system',
  'Generating HTML structure',
  'Applying styles',
  'Adding interactivity',
  'Optimizing layout',
  'Finalizing preview',
];

export async function streamGenerate(
  prompt: string,
  template: Template | undefined,
  callbacks: GenerationCallbacks
): Promise<string> {
  for (const status of STREAM_TOKENS) {
    callbacks.onStatus(status);
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const templateType = template && template.category !== 'blank' ? template.category : undefined;

  callbacks.onStatus('Calling AI engine');

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ prompt, templateType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Generation failed (${response.status})`);
  }

  const data = await response.json();

  if (!data.code) {
    throw new Error('No code received from AI');
  }

  callbacks.onStatus('Done');
  return data.code as string;
}
