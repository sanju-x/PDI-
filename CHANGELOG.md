# Changelog

## 24 Nov 2026
- IBND: "plan not entered" counts every row with a blank Plan Entered Date (612 on 24 Nov). Works when the report has one or two secondary dispatch date columns; rows without a dispatch date get their own row.
- HSRP: status now comes from the HSRP report (Received by Dealer 133, Ordered 30 on 24 Nov) unless the final plan says Fitted.
- Overview: new card for IBND vehicles with fund ≥ 75% and plan not entered; labour card now shows total, per person, per car and by location.
- Labour: "Not yet completed" leaves out cancelled lines. The final-plan pending list shows job card remarks in the first column.
- Refresh: the newest copy of each report is used across both Drive folders; opening-stock files are no longer mistaken for the stock report. Website defaults updated to the 24 Nov bookings, invoices and TVP files. Optional `GOOGLE_API_KEY` makes the site pick the newest files automatically.

## 20 Nov 2026
- HSRP page rebuilt: final plan, delivered, delivery pending cards; status panels (Received by Dealer, Ordered, TP, Pending, Fitted); HSRP status and Reg. mode filters; table by HSRP status × days since job card completed; work status filter; Hold / Pending work columns; date filter; carry-forward pending deliveries.
- Labour: "Not entered" row in the final plan to today table.
- Delivered = in the delivery Google Sheet or delivery_Report.xlsx.

## 14 Nov 2026
- Stock and IBND pages per spec: drill-downs, stock health, lead time, movement, Excel export on every table, car-carrier loading animation.
- Labour: final plan to today ageing of pending job cards. HSRP report added.
- Fixed: final plan "Delivery Date" is a planned date, not a delivery.
