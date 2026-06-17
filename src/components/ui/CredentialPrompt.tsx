'use client';

import { useAppStore } from '@/store/app-store';
import { X, ExternalLink, KeyRound, ShieldAlert } from 'lucide-react';

const SERVICE_CONFIG = {
  'google-sheets': {
    title: 'Google Sheets Connection Required',
    description: 'To save candidates, jobs, and pipeline updates directly to your database, you need to connect your Google Sheets account.',
    steps: [
      'Create a Google Cloud Project and enable the Google Sheets API.',
      'Create a Service Account and download the JSON key file.',
      'Share your target Google Sheet with the Service Account email.',
      'Add the credentials to your .env.local file.',
    ],
    link: 'https://developers.google.com/sheets/api/quickstart/nodejs',
    envVars: ['GOOGLE_SERVICE_ACCOUNT_KEY', 'GOOGLE_SHEET_ID'],
  },
  'openai': {
    title: 'OpenAI API Key Required',
    description: 'To use AI features like resume summarization, candidate matching, and email generation, you need an OpenAI API key.',
    steps: [
      'Sign up or log in to the OpenAI Developer Platform.',
      'Navigate to API Keys and create a new secret key.',
      'Copy the key and add it to your .env.local file.',
    ],
    link: 'https://platform.openai.com/api-keys',
    envVars: ['OPENAI_API_KEY'],
  },
  'outlook': {
    title: 'Microsoft Outlook Connection Required',
    description: 'To send outreach emails and calendar invites directly from the app, you need to configure Microsoft Graph API access.',
    steps: [
      'Register an application in the Azure Portal.',
      'Add Microsoft Graph API permissions (Mail.Send, Mail.ReadWrite).',
      'Create a client secret.',
      'Add the Tenant ID, Client ID, and Client Secret to your .env.local file.',
    ],
    link: 'https://learn.microsoft.com/en-us/graph/auth-register-app-v2',
    envVars: ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'],
  },
  'n8n': {
    title: 'n8n Automation Required',
    description: 'To trigger automated workflows and data syncing, you need to configure your n8n instance URL and webhook secret.',
    steps: [
      'Set up an n8n instance (cloud or self-hosted).',
      'Create a webhook workflow and note the URL.',
      'Generate a secure secret token for webhook authentication.',
      'Add the n8n base URL and secret to your .env.local file.',
    ],
    link: 'https://docs.n8n.io/integrations/core-nodes/n8n-nodes-base.webhook/',
    envVars: ['N8N_BASE_URL', 'N8N_WEBHOOK_SECRET'],
  },
  'serper': {
    title: 'Serper.dev (Google Search) Required',
    description: 'To source new candidates via Google Search and LinkedIn profiles, you need to provide your free Serper API key.',
    steps: [
      'Go to serper.dev and create a free account.',
      'Navigate to the API Keys section.',
      'Copy your API key.',
      'Add the API key to your .env.local file.',
    ],
    link: 'https://serper.dev/api-key',
    envVars: ['SERPER_API_KEY'],
  },
  'apify': {
    title: 'Apify Connection Required',
    description: 'To scrape LinkedIn profiles and live web data for sourcing, you need an Apify API key.',
    steps: [
      'Create an account on Apify.com.',
      'Navigate to Settings > Integrations.',
      'Copy your personal API token.',
      'Add the token to your .env.local file.',
    ],
    link: 'https://console.apify.com/account/integrations',
    envVars: ['APIFY_API_TOKEN'],
  },
};

export function CredentialPrompt() {
  const { credentialPrompt, dismissCredentialPrompt } = useAppStore();

  if (!credentialPrompt) return null;

  const config = SERVICE_CONFIG[credentialPrompt.service];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between bg-[var(--surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-warning" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{config.title}</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Required for: <span className="font-medium text-text-primary">{credentialPrompt.feature}</span>
              </p>
            </div>
          </div>
          <button
            onClick={dismissCredentialPrompt}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
            aria-label="Close prompt"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            {config.description}
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-accent" strokeWidth={1.75} />
              How to configure:
            </h3>
            <ol className="list-decimal list-outside ml-5 space-y-2">
              {config.steps.map((step, index) => (
                <li key={index} className="text-sm text-text-secondary pl-1 leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-[var(--surface-elevated)] border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">Required Environment Variables</p>
            <div className="space-y-1.5">
              {config.envVars.map((envVar) => (
                <code key={envVar} className="block text-xs font-mono text-text-primary bg-surface px-2 py-1.5 rounded border border-border">
                  {envVar}=
                </code>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[var(--surface-elevated)] flex justify-between items-center flex-row-reverse">
          <a
            href={config.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            onClick={dismissCredentialPrompt}
          >
            Get Credentials
            <ExternalLink className="w-4 h-4 ml-1.5" strokeWidth={1.75} />
          </a>
          <button
            onClick={dismissCredentialPrompt}
            className="btn btn-ghost text-sm"
          >
            Continue in Mock Mode
          </button>
        </div>
      </div>
    </div>
  );
}
