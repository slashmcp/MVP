# Microsoft Azure / Entra ID Credentials Setup Guide

This guide explains how to obtain the necessary Azure credentials (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `AZURE_TENANT_ID`) to connect Microsoft Outlook / Microsoft Graph API to the Recruitment Command Center.

---

## Step 1: Register an Application in Microsoft Entra ID (Azure AD)

1. Open the [Azure Portal](https://portal.azure.com/) or the [Microsoft Entra admin center](https://entra.microsoft.com/).
2. In the search bar at the top, search for and select **Microsoft Entra ID** (formerly Azure Active Directory).
3. In the left-hand navigation pane, select **App registrations** (under the *Manage* section).
4. Click on **+ New registration** at the top.
5. Fill out the application details:
   - **Name**: Enter a recognizable name (e.g., `Recruitment Command Center`).
   - **Supported account types**: Choose **Accounts in this organizational directory only (Single tenant)** for internal organization use, or **Accounts in any organizational directory (Multitenant)** if connecting external accounts.
   - **Redirect URI** (Optional): Under *Select a platform*, select **Web** and enter `http://localhost:3000/api/auth/callback/microsoft` (useful if you decide to transition to user-delegated authentication).
6. Click **Register** at the bottom of the page.

---

## Step 2: Retrieve Tenant ID and Client ID

1. Once the application is created, you will be redirected to its **Overview** page.
2. Copy the following values from the page:
   - **Application (client) ID**: This will be your `AZURE_CLIENT_ID`.
   - **Directory (tenant) ID**: This will be your `AZURE_TENANT_ID`.
3. Save these to your `.env.local` file (see Step 5).

---

## Step 3: Create a Client Secret

1. In the left-hand navigation panel of your App Registration, select **Certificates & secrets**.
2. Select the **Client secrets** tab and click **+ New client secret**.
3. Add a description (e.g., `Recruitment Command Center Secret`) and set your preferred expiration period (e.g., 180 days).
4. Click **Add**.
5. > [!IMPORTANT]
   > **Copy the Secret Value immediately.** This is your `AZURE_CLIENT_SECRET`. Once you navigate away from this screen, the value will be permanently masked and you will not be able to retrieve it.

---

## Step 4: Configure API Permissions for Outlook (Mail) Access

Because the application uses the **Client Credentials Flow** (`grant_type: client_credentials`), it authenticates as a background service (Application) rather than an individual logged-in user. You must configure **Application Permissions** and grant Administrator Consent:

1. In the left-hand navigation pane, select **API permissions**.
2. Click **+ Add a permission** and select **Microsoft Graph**.
3. Choose **Application permissions** (not *Delegated permissions*).
4. Search for and check the following permissions:
   - `Mail.Send` (Allows the application to send outreach emails)
   - `Mail.ReadWrite` (Allows the application to read and write mail items, including drafts)
5. Click **Add permissions** at the bottom.
6. > [!IMPORTANT]
   > These permissions require tenant admin approval. Under the **Configured permissions** table, click **Grant admin consent for [Your Tenant Name]**, and click **Yes** to confirm. The status indicator should turn green with a checkmark.

---

## Step 5: Configure your Environment Variables

Create or open the `.env.local` file in the root of your `recruitment-command-center` project and paste the credentials:

```bash
# --- Microsoft Outlook (Azure AD) ---
AZURE_CLIENT_ID=your_copied_client_id_here
AZURE_CLIENT_SECRET=your_copied_client_secret_here
AZURE_TENANT_ID=your_copied_tenant_id_here
```

Restart your local development server (`npm run dev`) to apply the new variables.

---

## 💡 Technical Note on Microsoft Graph API Endpoints

The codebase in [outlook.ts](file:///c:/Users/senti/OneDrive/Desktop/MVP/recruitment-command-center/src/lib/outlook.ts) uses a Client Credentials Flow to generate access tokens. 

In Microsoft Graph:
* The `/me` endpoint (e.g. `/me/sendMail`, `/me/messages`) is **only valid** when using **Delegated Permissions** (user-interactive login).
* Because the current implementation uses **Application Permissions**, requests to `/me` will return an error (`400 Bad Request` / `/me request is only valid with user-delegated authentication flow`).
* **Fix/Workaround:** To read/write/send emails on behalf of a specific user/recruiter mailbox, you should change `/me` in [outlook.ts](file:///c:/Users/senti/OneDrive/Desktop/MVP/recruitment-command-center/src/lib/outlook.ts) to `/users/YOUR_EMAIL@yourdomain.com`. For example:
  * Replace `/me/sendMail` with `/users/recruiter@yourdomain.com/sendMail`
  * Replace `/me/messages` with `/users/recruiter@yourdomain.com/messages`
