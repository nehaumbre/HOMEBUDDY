# Deployment Guide: HomeBuddy on Cloud Run

Follow these steps to deploy your application to Google Cloud Run using the GitHub repository you just updated.

## 1. Prerequisites
- A Google Cloud Platform (GCP) account.
- A project created in the GCP Console.
- Cloud Run API enabled.

## 2. Cloud Console Steps
1. Open the [Cloud Run Console](https://console.cloud.google.com/run).
2. Click **Create Service**.
3. Select **Continuously deploy from a repository**.
4. Click **Set up with Cloud Build**.
5. Select **GitHub** as the repository provider.
6. Authenticate and select your repository: `nehaumbre/HOMEBUDDY`.
7. In the **Build Configuration**:
   - **Branch**: `main` (or whichever branch you pushed to).
   - **Build Type**: Select **Dockerfile**.
   - **Source location**: `/Dockerfile` (should be detected automatically).
8. Click **Save**.
9. Scroll down to **Authentication** and select **Allow unauthenticated invocations** (so anyone can see the app).
10. Click **Create**.

## 3. That's It!
Google Cloud will now:
- Watch your GitHub repo for changes.
- Automatically build a container using our `Dockerfile`.
- Deploy it to a unique URL.

Once the build finishes, you'll see a green checkmark and a URL at the top of the service page!
