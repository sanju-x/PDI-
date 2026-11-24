# AM Motors · PDI Yard dashboard

One-page website for the Maruti Suzuki PDI yard (Calicut and Malappuram): stock, PDI, transit, labour, pending deliveries, HSRP, IBND and sales handover. It reads the daily reports straight from Google Drive.

Version: 24 Nov 2026

## What is in this repository

| File | What it does |
|---|---|
| `index.html` | The whole dashboard (page, styles and code in one file) |
| `_worker.js` | Small Cloudflare server: fetches the reports from Google Drive for the page |
| `_headers` | Security and no-cache headers for Cloudflare Pages |
| `README.md` | This guide |
| `CHANGELOG.md` | What changed in each update |

`_worker.js` only runs on **Cloudflare Pages**. GitHub Pages cannot run it, so on GitHub Pages the reports would not load. Use GitHub to store the files and Cloudflare Pages to publish them.

## Deploy: GitHub → Cloudflare Pages

### First time
1. **GitHub:** sign in, click **New repository**, name it `pdi-yard`, choose **Private**, click **Create repository**.
2. Click **uploading an existing file**, drag in all files from this folder (`index.html`, `_worker.js`, `_headers`, `README.md`, `CHANGELOG.md`), then **Commit changes**.
3. **Cloudflare:** sign in at dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
4. Allow Cloudflare to see the `pdi-yard` repository, select it, click **Begin setup**.
5. Settings: Production branch `main` · Framework preset **None** · Build command **empty** · Build output directory `/`. Click **Save and Deploy**.
6. After about a minute the site is live at `https://pdi-yard.pages.dev` (or the name Cloudflare shows).

### Updating later
1. Open the repository on GitHub → **Add file → Upload files**.
2. Drop in the new `index.html`, `_worker.js` (and the other files if they changed). GitHub replaces files with the same name.
3. Click **Commit changes**. Cloudflare redeploys by itself in about a minute. Refresh the site.

If you already set up the project by **direct upload** instead of GitHub, you can keep doing that: Pages project → **Create new deployment** → upload the folder.

## Reports the dashboard reads

All files are read from Google Drive and re-checked every few minutes and on **Refresh now**.

| Report | Default Drive file | Cloudflare variable to change it |
|---|---|---|
| Stock | stock_report.xlsx `1zNqp-9UlA2THEuOGXVtfTFnlPSdvmXQ9` | `STOCK_FILE` |
| IBND | ibnd_report.xlsx `1WAC-ubcYUNUkj4SiJiWShcmizdUCBU89` | `IBND_FILE` |
| Final plan | Final_Plan_Report.xlsx `13OviUV91xngJ4uYl9mc4uHVn_gULyLvr` | `PLAN_FILE` |
| Job card work | jobcard_work_report.xlsx `1HRbZT0NEnRYzKG4AC-P7MaO80cpnTjMh` | `JOBCARD_FILE` |
| Delivery (Google Sheet) | delivery Report `1Kpi75PeN2jeh_8PzsgmlPcyrf85v7s7VV3Q4HrnMwZU` | `DELIVERY_SHEET` |
| Delivery (Excel) | delivery_Report.xlsx `1FEm4wAk5Qnm52xgJlsXyfhiUqn4ygpz9` | `DELIVERY_FILE` |
| HSRP | hsrp_report.xlsx `1pOFtvF24mXXDHM7jJcn7ZSu-9nU52v0o` | `HSRP_FILE` |
| Pending bookings | Pending_booking_report.xlsx `1R0vC3UkcP_uwi28NLy5g1E-UtB_iq5U2` | `BOOKING_FILE` |
| Sales invoices | sales_invoice_report.xlsx `1NoRum7O3fZDgzFbP8-YeSE1UFdocHl_B` | `INVOICE_FILE` |
| TVP status | TVP_STATUS.xlsx `1wkUjkv1M2zVxGfSfDnsVnUdo1z_hpx9y` | `TVP_STATUS_FILE` |
| TVP stock | TVP_STOCK.xlsx `1E4YPkj9TObSAqHiBvtETcjJ2Oqlo4m2g` | `TVP_STOCK_FILE` |

Drive folders: main PDI folder `1IYtAvPPFMB3crzHoo-wJclC7IuZaeb0q`, second folder (bookings, invoices, TVP) `1Kkm1ezevWiP_76q5e7vkMp-GjXj9x9lp`.

To change a file: Cloudflare → Pages project → **Settings → Variables and Secrets → Add** (type Text), name from the table, value = the Drive link or file ID. Then redeploy (commit anything on GitHub, or **Retry deployment**).

