# AM Motors · PDI Yard dashboard

One-page website (`index.html`) for stock ageing, carry-forward stock, PDI, transit, labour, pending, HSRP, IBND and sales handover.

## Publish on Cloudflare Pages

**Option A: direct upload (no GitHub needed)**
1. Sign in at dash.cloudflare.com and open **Workers & Pages**.
2. Click **Create → Pages → Upload assets**.
3. Name the project, for example `pdi-yard`, and click **Create project**.
4. Drop the unzipped `pdi-yard` folder (with `index.html` and `_headers`) or the zip file, then click **Deploy site**.
5. The site is live at `https://pdi-yard.pages.dev`. To update it, open the project, choose **Create new deployment**, and upload the folder again.

**Option B: from GitHub (updates deploy automatically)**
1. Put `index.html` and `_headers` in a GitHub repository (see below).
2. In **Workers & Pages → Create → Pages → Connect to Git**, pick the repository.
3. Framework preset **None**, build command empty, build output directory `/`. Click **Save and Deploy**.
4. Every commit to `main` redeploys the site.

**Keep it private (recommended, the reports hold customer names and phone numbers)**
1. In the Pages project open **Settings → General → Access policy** and click **Manage** (or go to **Zero Trust → Access → Applications → Add an application → Self-hosted**).
2. Application domain: `pdi-yard.pages.dev` (and your custom domain, if any).
3. Add a policy: Action **Allow**, Include **Emails** (list each person) or **Emails ending in** your company domain.
4. Save. Visitors now get a one-time code by email before the dashboard opens. Zero Trust is free for up to 50 users.

**Custom domain (optional):** in the Pages project open **Custom domains → Set up a custom domain**, for example `pdi.yourdomain.com`.

## Publish on GitHub Pages

1. Sign in to GitHub and click **New repository**. Name it, for example, `pdi-yard`.
2. Click **Add file → Upload files**, drop in `index.html` (and this README), then **Commit changes**.
3. Open **Settings → Pages**. Under **Build and deployment** choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute the site is live at `https://<your-github-name>.github.io/pdi-yard/`.

To update the dashboard later, upload a new `index.html` over the old one.

## Loading the day's reports

Open the site, go to the **Data** tab (key `0`), and pick or drop the Excel files:

| Report | File name the page recognises |
|---|---|
| Stock report | contains `stock` |
| IBND report | contains `ibnd` |
| Final plan report | contains `final plan` / `final_plan` |
| Job card work report | contains `jobcard` / `job card` |
| Delivery report | contains `deliver` |

Files with other names are recognised from their column headers. The data stays in that browser (IndexedDB) until newer files are loaded. Nothing is uploaded to any server.

## Reading Google Sheets automatically (optional)

At the top of the standalone section in `index.html` there is a `LINKS` block:

```js
const LINKS={
  stock:"",
  ibnd:"",
  pdi:"",
  jobs:"",
  delivery:"https://docs.google.com/spreadsheets/d/1Kpi75PeN2jeh_8PzsgmlPcyrf85v7s7VV3Q4HrnMwZU/gviz/tq?tqx=out:csv"
};
```

Paste a Google **Sheet** link (not an .xlsx file in Drive) for any report. The sheet must be shared as **Anyone with the link can view**. The page then reads it every time it opens or when you click **Refresh now**. Excel files stored in Drive cannot be read this way; use **File → Save as Google Sheets** first, or load them on the Data tab.

**Privacy:** a GitHub Pages site is public, and a sheet shared "anyone with the link" can be opened by anyone who has the link. The reports contain customer names and phone numbers, so prefer loading files on the Data tab, or use a private repository with GitHub Pages access control (GitHub Enterprise).

## What stays in the browser

Handover ticks, remarks and photos are saved in the browser where they were entered. They are not shared between computers on the website version. The claude.ai version of the dashboard shares them across the team.
