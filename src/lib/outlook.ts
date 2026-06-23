import { Client } from '@microsoft/microsoft-graph-client';

// ========================================
// Microsoft Graph / Outlook Configuration
// ========================================
let graphClient: Client | null = null;

export function isOutlookConfigured(): boolean {
  return !!(
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID
  );
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) return null;

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

async function getGraphClient(): Promise<Client | null> {
  if (graphClient) return graphClient;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  graphClient = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  return graphClient;
}

// ========================================
// Email Operations
// ========================================

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  isDraft?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = await getGraphClient();
  if (!client) {
    return { success: false, error: 'Azure Authentication Failed - Please verify your Client Secret and Tenant ID' };
  }

  try {
    const message = {
      subject: params.subject,
      body: {
        contentType: 'Text',
        content: params.body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: params.to,
          },
        },
      ],
    };

    if (params.isDraft) {
      // Create as draft
      const result = await client.api(`/users/${process.env.AZURE_SENDER_EMAIL || 'admin@yourdomain.com'}/messages`).post(message);
      return { success: true, messageId: result.id };
    } else {
      // Send directly
      await client.api(`/users/${process.env.AZURE_SENDER_EMAIL || 'admin@yourdomain.com'}/sendMail`).post({ message, saveToSentItems: true });
      return { success: true };
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending email:', error);
    return { success: false, error: errMsg };
  }
}

export async function getSentEmails(limit: number = 10): Promise<unknown[]> {
  const client = await getGraphClient();
  if (!client) return [];

  try {
    const result = await client
      .api(`/users/${process.env.AZURE_SENDER_EMAIL || 'admin@yourdomain.com'}/mailFolders/sentItems/messages`)
      .top(limit)
      .select('id,subject,toRecipients,sentDateTime,bodyPreview')
      .orderby('sentDateTime desc')
      .get();
    return result.value || [];
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    return [];
  }
}
