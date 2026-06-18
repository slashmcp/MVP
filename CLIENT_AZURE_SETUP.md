# Connecting Your Microsoft Outlook (Instructions for Admins)

To enable the recruitment app to send outreach emails and manage calendar invites, your IT or Microsoft 365 Administrator needs to register it in your Azure/Entra portal and share three credentials with us. 

Here is the quick step-by-step guide for your admin:

---

### Step 1: Register the App
1. Open the [Azure Portal](https://portal.azure.com/) and sign in with your admin account.
2. In the search bar at the top, search for and select **Microsoft Entra ID** (formerly Azure Active Directory).
3. In the left menu, click **App registrations**, then click **+ New registration** at the top.
4. Name the application (e.g., `Recruitment Portal`).
5. Choose **Accounts in this organizational directory only (Single tenant)**.
6. Click **Register** at the bottom.

---

### Step 2: Copy the IDs
On the page that loads, copy and save these two keys:
1. **Application (client) ID**
2. **Directory (tenant) ID**

---

### Step 3: Create a Client Secret (Password)
1. In the left menu, click **Certificates & secrets**.
2. Click **+ New client secret**.
3. Add any description (e.g., `Recruitment Portal Secret`) and click **Add**.
4. **Important**: Copy the text in the **Value** column immediately. (Once you refresh or leave the page, this value will be hidden forever).

---

### Step 4: Grant Email Permissions
1. In the left menu, click **API permissions**.
2. Click **+ Add a permission**, then select **Microsoft Graph**.
3. Click **Application permissions** (on the right).
4. Search for and check these two permissions:
   - `Mail.Send`
   - `Mail.ReadWrite`
5. Click **Add permissions** at the bottom.
6. **Important**: Click the button that says **Grant admin consent for [Your Company Name]** (right above the list of permissions), and click **Yes** to confirm. (You should see green checkmarks appear next to the permissions).

---

### What to Send Us
Please share the following three values securely:
1. **Application (client) ID**
2. **Directory (tenant) ID**
3. **Client Secret (Value)**