### Keep the site on the newest files

The site reads the file IDs above. Choose one way to keep it current:

1. **Upload new versions, not new files (no setup).** In Drive right-click the report → **File information → Manage versions → Upload new version**. The link stays the same.
2. **API key (recommended if you upload new files each day).** The site then lists both folders and always reads the newest file of each report.
   1. Share both Drive folders **Anyone with the link → Viewer**.
   2. console.cloud.google.com → create a project → **APIs & Services → Library → Google Drive API → Enable**.
   3. **APIs & Services → Credentials → Create credentials → API key**. Copy it.
   4. Cloudflare → Pages project → **Settings → Variables and Secrets → Add**, type **Secret**, name `GOOGLE_API_KEY`, paste the key. Redeploy.
3. **Service account (keeps the files private).** Create a service account in Google Cloud with the Drive API enabled, download its JSON key, share both Drive folders and the delivery Google Sheet with its email as Viewer, and add the whole JSON as the Secret `GOOGLE_SERVICE_ACCOUNT` in Cloudflare. Optional: `DRIVE_FOLDER_ID`, `DRIVE_FOLDER_ID2`, `EXTRA_FILE_IDS`.

The **Data** tab shows which file each report came from, when it changed, and any file that failed to load and why. You can also drop Excel files on the Data tab to load them by hand.

## Keep it private (recommended)

The reports hold customer names and phone numbers.
1. Cloudflare → Pages project → **Settings → General → Access policy → Manage** (or **Zero Trust → Access → Applications → Add → Self-hosted**).
2. Domain: `pdi-yard.pages.dev` (and any custom domain).
3. Policy: Action **Allow**, Include **Emails** (list each person) or **Emails ending in** your company domain.
4. Save. Visitors get a one-time code by email before the dashboard opens. Free for up to 50 users.

Keep the GitHub repository **Private** as well.

## Pages and the rules behind the numbers

**Top filters (all pages):** date range (Latest day, Last 7 days, MTD, All, From/To), model, location, search.

**Overview**
- Total stock, at yard, in transit (Source: All / Stock / IBND; Type: All / PDI stock / Other). PDI stock = Vehicle Status OK in the stock report and in IBND.
- HSRP card, carry-forward stock, stock ageing.
- IBND · fund ≥ 75% · plan not entered: IBND rows with Fund % ≥ 75 and a blank Plan Entered Date (list + Excel).
- Labour: total, per person, per car, and by location (completed job lines, Assigned Date in range).

**Stock** – filters with counts, movement switch (Fast / Normal / Slow / No sale), ageing / stock health / lead time drill-downs (model → variant → colour, click a colour for its vehicles), carry forward, by location, vehicle list. Ageing buckets 0–13, 14–20, 21–30, 31–45, 46–60, 61–90, 90+.

**Labour**
- Total labour = sum of Labour Charge on job card rows with Status Completed and Assigned Date in range. Location by supervisor (Calicut: Noufal K, Prabin, Rinas T; Malappuram: Jamsheer P, Midhun Ajay T T, Ahammed Shafeeq TK, Misbahudheen Chalil), else the IBND stock location.
- Not yet completed = Labour Charge of lines in range that are Pending or Hold (cancelled lines left out); not included in the total.
- Final plan to today · pending job cards: final plan vehicles not delivered whose PDI Work Status is not Completed, by days since Final Plan Date (0–3, 4–5, 6–10, more than 10). "Not entered" = in the final plan but not in the job card report. Click a number for the vehicles, with job card remarks in the first column.

**HSRP**
- Filters: HSRP status, Reg. mode (TP), work status. Follows the date filter (Final Plan Date).
- Cards: Final plan, Delivered (in the delivery report), Delivery pending, Carry forward pending (final plan before the period, still not delivered), Total delivery pending.
- HSRP status: final plan Fitted, else the HSRP report (Received by Dealer / Ordered), else the final plan fitment status, else TP (Reg. mode is TP) or Pending. Received by Dealer and Ordered panels show the HSRP report totals.
- Table: delivery pending by HSRP status × days since the job card was completed (Same day, 1–3, 4–7, more than 7, Hold, Pending work, No job card). Click a number for the vehicles with remarks.

**IBND** – total (every row), average age, plan not entered (blank Plan Entered Date), 90+ days; plan-not-entered table by days since secondary dispatch × fund %; ageing drill-down.

**Every table** has a **⬇ Excel** button.

## Changes

See `CHANGELOG.md`.
