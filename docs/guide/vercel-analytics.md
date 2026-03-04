# Adding Vercel Web Analytics

This guide will help you add Vercel Web Analytics to your Resumx documentation site to track visitors and page views.

## Prerequisites

- A Vercel account. If you don't have one, you can [sign up for free](https://vercel.com/signup).
- A Vercel project for your documentation site.
- The Vercel CLI installed (optional but recommended):

```bash
npm install -g vercel
```

## Enable Web Analytics in Vercel

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click the **Analytics** tab
4. Click **Enable** from the dialog

::: tip
Enabling Web Analytics will add new routes (scoped at `/_vercel/insights/*`) after your next deployment.
:::

## Add @vercel/analytics to your project

Using pnpm (the package manager used by Resumx):

```bash
pnpm add @vercel/analytics
```

## Add the Analytics component to VitePress

Since the Resumx documentation uses VitePress, you'll need to add the Analytics component to your theme configuration.

1. Open `docs/.vitepress/theme/index.ts`
2. Import and inject the analytics:

```ts
import { h } from 'vue'
import Theme from 'vitepress/theme'
import { inject } from '@vercel/analytics'
import './custom.css'

export default {
  extends: Theme,
  Layout() {
    return h(Theme.Layout, null, {
      // Other layout customizations...
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Inject Vercel Analytics
    if (typeof window !== 'undefined') {
      inject()
    }
  }
}
```

::: tip
The `inject()` function should only be called once and must run in the client. The `typeof window !== 'undefined'` check ensures it only runs in the browser.
:::

## Deploy your documentation

Deploy your documentation using:

```bash
vercel deploy --prod
```

Or if you have your Git repository connected to Vercel, simply push to your main branch:

```bash
git push origin main
```

Once deployed, the analytics will start tracking visitors and page views automatically.

## Verify the setup

To verify that analytics is working:

1. Visit your deployed documentation site
2. Open your browser's Developer Tools (F12)
3. Go to the **Network** tab
4. Look for a request to `/_vercel/insights/view`

If you see this request, analytics is working correctly!

## View your data

Once your documentation is deployed and receiving visitors:

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click the **Analytics** tab

After a few days of visitors, you'll be able to explore your data and see which pages are most popular.

## Learn more

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [VitePress Documentation](https://vitepress.dev)
- [@vercel/analytics Package](https://www.npmjs.com/package/@vercel/analytics)
