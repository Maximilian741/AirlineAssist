// GENERATED from each airline's published change/cancel policy (researched + adversarially verified) by scripts/extract-scorecard.mjs — do not hand-edit.
window.FAREDROP = {
  "verifiedDate": "2026-09-13",
  "airlines": [
    {
      "iata": "DL",
      "name": "Delta Air Lines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Main Classic and above, tickets originating in the 50 U.S. states, Canada, Puerto Rico and USVI); $0-$500 for tickets originating elsewhere, depending on origin and fare",
      "changeFeeNum": 0,
      "basicEconomy": "Delta Basic (Basic Economy): cancellable before departure for a cancellation charge, remainder issued as eCredit — $99 for travel within the 50 U.S. states, Canada, Puerto Rico and USVI; $199 for long-haul international travel from the U.S. (amount may vary internationally; delta.com overview shows a $99-$500 range). Changes: per Delta's agency site, Basic fares are 'Changeable for a fee. Check the fare rules for more details.'; delta.com overview shows '$0-$400 Change Fee + Price Difference' after the 24-hour risk-free window. Excluded from Same-Day Confirmed and Same-Day Standby regardless of Medallion status, and excluded from the no-change-fee policy.",
      "creditExpiry": "eCredit expires 1 year from purchase date (i.e. the original ticket's issue date), unless your ticket terms state otherwise; eCredits from Delta-caused cancellations/significant delays or schedule changes are valid 5 years from issuance",
      "howTo": [
        "Go to My Trips on delta.com or the Fly Delta app and locate your trip (name and confirmation number, credit/debit card number, or ticket number).",
        "Select the flight, then choose 'Change or Add Flights' on the Trip Details page and select the SAME flight at the new, lower fare.",
        "Complete checkout: 'If your new flight costs less than your original flight minus any applicable change fees, the difference will be issued to you as a Delta eCredit.'",
        "Alternative cancel-then-rebook route ('Need to Cancel?' -> 'Start Flight Cancellation', remainder returned as eCredit, then rebook) exists but is two transactions — the fare can rise between them; the change flow reprices in one step, so prefer it."
      ],
      "sameDayNote": "Fully self-serve in My Trips before departure; the checkout screen shows either the amount due or the eCredit difference. The reprice yields an eCredit, never cash back to the card for non-refundable fares, and the eCredit clock runs from the ORIGINAL purchase date. Tickets originating outside the 50 U.S. states/Canada/PR/USVI may carry a change fee ($0-$500) that eats the fare drop — the eCredit is only the difference net of any change fee. Basic fares are excluded from Same-Day Confirmed/Standby programs.",
      "sourceUrls": [
        "https://www.delta.com/us/en/change-cancel/how-to-cancel-or-change-your-flight",
        "https://www.delta.com/us/en/change-cancel/change-flight",
        "https://www.delta.com/us/en/change-cancel/cancel-flight",
        "https://www.delta.com/us/en/change-cancel/overview",
        "https://www.delta.com/us/en/travel-planning-center/change-or-cancel-your-trip/cancel-change-requirements",
        "https://pro.delta.com/content/agency/us/en/products-and-services/other-programs-services/basic-economy.html"
      ],
      "notes": "canReprice=true for standard economy (Delta Main Classic, non-Basic) on tickets originating in the 50 U.S. states/Canada/PR/USVI: change to the same flight at the lower fare with $0 change fee ('There are no change fees for travel originating within the 50 United States, Canada, Puerto Rico and the U.S. Virgin Islands (excluding Delta Basic experiences)') and the difference posts as an eCredit (verbatim policy on the how-to-cancel-or-change page). It is never cash to the original payment method for non-refundable fares; Extra and refundable tickets cancel to the original form of payment instead. Delta's 2025 fare rebrand uses 'Basic / Classic / Extra' experiences (Basic Economy = Delta Basic). Basic cancellation figures ($99 domestic-region / $199 U.S.-origin long-haul international, 'may vary internationally') verified on pro.delta.com (official Delta agency policy site); delta.com consumer overview shows ranges without a per-route table ('Remaining Value Minus Cancellation Charge ($99-$500)' and '$0-$400 Change Fee + Price Difference') — exact Basic international amounts depend on route (see Baggage & Travel Fees page). Note delta.com is internally inconsistent on the change-fee ceiling: change-flight says '$0-$500' for non-U.S./Canada origins while the overview table shows '$0-$400' for Basic/Classic — both live as of 2026-09-13. eCredit 1-year-from-purchase expiry verified verbatim on the cancel-flight page ('Your eCredit will expire 1 year from purchase date, unless your ticket terms state otherwise'); cancel-change-requirements confirms 'one year from the ticket's original issue date'. The 5-year validity applies only to credits from significant delays/schedule changes (airline-caused disruption)."
    },
    {
      "iata": "UA",
      "name": "United Airlines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Economy, Economy Plus and premium cabins on U.S. domestic incl. PR/USVI, U.S.-Mexico, U.S.-Caribbean, and international originating in the U.S.; Basic Economy excluded; \"International flights that don't originate in the U.S. can be changed but change fees still apply\")",
      "changeFeeNum": 0,
      "basicEconomy": "Not changeable: \"The only way to make changes to a Basic Economy trip is to cancel your flights and book new ones\" — unless you first add flexibility (\"you can't change your flight unless you upgrade to Economy or a premium cabin first\"; via My Trips \"you can add the option to change or cancel your flight\" — price of the add-on not published). Cancellable: \"If you cancel within 24 hours of purchase, you'll get a full refund\" (24-hour policy requires booking \"at least one week in advance\"); \"After 24 hours, you'll get a partial travel credit\" — united.com does not publish the deduction amount.",
      "creditExpiry": "\"In most cases, travel credits expire one year after the date they were issued\" (united.com/travel/credit.html, live 2026-09-13). Future flight credit: a \"travel by\" date — the trip must begin before the date listed on the credit. Travel certificate: a \"book by\" date — \"Most travel certificates expire 12 months after the original date they're issued.\"",
      "howTo": [
        "Go to My Trips on united.com or the United app",
        "Select \"Change flight\", then \"Edit\" to update your flight",
        "Choose the same flight at the new lower fare (no change fee on covered routes; you pay/receive any fare difference)",
        "The fare difference posts as a travel credit; alternatively use \"Cancel flight\" -> \"Confirm cancellation\" (\"Once confirmed, we will give you the options for a travel credit or a refund\") and rebook — but the fare can rise between cancelling and rebooking"
      ],
      "sameDayNote": "Online/app changes are free self-serve; changing by phone \"might\" incur a fee, so use united.com or the app. \"Any changes or cancellations must occur prior to ticketed travel date.\" Same-day confirmed changes: Premier members \"may be able to get another flight for free\" (price difference only if the original fare class is unavailable); all other travelers may switch to a flight within 24 hours of the original but \"may have to pay a price difference even if the same cabin is available\" (new flight must have the same departure and arrival airport). Same-day standby for an earlier flight is \"free to join\" for everyone. Repricing is unlimited: \"You can change your flight as many times as you want without change fees.\"",
      "sourceUrls": [
        "https://www.united.com/en/us/fly/travel/trip-planning/flexible-booking-options.html",
        "https://www.united.com/en/us/fly/travel/trip-planning/flight-change.html",
        "https://www.united.com/en/us/fly/travel/inflight/basic-economy.html",
        "https://www.united.com/en/us/fly/travel/credit.html"
      ],
      "notes": "Fact-check 2026-09-13: all four official pages re-read LIVE via the r.jina.ai proxy (united.com blocks direct fetches, but the proxy worked, superseding the researcher's Wayback-only sourcing); every load-bearing quote verified verbatim against current content. canReprice=true applies to the $0-change-fee scope (domestic + U.S.-originating international); international tickets not originating in the U.S. can be changed but change fees still apply. Refund of the difference on a change is a travel credit, never cash to card; cash to original payment only via the 24-hour booking policy (book 1+ week before departure, cancel within 24h) or refundable fares. Basic Economy post-24h cancellation deduction is not published on united.com policy pages — third-party figures (~$49.50/$99) failed verification and were removed. Award travel: \"all fees were removed for canceling and changing award flights.\" Credit expiry on the live page is measured from credit issuance; the date printed on the credit governs."
    },
    {
      "iata": "AA",
      "name": "American Airlines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Main Cabin and above) for travel beginning in North or South America; up to $400 'if different point of origin'; Basic Economy cannot be changed (the fee table's voluntary-change row has no Basic Economy fee; exception: trips originating in Europe excl. Finland/Estonia/Latvia/Lithuania can be changed for a fee)",
      "changeFeeNum": 0,
      "basicEconomy": "No changes allowed after the 24-hour purchase window (exception: trips originating in Europe, excluding Finland/Estonia/Latvia/Lithuania, can be changed for a fee). Cancellation for credit is possible only for AAdvantage members: Trip Credit minus a cancellation fee of $99 (within the 48 contiguous US states), $129 (to/from Hawaii and Alaska within the US — for cancellations on/after Oct 14, 2025; and from the US to Puerto Rico, USVI, Caribbean excl. Dominican Republic, Mexico, Central America, Colombia, Guyana, Peru, Canada — on/after Apr 11, 2025), or $199 (from the US to Argentina, Brazil, Chile, Uruguay, Europe, Middle East, India, China, Japan, South Korea, Australia, New Zealand — on/after Apr 11, 2025). Conditions: ticket booked in the US directly with American, US resident, on an American-marketed and -operated flight starting in the 50 US states, AAdvantage number in the reservation before canceling, canceled on aa.com or the app before the first flight departs. If the fee is more than the ticket price, no travel credit is issued. Full refund to original payment only within 24 hours of purchase if booked 7+ days before departure.",
      "creditExpiry": "Trip Credit: valid until 11:59 p.m. CT on the date listed on the credit — for credits issued on/after April 2, 2024, that is 12 months for AAdvantage members who cancel on aa.com or the app with their AAdvantage number in the reservation, 6 months for non-members (5 years from the qualifying delay/cancellation for DOT-eligible flights). Flight Credit (issued when canceling through any channel other than aa.com/the app, e.g. by phone): travel must begin within 1 year of the original ticket issue date.",
      "howTo": [
        "Log in at aa.com or the American app -> 'Your trips' (or Find your trip with confirmation code) -> open the trip -> 'Change trip'.",
        "Select the same flight at the new lower fare and confirm - no change fee for Main Cabin and above on travel beginning in North or South America (any applicable penalty per the fare rule is deducted from the residual).",
        "The remaining value from the exchange is issued as Trip Credit (delivered by email, and visible under 'Travel credit' in your AAdvantage account) - not cash back to card.",
        "If the online change flow won't show the lower fare: 'Cancel trip' on aa.com (full unused value becomes Trip Credit), then rebook the same flight - risk: the fare can rise between canceling and rebooking."
      ],
      "sameDayNote": "Repricing is self-serve on aa.com/app; a $50 'Assistance by Reservations' fee 'applies for voluntary trip changes not initially created by American Airlines Reservations or on aa.com'. The ticket must be changed/canceled before the first flight departs or it loses all remaining value. The $0 change fee applies 'before day of travel'; on departure day, same-day confirmed flight change is 'Starting at $60' for Basic Economy and Main Cabin (price varies by itinerary), 'Not available' for Premium Economy, and $0 in Business/First. Within 24 hours of booking (if booked 7+ days before departure), cancel for a full refund to original payment and rebook at the lower fare instead - the only way to capture a fare drop as cash.",
      "sourceUrls": [
        "https://www.aa.com/web/i18n/customer-service/payment-options/travel-credit.html",
        "https://www.aa.com/web/i18n/customer-service/support/optional-service-fees.html",
        "https://www.aa.com/i18n/travel-info/experience/seats/basic-economy.html",
        "https://www.aa.com/web/i18n/customer-service/faqs/customer-service-faqs.html",
        "https://saleslink.aa.com/en-US/resources/html/reissue-policies.html"
      ],
      "notes": "AA publishes no dedicated consumer 'fare drop guarantee' page; repricing follows from three verified official rules: (1) $0 voluntary change fee before day of travel for Main Cabin+ beginning in North/South America, 'Up to $400 if different point of origin', with fee-table caveat 'Fee varies depending on type of ticket purchased' (optional-service-fees.html); (2) on non-refundable exchanges the customer keeps the residual unless the fare rule says otherwise, with any penalty deducted from it (SalesLink Reissue Policies); (3) Trip Credit is 'Issued for... refunds and remaining value when exchanging tickets' (travel-credit.html). The difference is always credit, never cash: 'We don't refund cash for non-refundable tickets' (customer-service FAQs). Cancel channel matters: aa.com/app cancel -> Trip Credit (12-month member expiry per travel-credit.html); 'any other channel' (FAQ wording) -> Flight Credit (travel must begin within 1 year of ORIGINAL ticket issue date, potentially much shorter). No-show rule verified verbatim: 'you must cancel your ticket before the first flight departs, or the ticket will lose any remaining value.' Basic Economy cancellation tiers were phased in: $99 tier predates them, $129 Caribbean/Latin and $199 long-haul apply to cancellations on/after Apr 11, 2025, and the $129 Hawaii/Alaska tier on/after Oct 14, 2025 (fee-table Applies notes). Practical caveat (community-reported, not official): the aa.com change flow does not always display the same flight at the lower price, in which case cancel-then-rebook is the fallback. Refundable tickets are the exception: exchange to a lower fare refunds the difference to the original form of payment (SalesLink). All fee amounts and quotes re-verified against live aa.com pages on 2026-09-13 (fetched via r.jina.ai proxy; aa.com blocks direct fetches)."
    },
    {
      "iata": "WN",
      "name": "Southwest Airlines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Southwest charges no change fees on any changeable fare; Basic fares cannot be changed at all — only upgraded to a Choice-tier fare or canceled)",
      "changeFeeNum": 0,
      "basicEconomy": "Basic fares cannot be changed; per Southwest, 'you must first upgrade your reservation to Choice, Choice Preferred, or Choice Extra fare' (paying the fare difference) before changing. Basic CAN be canceled for free up to 10 minutes before scheduled departure, receiving a non-transferable flight credit that expires six months from the date the reservation was originally booked. Non-refundable except under the 24-hour booking rule. To capture a fare drop on Basic the only route is cancel-then-rebook.",
      "creditExpiry": "Flight credits created on or before May 27, 2025 do not expire. Credits from reservations booked or changed on or after May 28, 2025: Transferable Flight Credit from Choice, Choice Preferred, or Choice Extra fares expires 12 months from the date the reservation was originally booked; Basic-fare flight credit expires six months from the original booking date. These durations apply to bookings paid by credit card, PayPal, Apple Pay, Flex Pay, or Klarna — other payment/voucher types can carry different expiration dates per Southwest's chart. Credits from significantly disrupted flights are valid 5 years from the original booking date.",
      "howTo": [
        "Log in at Southwest.com or the app, open Manage Reservations / My Trips, select the trip, and click 'Change' (allowed until 10 minutes before original scheduled departure time).",
        "Select the same flight (same date and flight number), which now shows the lower fare, and confirm the change — Southwest charges no change fee.",
        "The difference is issued as a flight credit or Transferable Flight Credit for non-refundable (Choice) fares; for refundable (Choice Preferred/Choice Extra) fares it can be refunded to the original payment method or held as Transferable Flight Credit; for points bookings the Rapid Rewards points difference is returned to the original account.",
        "Basic fares have no Change option: cancel up to 10 minutes before departure (credit expires six months from the ORIGINAL booking date) and rebook at the lower price — risk: the fare can rise between canceling and rebooking, and the replacement credit keeps the short expiry clock running from the original booking."
      ],
      "sameDayNote": "Fully self-serve on web/app up to 10 minutes before scheduled departure; with no change fees there is no stated limit on repeating the change each time the fare drops (Southwest does not explicitly address repetition). Separately, Choice and higher fares include free same-day change/standby (taxes and fees may apply); it is not listed as a Basic benefit. Note the 2025 fare-lineup change: Wanna Get Away et al. were replaced by Basic/Choice/Choice Preferred/Choice Extra, and the never-expiring credit policy only applies to credits created on or before May 27, 2025.",
      "sourceUrls": [
        "https://support.southwest.com/helpcenter/s/article/lower-fare-refund",
        "https://support.southwest.com/helpcenter/s/article/changing-cancelling-flights",
        "https://support.southwest.com/helpcenter/s/article/flight-credits",
        "https://www.southwest.com/airfare-types-benefits/"
      ],
      "notes": "refundForm 'credit' reflects the standard non-refundable Choice fare (the non-basic economy tier): the fare-drop difference is held as a flight credit / Transferable Flight Credit, not cash. Refundable Choice Preferred and Choice Extra fares can instead have the difference refunded to the original payment method (or held as Transferable Flight Credit); points bookings get points back to the Rapid Rewards account. All facts re-verified 2026-09-13 against official Southwest help-center and fare-benefits pages: 'Southwest doesn't charge fees to change your flights'; changes allowed 'up until 10 minutes before your original scheduled departure time' (e.g., 8:00 a.m. departure changeable until 7:50 a.m.); credit expiries are measured 'from the date you originally booked the reservation'; disrupted-flight credits valid five years from original booking date."
    },
    {
      "iata": "AS",
      "name": "Alaska Airlines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Main and First Class; Saver fares not changeable except same-day confirmed changes for a fee)",
      "changeFeeNum": 0,
      "basicEconomy": "Saver fares: not changeable (\"Saver fares permit same-day confirmed changes; no other changes allowed\" - same-day confirmed change costs the standard $50/$75 fee plus an additional $40 per change for Saver). Cancellable: full refund within Alaska's 24-hour cancellation policy; otherwise, for tickets purchased on or after July 19, 2023, a credit of 50% of the ticket value if canceled at least 14 days prior to departure of the first flight on the ticket. Canceled inside 14 days (outside the 24-hour window): no credit (\"No other changes or refunds are allowed to Saver fares outside of our 24-hour cancellation policy and same-day confirmed policies\"). No-show on a Saver fare: all segments canceled, total fare forfeited.",
      "creditExpiry": "Credit certificates are \"valid for 12 months from the issue date of your original ticket, or 30 days from the date of exchange or cancellation, whichever is greater.\" The credit must be used to purchase a new ticket before the expiration date; travel can take place up to 11 months later.",
      "howTo": [
        "Go to alaskaair.com -> Trips -> look up your reservation with your confirmation number and last name (or sign in).",
        "Choose the flight you'd like to change.",
        "Select the flight at the new, lower price - 'Any difference in fare or credit due will be displayed on the right.'",
        "Continue to checkout to finalize the change; the residual value is issued as travel credit (deposit to your Atmos Rewards wallet or a credit certificate emailed with code + PIN)."
      ],
      "sameDayNote": "Changes must be made before the original flight departs (no-show policy: otherwise the entire reservation is canceled and nonrefundable value is forfeited). Online changes require booking directly with Alaska/Hawaiian, no one checked in, max 7 guests/8 segments, and no government fares, group bookings, or special service requests (e.g. pets). Same-day confirmed changes (check-in window, same calendar day, same origin/destination/thru/connection cities, itinerary within North America): $50 nonstop Seattle-Portland or nonstop intrastate, $75 all other routes, +$40 per change for Saver fares; no fare difference is charged on same-day changes. Fee waived for refundable J/Y fares; on other Main/First fares waived for Atmos Gold/Platinum/Titanium members, Atmos Rewards Summit Visa Infinite primary cardholders, and American AAdvantage ConciergeKey/Executive Platinum/Platinum Pro members. Same-day standby is not allowed on Saver fares regardless of status. Policy pages explicitly cover both Alaska and Hawaiian Airlines (ticket numbers starting 027).",
      "sourceUrls": [
        "https://www.alaskaair.com/content/travel-info/policies/how-to-manage-my-reservation",
        "https://www.alaskaair.com/atmosrewards/content/account-help/credit-certificates",
        "https://www.alaskaair.com/content/travel-info/at-the-airport/same-day-flight-changes",
        "https://www.alaskaair.com/content/travel-info/flight-experience/saver"
      ],
      "notes": "Repricing works through the normal free change flow: rebook the flight at the lower fare and the difference is shown as 'credit due' at checkout (the page's wording is 'Select a new flight' - it does not explicitly address selecting the identical flight, but no change fee applies and any credit due is displayed before you finalize; cancel-then-rebook is also free for Main/First, with the risk the fare rises between steps). The difference never goes back to the card on nonrefundable fares (certificates \"cannot be redeemed for cash, check, or gift certificates and cannot be credited back to a charge card\"); customer chooses Atmos Rewards wallet deposit or an emailed credit certificate (code + PIN, from service@iflyalaska.com). Certificates are redeemable only at alaskaair.com/app (\"may not be redeemed through a travel agency or any other channel\"), usable toward fare plus applicable taxes and government-imposed fees on Alaska-, Hawaiian-, and partner-operated flights, max 6 per reservation, non-transferable; service charges and baggage fees need another payment form. Saver fare drops are effectively uncapturable after the 24-hour window (no changes; canceling yields only 50% credit and only 14+ days out). Fee amounts and quotes verified against live alaskaair.com pages on Sept 13, 2026 (site now branded Atmos Rewards, post-Hawaiian merger)."
    },
    {
      "iata": "HA",
      "name": "Hawaiian Airlines",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Main and First Class; fare difference may apply)",
      "changeFeeNum": 0,
      "basicEconomy": "Saver (the merged Alaska/Hawaiian basic fare; Hawaiian's legacy \"Main Cabin Basic\" no longer appears in current policy pages) — changes: not allowed except a same-day confirmed change for a fee ($75 standard + $40 Saver surcharge = $115; $50 + $40 = $90 for Seattle-Portland nonstop or nonstop intrastate flights). Cancellation: full refund to original payment within 24 hours of purchase (if travel starts more than 24 hours out); otherwise, for tickets purchased on/after July 19, 2023, a credit of 50% of the ticket value when canceled at least 14 days before departure of the first flight on the ticket. Inside 14 days there is no cancellation credit; the only remaining option is the paid same-day confirmed change on the day of travel.",
      "creditExpiry": "Credit certificates are \"valid for 12 months from the issue date of your original ticket, or 30 days from the date of exchange or cancellation, whichever is greater\"; the credit must be used to purchase the new ticket before the expiration date (travel itself can take place up to 11 months later).",
      "howTo": [
        "On alaskaair.com (Hawaiian-branded tickets are managed there post-merger): \"Look up your reservation with your confirmation number and last name\" via Find my trip / Manage trip.",
        "\"Choose the flight you'd like to change.\"",
        "\"Select a new flight. Any difference in fare or credit due will be displayed on the right.\" (a lower current fare shows as credit due)",
        "\"Continue on to checkout to finalize the change(s).\" The remaining value is issued as a credit certificate (emailed code + PIN from service@iflyalaska.com) or can be deposited into your Atmos Rewards account wallet - not cash back to card."
      ],
      "sameDayNote": "Change/cancel is self-serve online if booked directly with Alaska or Hawaiian; call reservations 1-800-252-7522 if not eligible online (Saver except same-day changes, government fares, after check-in, >7 guests, >8 segments, special service requests); group bookings use the groups desk 1-800-445-4435. Must change or cancel BEFORE departure - the no-show policy forfeits the entire nonrefundable ticket value. Same-day confirmed changes (check-in window, same calendar day, same cities, ticket must be 027 stock on Alaska/Hawaiian/Horizon/SkyWest metal within North America) cost $75 per change ($50 for Seattle-Portland nonstop or nonstop intrastate; +$40 for Saver) with NO fare difference charged - fee waived on Main/First for Atmos Gold/Platinum/Titanium, Atmos Rewards Summit Visa Infinite primary cardholders, and American AAdvantage ConciergeKey/Executive Platinum/Platinum Pro members, and on refundable J/Y fares.",
      "sourceUrls": [
        "https://www.alaskaair.com/content/travel-info/policies/how-to-manage-my-reservation",
        "https://www.alaskaair.com/content/mileage-plan/my-account/credit-certificate-terms",
        "https://www.alaskaair.com/content/travel-info/at-the-airport/same-day-flight-changes",
        "https://www.alaskaair.com/content/travel-info/optional-services-fees",
        "https://www.alaskaair.com/content/travel-info/fly-alaska/24-hour-cancellation",
        "https://www.hawaiianairlines.com/content/advisories/flexible-travel-policies"
      ],
      "notes": "Alaska Airlines policy now governs Hawaiian-branded tickets. Independently re-verified 2026-09-13 from live pages: hawaiianairlines.com/legal/domestic-contract-of-carriage/rule-5 returns 301 to alaskaair.com/content/legal/contract-of-carriage; hawaiianairlines.com/manage-flights and /legal/updated-change-policies return 302 to the same paths on www2.hawaiianairlines.com (which refuses automated access, HTTP 403 - a homepage redirect could not be confirmed); the old help site hawaiianair.custhelp.com is NXDOMAIN. Advisories still hosted on hawaiianairlines.com are titled \"Alaska and Hawaiian Airlines\" and reference Alaska 027 ticket stock, Saver fares, the Account wallet, and credit certificates. Repricing mechanics: there is no published same-flight-repricing guarantee; the route is the standard fee-free change flow, which reprices at current fares and displays \"credit due\" when the new fare is lower - the difference comes back as a credit certificate or Atmos Rewards wallet deposit, never cash to card (exceptions: full refund within 24 hours of purchase for travel starting more than 24 hours out, and refundable fares). Cancel-then-rebook also works (Main/First cancel free to credit) but risks the fare rising between the two steps, so the one-transaction change flow is safer. Fee numbers are from the \"tickets issued on/after May 25, 2025\" table on the optional-services-fees page; tickets issued before May 25, 2025 use the older table: same-day change $50 standard, $25 for flights entirely within California or shuttle markets. All quoted policies were read from raw HTML of live alaskaair.com pages (Contentstack JSON content extracted) on 2026-09-13."
    },
    {
      "iata": "B6",
      "name": "JetBlue Airways",
      "defunct": false,
      "canReprice": true,
      "refundForm": "credit",
      "changeFee": "$0 (Main, EvenMore, Mint and all Flex fares; fare difference applies); Main Base/EvenMore Base $150 per person; +$25/person nonrefundable service fee if changed or cancelled by phone or chat instead of online",
      "changeFeeNum": 0,
      "basicEconomy": "Main Base (bookings from 7/30/26): changeable AND cancellable, each for a $150 per person fee plus any fare difference; cancellation returns a JetBlue travel credit minus the fee; same-day switch $100; carry-on bag included; advance seat selection costs extra. Legacy Blue Basic (booked on/before 7/29/26, now shown as \"Main Base\" in Manage Trips): changes NOT allowed at all; cancellable only, for $100 per person (North America/Central America/Caribbean routes) or $200 per person (all other routes), remainder as travel credit; same-day switches not allowed; carry-on included.",
      "creditExpiry": "JetBlue travel credit \"valid for 12 months from original ticketing date\" (not from issuance; our-fares footnote). It must be applied to a new or existing booking by the expiration date; travel itself may be later. Credits/expiration dates cannot be extended, and a credit re-deposited after canceling a rebooking keeps its original expiration date (an already-expired credit is not redeposited).",
      "howTo": [
        "Sign in to your TrueBlue/JetBlue account and open Manage Trips on jetblue.com or the app (JetBlue: any credit due 'will automatically be placed into your travel credit account' when you change/cancel online while logged in).",
        "Select the reservation, choose to change the flight, and pick the same flight at the current lower fare - Main and above have no change fee, but changes are 'subject to fare difference and fare rules applicable on date of change'.",
        "The difference is issued as a JetBlue travel credit (never cash on nonrefundable fares), valid 12 months from the ORIGINAL ticketing date.",
        "Alternative: because canceling Main is also free, you can cancel (full value to travel credit) and rebook at the lower fare - but the fare can rise between the two steps and JetBlue warns 'customer cancellations (for any reason) cannot be reinstated', so prefer the single change transaction."
      ],
      "sameDayNote": "Do it online: JetBlue charges a $25 nonrefundable per-person service fee for changes/cancellations made by phone or chat. Changes must be made before scheduled departure - on a nonrefundable fare not changed or cancelled before departure, 'all money associated with the reservation will be forfeited'. Same-day switches are a separate product ($100/person, no fare difference; free on Flex fares; fee waived for Mosaic, who can switch starting 24h before departure) and travel credits cannot be used to pay same-day switch fees; not available on legacy Blue Basic. Third-party/travel-agency bookings that JetBlue takes over managing incur a one-time $50/person service fee. Only cash-back route on nonrefundable fares: cancel within 24 hours of booking (if booked 7+ days pre-departure) with no cancellation fee for a refund, then rebook.",
      "sourceUrls": [
        "https://www.jetblue.com/flying-with-us/our-fares",
        "https://www.jetblue.com/help/manage-your-trip-online",
        "https://www.jetblue.com/legal/fees",
        "https://www.jetblue.com/help/travel-bank-credits",
        "https://www.jetblue.com/flying-with-us/previous-fares",
        "https://www.jetblue.com/travel-agents/cancellation-policy",
        "https://www.jetblue.com/help/mosaic"
      ],
      "notes": "JetBlue relaunched its fare lineup for bookings made 7/30/26 onward: Main Base / Main / Main Flex / EvenMore (Base, standard, Flex) / Mint (standard, Flex); Blue Basic, Blue, Blue Plus, Blue Extra apply only to bookings made on or before 7/29/26 (official previous-fares page: 'For details regarding fares for bookings made on 7/29/26 or earlier'). No consumer page words the \"same flight after a price drop\" case explicitly; the mechanism is $0 change fee + 'difference in fare applies' + the footnote that funds come back as a JetBlue travel credit; JetBlue's travel-agency change/cancellation policy likewise provides residual value on exchanges to a lower fare (held as an MCO for ARC agencies, or in a JetBlue travel credit account for BSP agencies). Key trap for travelers: the credit's 12-month clock runs from the original ticketing date, so a credit earned from repricing can have far less than 12 months left. Flex (refundable) fares are the exception to credit-only: they refund to original form of payment. Travel credits can pay airfare/taxes on jetblue.com bookings but NOT checked bags, seat fees, extra legroom, pets, unaccompanied-minor, same-day switches, or service fees. Carry-on is included on every fare including Main Base and legacy Blue Basic."
    },
    {
      "iata": "F9",
      "name": "Frontier Airlines",
      "defunct": false,
      "canReprice": "partial",
      "refundForm": "credit",
      "changeFee": "$0 at any time (Economy, Premium or Business bundles, and the separate \"Economy Fare\" type); Basic Fare/Standard tickets booked on or after Jun 5, 2026: $0 60+ days / $79 7-59 days / $129 0-6 days (incl. same day), per passenger per direction ($0/$49/$99 if booked on or before Jun 4, 2026) — plus fare difference; a lower fare returns nothing",
      "changeFeeNum": 0,
      "basicEconomy": "Basic Fare is changeable and cancellable before scheduled departure. Changes (per passenger, per direction, bookings on/after Jun 5, 2026): $0 if 60+ days before departure, $79 if 7-59 days, $129 if 6 days or less including same day ($0/$49/$99 for bookings on/before Jun 4, 2026), plus fare difference — if the new flight costs less, no refund or credit is issued. Cancellation: $129 per passenger per direction ($99 if booked on/before Jun 4, 2026); the remaining value is retained as a travel credit, and if the fee exceeds the ticket value no credit is retained.",
      "creditExpiry": "Per Contract of Carriage §9 (page stamped R0 01/16/26): ticket value less fees is \"retained for 365 days from the date of cancellation of the ticket\" as a refund travel credit; no cash value, same passenger only (the 90-day retention applied only to cancellations made before May 17, 2024). (Illness-related credits: valid five (5) years per FAQ and, unlike standard credits, transferable. Vouchers are a different instrument, most valid 90 days from issue date.)",
      "howTo": [
        "To capture a fare drop you must cancel-then-rebook (a \"Change Flights\" modification explicitly forfeits any price drop): go to flyfrontier.com -> My Trips and Travel Info -> Manage Trip, enter Last Name + Confirmation Code",
        "Select Cancel Booking and confirm — the ticket value minus any cancel fee ($0 on Economy/Premium/Business bundles and Economy Fare; $129 on Basic/Standard booked on/after Jun 5, 2026, $99 if booked on/before Jun 4, 2026) is retained as a travel credit",
        "Book the same flight again at the new lower price on flyfrontier.com; on the payment screen select \"Credit with Frontier\" and enter the six-character confirmation code from the original booking",
        "Risk: the fare can rise between cancelling and rebooking with no way back, and Frontier does not document whether leftover credit balance survives if the new fare is lower than the credit"
      ],
      "sameDayNote": "All voluntary changes/cancellations are self-serve on flyfrontier.com or the mobile app but must be completed before scheduled departure: FAQ states \"There is no refund for no-shows. The ticket is lost\" and all later flights on the itinerary including the return are cancelled as No-Show Cancellations (CoC §2.G/§19.C imposes a service charge equal to the full fare plus ancillaries). Same-day changes fall in the 0-6-day fee tier ($129 Basic/Standard booked on/after Jun 5, 2026; $0 with a bundle or Economy Fare). Never use the change/modify flow to chase a price drop — Frontier states a cheaper new itinerary leaves \"no residual value\".",
      "sourceUrls": [
        "https://www.flyfrontier.com/travel/travel-info/change-policy/",
        "https://faq.flyfrontier.com/help/will-i-be-charged-a-fee-to-change-my-reservation",
        "https://faq.flyfrontier.com/help/can-i-cancel-my-reservation",
        "https://faq.flyfrontier.com/help/can-i-get-a-refund-if-i-cancel-my-flight",
        "https://faq.flyfrontier.com/help/how-do-i-use-a-flight-credit",
        "https://faq.flyfrontier.com/help/how-to-change-flight-time-or-date",
        "https://faq.flyfrontier.com/help/i-didnt-use-my-ticket-can-i-use-it-later",
        "https://faq.flyfrontier.com/help/can-i-get-a-travel-credit-if-im-unable-to-travel-due-to-illness",
        "https://faq.flyfrontier.com/help/vouchers",
        "https://f9prodcdn.azureedge.net/media/11004/coc_r1_english.pdf"
      ],
      "notes": "Partial because Frontier has NO true repricing path: a direct change to the same flight at a lower fare forfeits the entire difference by explicit policy (change-policy page: \"If your new itinerary is lower in value than your original itinerary, there will be no residual value available to you once you have made the change\"). The only workaround is cancel-for-travel-credit then rebook, which is economically viable only where the cancel fee is $0 — Economy/Premium/Business bundles, the separate \"Economy Fare\" type, or Elite members (all tiers Silver through Diamond get waived fees per cancel FAQ) — or when the drop exceeds the $129 Basic/Standard cancel fee ($99 for bookings on/before Jun 4, 2026). Money always comes back as travel credit, never cash (cash refunds only within 24h of booking with departure 7+ days away per CoC §9.B, for death of passenger, DOT-required involuntary cases incl. cancellation or significant delay >3h domestic / >6h international not accepted, or Diamond Elite cancelling 24h+ out). Fee amounts are split by BOOKING date (on/before Jun 4, 2026 vs on/after Jun 5, 2026), so tickets bought before the cutoff still get the lower $49/$99 change and $99 cancel fees. Frontier's fare names are confusing: \"Standard\" is the legacy a-la-carte ticket and is fee-tiered like Basic; the non-basic tier consumers buy today (Economy bundle or Economy Fare) has $0 change/cancel fees at all times, hence changeFeeNum=0. Unverified/undocumented: whether residual travel-credit balance remains reusable when the rebooked fare is cheaper than the credit — Frontier FAQ only covers the credit being insufficient, not overshooting; app copy should not promise the leftover survives. All fee tables re-verified 2026-09-13 on the change-policy page and change-fee FAQ (last modified 2026-08-19 10:56 MDT); CoC PDF coc_r1_english.pdf (sections stamped R0 01/16/26, some R1 05/05/26) §9 confirms verbatim \"retained for 365 days from the date of cancellation of the ticket\", no cash value, same passenger only."
    },
    {
      "iata": "G4",
      "name": "Allegiant Air",
      "defunct": false,
      "canReprice": "partial",
      "refundForm": "credit",
      "changeFee": "$25 per passenger, per segment, plus any applicable airfare increase (\"temporarily reduced\" per the official fees page; standard amount not stated); $0 with Trip Flex (one-time use, purchased at time of booking); without Trip Flex, changes/cancels must be completed at least 7 days before departure",
      "changeFeeNum": 25,
      "basicEconomy": "Allegiant sells a single no-frills economy fare — there is no basic-vs-standard fare tier. Fares are non-refundable after the 24-hour window (full refund within 24 hours of booking only if departure was at least 168 hours away at booking). They ARE changeable/cancellable for $25 per passenger per segment if completed at least 7 days before departure; residual value comes back only as a non-refundable, non-transferable credit voucher. Within 7 days of departure (or no-show): no changes, no credit — \"all funds will be forfeited\" and the remaining itinerary including return flights is cancelled. Optional Trip Flex ($29.00-$43.00 per person per segment, purchased at time of booking) waives change/cancel fees for one change up to 1 hour before departure (air-only; 72 hours for air/hotel packages). One cash exception the fees rules don't override: customers who purchase a Total Bundle with enhanced TripFlex may cancel and receive a refund to their original form of payment.",
      "creditExpiry": "Voucher is \"good for future travel for 365 days from the original book date. Voucher expiration dates cannot be extended.\" (Terms & Conditions; Contract of Carriage Art. 15.B.1 concurs: fare may be applied \"within 365 calendar days from the date of purchase.\") Note the clock runs from the ORIGINAL booking date, not the change/cancellation date.",
      "howTo": [
        "Log in at allegiantair.com -> Manage Travel and open the itinerary. Without Trip Flex this must be done at least 7 days before scheduled departure.",
        "Use the change flow to rebook the trip at the current lower fare, or cancel outright. Cancel-then-rebook carries the risk that the fare rises between the two steps; the fee is the same $25/passenger/segment either way ($0 with Trip Flex).",
        "The $25 per passenger per segment change/cancellation fee is deducted; carrier charges and booking fees are never refunded, with or without Trip Flex (Allegiant also retains the Trip Flex fee itself).",
        "Any remaining price difference is issued as a non-refundable, non-transferable credit voucher (never cash), usable for 365 days from the ORIGINAL booking date. Allegiant asks customers to contact them for assistance when paying with a voucher (allegiantair.com/travel-vouchers)."
      ],
      "sameDayNote": "No same-day-change or standby product. Without Trip Flex there is a hard 7-day cutoff: no changes and no credit within 7 days of departure, and a no-show forfeits all funds and cancels return flights. With Trip Flex, one change is allowed up to 1 hour before scheduled departure (air-only bookings; 72 hours for air/hotel packages). 24-hour full cash refund applies only if the flight was booked at least one week (168 hours) before departure.",
      "sourceUrls": [
        "https://www.allegiantair.com/terms-and-conditions",
        "https://www.allegiantair.com/optional-services-fees",
        "https://www.allegiantair.com/contract-carriage",
        "https://www.allegiantair.com/trip-flex",
        "https://www.allegiantair.com/travel-vouchers"
      ],
      "notes": "canReprice='partial' because repricing after a fare drop works only within tight limits: (1) the difference is never cash — T&C says changes \"may be eligible for credit\" (hedged wording) and \"Difference will not be refunded\"; it becomes a non-refundable, non-transferable voucher; (2) a $25/passenger/segment fee is deducted unless Trip Flex was bought with the booking, so a drop must exceed $50 per passenger on a round trip to net anything; (3) no changes/credit at all within 7 days of departure without Trip Flex; (4) the voucher expires 365 days from the ORIGINAL booking date, so credit earned late in a booking's life has a short usable window. The $25 fee is labeled \"a temporarily reduced fee of $25.00 per passenger, per segment\" on the official fees page (standard amount not stated anywhere official — do not display $75 from third-party sources). Trip Flex verified at $29.00-$43.00 per person per segment (flight-only/car packages; per person for hotel packages); it is \"limited to one-time usage\" and cancellable only within 24 hours of purchase. Official pages describe Trip Flex as purchased \"at the time of booking\" but do NOT explicitly state it cannot be added later — treat 'only at initial booking' as unconfirmed. refundForm stays 'credit' for repricing purposes, but note the verified exception: \"Customers who purchase a Total Bundle with enhanced TripFlex may cancel their trip and receive a refund to their original form of payment\" (T&C and trip-flex page). Unverified items: exact Manage Travel button labels, and whether the online change flow offers the identical flight for same-flight rebooking — hence the cancel-and-rebook fallback in howTo. All data verified 2026-09-13 against the five allegiantair.com pages listed; r.jina.ai proxy is blocked by Allegiant's bot protection."
    },
    {
      "iata": "NK",
      "name": "Spirit Airlines",
      "defunct": true,
      "canReprice": false,
      "refundForm": "none",
      "changeFee": null,
      "changeFeeNum": null,
      "basicEconomy": null,
      "creditExpiry": null,
      "howTo": [],
      "sameDayNote": null,
      "sourceUrls": [],
      "notes": "Spirit ceased operations in May 2026; claims go through its wind-down process. Card purchases for undelivered flights generally recoverable via chargeback."
    }
  ]
};
