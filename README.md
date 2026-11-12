# AM Motors · PDI Yard dashboard

One-page website (`index.html`) for stock ageing, carry-forward stock, PDI, transit, labour, pending, HSRP, IBND and sales handover.

## Load the reports from Google Drive automatically

`_worker.js` is a small server that runs on Cloudflare with the site. It reads the PDI Drive folder with a Google **service account** (a robot Google account that can only read what you share with it). The page then loads the newest stock, IBND, final plan and job card files on its own, re-checks every 10 minutes, and only downloads a file again when it has changed.

**1. Create the service account (Google Cloud, one time)**
1. Open console.cloud.google.com and create a project, for example `pdi-yard`.
2. Go to **APIs & Services → Library**, search **Google Drive API**, click **Enable**.
3. Go to **IAM & Admin → Service Accounts → Create service account**. Name it `pdi-dashboard`, click **Create and continue**, skip the roles, click **Done**.
4. Open the new service account → **Keys → Add key → Create new key → JSON**. A `.json` file downloads. Keep it private.
5. Copy the service account's email (looks like `pdi-dashboard@pdi-yard.iam.gserviceaccount.com`).

**2. Share the reports with it (Google Drive)**
1. Right-click the PDI folder (the one holding stock_report.xlsx, ibnd_report.xlsx, Final_Plan_Report.xlsx, jobcard_work_report.xlsx) → **Share** → paste the service account email → **Viewer** → Send.
2. Do the same for the **delivery Report** Google Sheet.

**3. Give the key to Cloudflare**
1. Cloudflare dashboard → **Workers & Pages** → your `pdi-yard` project → **Settings → Variables and Secrets** → **Add**.
2. Type **Secret**, name `GOOGLE_SERVICE_ACCOUNT`, value: open the downloaded `.json` file in Notepad, copy everything, paste. Save.
3. Optional: `DRIVE_FOLDER_ID` if the reports move to another folder (default `1IYtAvPPFMB3crzHoo-wJclC7IuZaeb0q`), and `EXTRA_FILE_IDS` for other single files (default: the delivery sheet).
4. Upload the folder again (**Create new deployment**) so the setting takes effect.

Open the site: the loading animation runs and the reports appear. If something is missing, the **Data** tab says which file and why. Keep uploading the day's Excel files to the same Drive folder with the same names.

The server only reads files inside that folder plus the extra files you list. Protect the site with Cloudflare Access (below) so only your team can open it.

## Publish on Cloudflare Pages

**Option A: direct upload (no GitHub needed)**
1. Sign in at dash.cloudflare.com and open **Workers & Pages**.
2. Click **Create → Pages → Upload assets**.
3. Name the project, for example `pdi-yard`, and click **Create project**.
4. Drop the unzipped `pdi-yard` folder (with `index.html`, `_worker.js` and `_headers`), then click **Deploy site**.
5. The site is live at `https://pdi-yard.pages.dev`. To update it, open the project, choose **Create new deployment**, and upload the folder again.

**Option B: from GitHub (updates deploy automatically)**
1. Put `index.html`, `_worker.js` and `_headers` in a GitHub repository (see below).
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
