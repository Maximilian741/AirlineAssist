// coc-data.js — VERIFIED Contract of Carriage decode + the schedule-change lever.
//
// WHY THIS MATTERS: the Contract of Carriage is the binding agreement between you and the
// airline. Under American Airlines v. Wolens (513 U.S. 219), most state consumer-protection
// suits against airlines are preempted — but breach of the airline's OWN contract is not. This
// is therefore the document you can actually enforce, and the one nobody reads.
//
// Each airline's current contract was read and then adversarially re-verified against the live
// document (rule numbers checked to exist and to govern what is claimed; quotes checked verbatim).
// Generated file — re-run the contract-of-carriage-decoder workflow to refresh. Contracts are
// revised often: every entry carries its revision date, and rule numbers move between revisions.
window.COC_DATA = {
  "airlines": [
    {
      "airline": "Delta Air Lines",
      "iata": "DL",
      "cocUrl": "https://www.delta.com/us/en/legal/contract-of-carriage-dgr",
      "lastUpdated": "Last Modified July 7, 2026. NOTE: this is Delta's DOMESTIC Conditions of Carriage — Rule 1(A) states it 'applies only to travel entirely within the United States of America.' International…",
      "confidence": "high",
      "scheduleChangeThreshold": "Rule 19(A) lists five triggers verbatim: '[a] flight cancellation, change in departure time to depart 180 minutes or more before the original scheduled departure time, change in arrival time to arrive 180 minutes or more after the original scheduled arrival time, change that will cause a passenger to miss connections, or in the event of a significantly delayed or changed flight pursuant to applicable law.' Two asymmetries passengers miss and that ARE in the text: (1) a LATER departure is not itself a listed trigger — the 180-minute clock runs on an EARLIER departure or a LATER ARRIVAL; (2) the missed-connection trigger carries no minimum magnitude. The fifth item ('pursuant to applicable law') imports the DOT standard at 14 CFR part 260 (3 hours domestic / 6 hours international, departure…",
      "rebooksOnOtherAirlines": "Delta's contract creates no right to be endorsed onto a competitor. Rule 19(A): 'At Delta's sole discretion and if acceptable to the passenger, Delta may arrange for the passenger to travel on another Carrier or via ground transportation.' Rule 20(D)(2) uses the same formula for denied boarding: 'At Delta's sole discretion, Delta may instead arrange for transportation on any other Carrier or combination of Carriers to the passenger's next Stopover, or if none, to the passenger's destination, at no additional cost.' Both are 'may' + 'sole discretion' — permissive, not obligatory. There is no surviving Delta equivalent of the deregulation-era Rule 240 interline endorsement duty. The enforceable obligation is binary: Delta carries you on its own next flight with seats in your class (Rule…",
      "buriedGem": "Rule 19(A)'s missed-connection trigger read together with the opening words of Rule 19(B). Rule 19(A) lists 'change that will cause a passenger to miss connections' as a standalone refund trigger with NO minimum size — a small retiming that breaks your connection lets you cancel the remaining ticket and take cash to your original form of payment, expressly including 'any paid checked bag fees,' not an eCredit. And Rule 19(B)'s force majeure sentence opens 'Except as provided above,' which on its face subordinates the force majeure shield to the Rule 19(A) rebook-or-refund obligation. Passengers are routinely told 'it's weather, so eCredit only' and accept it. Honest caveat: Delta could argue 'as provided above' points only to Rule 19(A)'s own internal conditions, so do not rely on this alone — pair it with 14 CFR 260, under which a refund to the original form of payment is owed for a cancelled or significantly changed flight REGARDLESS of cause, which no contract term can waive.",
      "provisions": [
        {
          "topic": "Schedule change / cancellation — the refund trigger",
          "ruleNumber": "Rule 19(A)",
          "ruleNote": null,
          "plainEnglish": "If Delta cancels, moves departure 180+ minutes earlier, moves arrival 180+ minutes later, or makes any change that breaks a connection, Delta will cancel the remaining ticket and refund the unused portion of the ticket and unused ancillary fees — the text expressly says 'including any paid checked bag fees' — in the original form of payment, in accordance with Rule 22.",
          "exactQuote": "change in arrival time to arrive 180 minutes or more after the original scheduled arrival time, change that will cause a passenger to miss connections",
          "howToUse": "Put it in writing before the originally scheduled departure time: 'My itinerary meets a Rule 19(A) trigger [name which one]. I am requesting cancellation of the remaining ticket and refund of the unused portion and unused ancillary fees, including paid checked bag fees, to my original form of payment in accordance with Rule 22. I decline an eCredit.'",
          "catch": "The refund arm operates only (i) at the passenger's request, (ii) if Delta does not offer an alternative flight or voucher option, or (iii) if the passenger does not respond to that offer prior to the originally scheduled departure time. Do not attribute it to Rule 22."
        },
        {
          "topic": "Force majeure does not by its terms kill the refund",
          "ruleNumber": "Rule 19(B)",
          "ruleNote": null,
          "plainEnglish": "The force majeure sentence is drafted as an exception to what precedes it. Weather, civil unrest, labor disputes, government action, shortages and the catch-all excuse Delta from the Rule 19(B) amenities (hotel, ground transport, $100 substitute voucher). On the face of the text they do not switch off the Rule 19(A) rebook-or-refund obligation.",
          "exactQuote": "Except as provided above, Delta shall have no liability if the flight cancellation, diversion or delay was due to force majeure.",
          "howToUse": "When told 'it's weather, you only get a credit,' respond: 'Rule 19(B) begins with the words Except as provided above. Force majeure limits the amenities in Rule 19(B); it does not limit the rebook-or-refund obligation in Rule 19(A) or the involuntary refund in Rule 22(A). Separately, 14 CFR 260 requires a refund to my original form of payment regardless of the cause of the cancellation. Please process it.'",
          "catch": "It does wipe out the hotel, ground transport and $100 substitute voucher. The definition is very broad: six enumerated categories of 'actual, threatened or reported' events closing with 'Any other condition beyond Delta's control or any fact not reasonably foreseen by Delta.' And the 'Except as provided above' reading is textual, not settled — the DOT refund rule is the sturdier lever."
        },
        {
          "topic": "Free seat in a higher cabin during irregular operations",
          "ruleNumber": "Rule 19(A)",
          "ruleNote": null,
          "plainEnglish": "If the only remaining seat on the rebooking flight is in a higher cabin, Delta will fly you in it at no extra charge. The verb is 'will,' not 'may' — one of the few mandatory commitments in Rule 19.",
          "exactQuote": "If space on the next available flight is available only in a higher class of service than purchased, Delta will transport the passenger on the flight",
          "howToUse": "At the rebooking desk or gate: 'Rule 19(A) provides that if space on the next available flight is available only in a higher class of service than purchased, Delta will transport the passenger on that flight. Please rebook me there.'",
          "catch": "The same sentence continues: Delta 'reserves the right to upgrade other passengers on the flight according to its upgrade priority policy to make space in the class of service originally purchased.' So Delta can move Medallions up and seat you in coach. It only bites where they have not done so."
        },
        {
          "topic": "Rebooking on another airline (no Rule 240 successor)",
          "ruleNumber": "Rule 19(A); Rule 20(D)(2)",
          "ruleNote": null,
          "plainEnglish": "Purely discretionary in both the irregular-operations rule and the denied-boarding rule. Delta owes you nothing on a competitor's metal. Rule 20(D)(2) repeats it for denied boarding: 'At Delta's sole discretion, Delta may instead arrange for transportation on any other Carrier or combination of Carriers.'",
          "exactQuote": "At Delta's sole discretion and if acceptable to the passenger, Delta may arrange for the passenger to travel on another Carrier or via ground transportation.",
          "howToUse": "Do not claim an entitlement — you will lose the argument. Reframe: 'Rule 19(A) obliges Delta either to carry me on its next flight with seats in my class of service, or to cancel and refund under Rule 22. Your next available seat is [date]. Unless Delta elects to endorse me to [carrier], I am electing the refund.' Presenting it as Delta's choice between two real obligations moves agents; demanding an endorsement does not.",
          "catch": "'Sole discretion' means no enforceable duty and no remedy if they decline. Note also Rule 1(A): for interline flights operated by other carriers, the OPERATING carrier's conditions of carriage apply, not Delta's."
        },
        {
          "topic": "Involuntary refund",
          "ruleNumber": "Rule 22(A)",
          "ruleNote": null,
          "plainEnglish": "Rule 22(A) is the involuntary-refund rule. Its stated triggers are a flight cancellation or significantly delayed or changed flight pursuant to Rule 19(A), or refusal to transport pursuant to Rule 7 (except where caused by the passenger's own non-compliance). Fully unused ticket = the whole fare paid. Partly used = prorated from the point of interruption, either at a fare breakpoint (22(A)(2)(a)) or by unflown-mileage proration within a fare component (22(A)(2)(b)).",
          "exactQuote": "If no portion of the ticket has been used, the refund will be an amount equal to the fare paid.",
          "howToUse": "Say the words 'Rule 22(A) involuntary refund' explicitly — agents default to Rule 22(B) voluntary treatment, which routes nonrefundable tickets to an eCredit. Then cite Rule 22(D) 'Form of Refund': credit card refunds go back to the card used, 'typically within seven business days of Delta's initial receipt of refund request'; other forms typically within 20 days.",
          "catch": "Both proration subsections end with 'No refund will apply when alternate transportation is provided by Delta and accepted by the passenger.' Rule 22(C) bars any refund unless Delta receives the request and unused coupons 'within one year of the original issue date of the ticket.' Overcharge claims die 45 days after the DATE OF ISSUE OF THE TICKET (not the flight date). Real drafting defect worth exploiting: the current document has TWO subsections both lettered 'D' under Rule 22 — 'Form of Refund' and 'Overcharges.' If Delta cites 'Rule 22(D)' at you, make them say which one."
        },
        {
          "topic": "Denied boarding — priority, transportation, compensation, timing",
          "ruleNumber": "Rule 20(C), 20(D), 20(E), 20(F), 20(G)",
          "ruleNote": null,
          "plainEnglish": "Volunteers are solicited first under Rule 20(B). If there are not enough, Delta bumps by the Rule 20(C) boarding-priority ladder. Rule 20(D)(1) requires Delta to carry you on its next flight with space at no additional cost; 20(D)(3) adds hotel accommodations if the reroute requires an overnight, or a credit voucher 'commensurate in value with the local average contracted hotel rate up to $100 USD' if no room is available. Rule 20(F): 200% of fare capped at $1,075 with Qualifying Alternative Transportation; 400% capped at $2,150 without it.",
          "exactQuote": "Delta will pay denied boarding compensation in an amount equal to 400% of the fare ... but no more than $2,150.00",
          "howToUse": "Refuse the gate agent's travel voucher. Say: 'This is an involuntary denied boarding. Rule 20(G) requires Delta to pay involuntary denied boarding compensation on the day and at the place where the denial of boarding occurred, in cash or immediately negotiable check. Please issue that now.' If your replacement flight departs before payment can be made, Rule 20(G) allows payment by mail or other means within 24 hours. Ask for the boarding-priority reason in writing.",
          "catch": "Rule 20(E)(1) eliminates compensation entirely where the passenger did not comply with ticketing/check-in requirements, where a smaller-capacity aircraft was substituted for operational or safety reasons, where the passenger is accommodated in another section at no extra charge, or where 'Delta arranges comparable air transportation... scheduled to arrive at the passenger's next Stopover, or if none, final destination within one hour after the planned arrival time.' Rule 20(C)(1) puts premium-cabin ticket holders and Diamond/Platinum/Gold Medallions ahead of you. Dropped."
        },
        {
          "topic": "Hotel, ground transport and the $100 substitute voucher",
          "ruleNumber": "Rule 19(B)(a) and 19(B)(b)",
          "ruleNote": null,
          "plainEnglish": "Where travel is interrupted for more than 4 hours after scheduled departure by a cancellation or delay on the date of travel that is NOT force majeure: (a) a voucher for one night's lodging when the delay is during 10:00 pm to 6:00 am, plus free public ground transportation to the hotel if the hotel does not offer it, and a travel voucher up to $100 if no contracted room is available; (b) ground transportation to the destination airport on a diversion within listed city groups.",
          "exactQuote": "If accommodations are not available, Delta will provide the passenger with a voucher that may be applied to future travel on Delta equal in value to the contracted hotel rate, up to $100 USD.",
          "howToUse": "'This is a Delta-controllable interruption exceeding four hours in the 10pm–6am window. Rule 19(B)(a) requires a voucher for one night's lodging, and if accommodations are not available, a travel voucher equal in value to the contracted hotel rate up to $100 USD. Please issue one or the other.' Ask for the $100 voucher by name when told hotels are sold out — agents almost never volunteer it.",
          "catch": "Three hard gates: the interruption must exceed 4 hours, must not result from force majeure, and the lodging obligation only bites for a delay 'during the period of 10:00 pm to 6:00 am.' The 19(B)(b) ground-transport duty applies only where a flight is diverted and both the ticketed destination and the diversion airport fall inside one of the listed city groups (SFO/OAK/SJC; LAX/LGB/ONT/SNA; DEN/COS; ORD/MDW; DFW/DAL; IAH/HOU; FLL/MIA/PBI; BWI/DCA/IAD; EWR/LGA/JFK; MCO/TPA/DAB/MLB/SRQ)."
        },
        {
          "topic": "Baggage — exclusions and the 6-hour in-person deadline",
          "ruleNumber": "Rule 17(B)(3)(b); Rule 17(B)(5)",
          "ruleNote": null,
          "plainEnglish": "Liability is limited to proven damage or loss, valued at 'the documented original purchase price less any applicable depreciation for prior usage,' and capped at $4,700 per fare-paying passenger. Rule 17(B)(3)(b) excludes liability entirely for 'precious items,' defined verbatim as items that are 'high value, limited edition, or irreplaceable or difficult to replace, including but not limited to money or gift cards/gift certificates, antiques, collectibles, sensitive or original documents, forms of personal identification, medications, electronic equipment, film, jewelry, keys, manuscripts, paintings, photographs, photographic equipment, business samples, securities, silverware, watches, or…",
          "exactQuote": "notice of a claim is presented in person, with the baggage present for visual inspection, to a Delta Baggage Service Office within 6 hours after arrival at the final destination",
          "howToUse": "Go to the Baggage Service Office before you leave the airport, bag in hand. Four exceptions get 24 hours instead: (1) damage to mobility devices such as scooters or wheelchairs; (2) pilferage or damage not readily apparent from exterior inspection (24 hours from arrival); (3) bags that were delayed (24 hours from return to the customer); (4) bags checked by Unaccompanied Minors or Persons with Disabilities (24 hours from arrival).",
          "catch": "The 6-hour in-person, bag-present rule is brutal on late-night arrivals. Any action must be commenced within one year. The good news buried in Rule 17(B)(3)(a): the maximum liability limitation does NOT apply to wheelchairs or personal assistive devices."
        },
        {
          "topic": "Checked-bag fee refund when the bag is late",
          "ruleNumber": "Rule 17(B)(1)(b)",
          "ruleNote": null,
          "plainEnglish": "A domestic bag more than 12 hours late triggers a refund of the bag fee. Delta wrote the DOT rule (14 CFR 260.5) into its own Contract of Carriage, which converts a regulatory obligation into a contract term.",
          "exactQuote": "If checked baggage is not delivered within 12 hours of the arrival time for domestic itineraries consistent with the requirement of 14 CFR 260.5 ... Delta ... will issue a refund for the checked baggage fee paid",
          "howToUse": "File the delayed-bag report at the airport, then separately and in writing request the bag-fee refund citing 'Rule 17(B)(1)(b) and 14 CFR 260.5.' It is meant to be automatic; in practice it frequently is not, and asking by rule number gets it processed.",
          "catch": ""
        },
        {
          "topic": "Governing law, entire agreement, damages cap",
          "ruleNumber": "Rule 24; Rule 1(B)",
          "ruleNote": null,
          "plainEnglish": "Rule 24 applies U.S. law and, to the extent not preempted by federal law, the laws of the State of Georgia. Punitive, consequential and special damages are contractually excluded — missed cruises, forfeited hotel nights, lost wages. Realistic recovery is limited to amounts the contract itself names.",
          "exactQuote": "Delta shall not be liable for any punitive, consequential or special damages arising out of or in connection with carriage or other services performed by Delta",
          "howToUse": "Build the claim exclusively out of contract-promised amounts: unused fare, unused ancillary fees, paid checked bag fees, the $100 hotel-substitute voucher, Rule 20(F) denied-boarding compensation. Do not plead consequential damages — it hands Delta a clean defense under Rule 24.",
          "catch": "The entire-agreement clause states 'No other covenants, warranties, undertakings or understandings may be implied, in law or in equity.' Rule 1(B) provides that 'No Delta employee or ticketing agent has the authority to modify any provision of the Conditions of Carriage unless authorized in writing by a Delta corporate officer' — verbal promises from agents are worthless. Rule 1(B) also fixes your rights to the rules in effect on your purchase date (with a narrow operational-necessity exception), so pull and save that version."
        }
      ]
    },
    {
      "airline": "United Airlines",
      "iata": "UA",
      "cocUrl": "https://www.united.com/en/us/fly/contract-of-carriage.html",
      "lastUpdated": "Revised May 11, 2026.",
      "confidence": "high",
      "scheduleChangeThreshold": "Rule 24 C) conditions every remedy on a 'significant change,' and the phrase appears exactly five times in the whole document — all inside Rule 24 (C)1), C)2), C)3), C)4), E)3)) — and is qualified by United's own judgment every time ('if UA determines that such alternate transportation results in a significant change' / 'as determined by UA'). the document contains NO reference to 14 CFR 260 anywhere. Practical consequence: unlike Delta, which committed to 180 minutes in Rule 19(A), United reserved the definition to itself, so your enforceable threshold is the federal rule (14 CFR part 260: 3+ hours domestic, 6+ hours international, change of departure or arrival airport, added connections, cabin downgrade, or reaccommodation on a less-accessible aircraft), not the CoC. Argue the…",
      "rebooksOnOtherAirlines": "No binding commitment. Rule 24 E) 2) a) ii): 'At its sole discretion, UA may arrange for the passenger to travel on another carrier.' Rule 24 C) 2) adds that where a Schedule Change cancels ALL UA service between two cities, 'at UA's sole discretion, UA may reroute Passengers over the lines of one or more carriers in an equivalent class of service' — still discretionary. The closest thing to a passenger-side right is Rule 25 A) 3) b) for denied boarding: another carrier's flight 'may be used upon United's sole discretion and the Passenger's request at no additional cost to the Passenger only if such flight provides an earlier arrival than the UA flight offered' — discretionary, but it establishes that you may ask and that EARLIER ARRIVAL is the stated test. United has no surviving Rule…",
      "buriedGem": "Rule 25 A) 7), 'Limitation of Liability' Accepting United's denied-boarding check 'will constitute full compensation for all actual or anticipatory damages incurred or to be incurred by the Passenger as a result of UA's failure to provide the Passenger with confirmed reserved space.' REFUSING it preserves a contractual claim for 'actual damages proved not to exceed 1350 USD per Ticketed Passenger.' That is worth more than the statutory formula whenever your fare was cheap — 200% of a $150 fare is only $300. Almost nobody does the arithmetic at the gate; they sign, take the check, and release a claim worth several times as much. Because it is a term of United's own contract, it is a breach-of-contract claim rather than a preempted state-law claim.",
      "provisions": [
        {
          "topic": "Schedule change — no threshold, defined by United alone",
          "ruleNumber": "Rule 24 C)",
          "ruleNote": null,
          "plainEnglish": "On a Schedule Change United elects one of four remedies: C)1) carry you on its closest available flight in the same class of service at no additional cost; C)2) if the Schedule Change cancels all UA service between two cities, at UA's sole discretion reroute you over one or more other carriers in an equivalent class; C)3) tell you the ticket value may be applied to future UA travel within one year with no change or reissue fee; or C)4) if you were offered neither C)1) nor C)2) and do not take C)3), you are eligible for a refund upon request (see Rule 27 A)). Whether the change was 'significant' at all is United's call.",
          "exactQuote": "if UA determines that such alternate transportation results in a significant change and the Passenger chooses not to accept such alternate transportation, United will provide a refund",
          "howToUse": "Because the contract is silent on magnitude, lead with the regulation: 'Under 14 CFR part 260 this is a significant change [3+ hours domestic / 6+ hours international / airport change / added connection / downgrade], and I am requesting an automatic refund to my original form of payment.' Use Rule 24 C) only to establish that United must either carry you or refund — not to argue the threshold.",
          "catch": "'As determined by UA' is close to unreviewable in a contract action, which is exactly why the DOT rule rather than the contract is your lever. Basic Economy is dead weight: Rule 26 B) 2) and Rule 27 E) 2) both state Basic Economy tickets, even if unused, have no residual value and cannot be applied toward the purchase of future travel."
        },
        {
          "topic": "Irregular operations — carry or refund",
          "ruleNumber": "Rule 24 E) 2)",
          "ruleNote": null,
          "plainEnglish": "Where a ticket is affected by Irregular Operations caused by UA, the contract gives two paths: fly you on United's own flights in the same class of service at no additional cost, or — at United's sole discretion — another carrier or ground transportation. If you are not transported under E)2) and the irregular operation results in a significant change as determined by UA, you are eligible for a refund; otherwise you must request one (Rule 24 E) 3), pointing to Rule 27 A)).",
          "exactQuote": "Transport the Passenger on its own flights, subject to availability, to the Destination, next Stopover point, or transfer point shown on its portion of the Ticket ... at no additional cost to the Passenger",
          "howToUse": "'Rule 24 E) 2) requires United either to carry me on its own flights at no additional cost, or, failing that, Rule 24 E) 3) makes me eligible for a refund under Rule 27 A). Your next available seat is [date/time]. I am electing the refund.' Also invoke Rule 27 C) 1) for your checked-bag fee, which becomes refundable when you do not travel as a result of a cancellation, Schedule Change or Irregular Operations.",
          "catch": "Rule 24 E) 1) opens with a blanket disclaimer: 'Except to the extent provided in this Rule and the Warsaw and/or Montreal Conventions, UA shall not be liable for any Irregular Operations.' On an involuntary downgrade Rule 24 E) 4) gives only a fare-difference refund; the formula is at Rule 27 A) 3) a): 'FOR UNRESTRICTED PREMIUM FARES: 50% of the prorated fare for that segment plus applicable variable taxes and fees.' Restricted fares get less (Rule 27 A) 3) b))."
        },
        {
          "topic": "Interline misconnect — the delivering carrier owes you",
          "ruleNumber": "Rule 24 E) 2) b)",
          "ruleNote": null,
          "plainEnglish": "On an interline itinerary, responsibility follows the airline that ran late. If a Passenger misses an onward connecting flight on which space is reserved because the Delivering Carrier did not operate its flight due to Irregular Operations or a Schedule Change, that Delivering Carrier must arrange carriage or refund. A NOTE in Rule 24 B) 5) confirms the same allocation applies at each subsequent point of misconnection.",
          "exactQuote": "the Delivering Carrier is responsible to arrange for carriage of the Passenger or to make a refund.",
          "howToUse": "When two airlines point at each other, quote this sentence and name the delivering carrier out loud: 'Rule 24 E) 2) b) makes the Delivering Carrier responsible to arrange for carriage of the Passenger or to make a refund. [Carrier] operated the delivering flight, so [carrier] is responsible.'",
          "catch": "Rule 24 B) 2), 3) and 5) require you to have actually HELD confirmed space on the onward flight. The EXCEPTION at the end of Rule 24 B) 7) lets United refuse to honor another carrier's ticket 'that does not reflect a confirmed reservation on UA, unless the issuing carrier reissues the ticket for any changes in routing' — and if that carrier is unavailable, 'UA reserves the right to reroute passengers only over its own lines.' Rule 27 A) also carries two EXCEPTIONs refusing refunds on tickets not reflecting a confirmed UA reservation unless UA issued the ticket."
        },
        {
          "topic": "Rebooking on another airline",
          "ruleNumber": "Rule 24 E) 2) a) ii); Rule 25 A) 3) b)",
          "ruleNote": null,
          "plainEnglish": "No commitment in irregular operations. In denied boarding, Rule 25 A) 3) b) goes marginally further: another carrier's flight 'may be used upon United's sole discretion and the Passenger's request at no additional cost to the Passenger only if such flight provides an earlier arrival than the UA flight offered.' You may ask, and earlier arrival is the stated test — but United still decides.",
          "exactQuote": "At its sole discretion, UA may arrange for the passenger to travel on another carrier.",
          "howToUse": "On a denied boarding, ask with the test built in: 'Is there a partner or competitor flight that arrives EARLIER than the United flight you are offering? Rule 25 A) 3) b) provides that such a flight may be used at my request.' Naming 'earlier arrival' is what moves agents, because it is their own contractual standard.",
          "catch": "'Sole discretion' appears in both provisions. Like Delta, United has no enforceable successor to Rule 240. Note also that Rule 25 A) 3) a) obliges United to carry you on its own next flight with space 'regardless of class of service' — useful if the only seat left is in a premium cabin."
        },
        {
          "topic": "Denied boarding — compensation amounts and payment timing",
          "ruleNumber": "Rule 25 A) 4) and A) 5)",
          "ruleNote": null,
          "plainEnglish": "Domestic interstate (Rule 25 A) 4) a)): 200% of fare, max $1,075, if Alternate Transportation is planned to arrive more than one but less than two hours late; 400%, max $2,150, if more than two hours late. US to a foreign point (A) 4) b)): same percentages but the break moves to four hours. Canada departures (A) 4) c)): fixed sums of CAD 900 (within six hours), CAD 1,800 (six to nine hours), CAD 2,400 (more than nine hours). Volunteers are solicited first (A) 1)), and A) 2) a) puts qualified individuals with disabilities, unaccompanied minors, and — Canada departures only — families travelling together last to be bumped.",
          "exactQuote": "at the rate of 400% of the fare to the Passenger's first Stopover or, if none, Destination with a maximum of 2,150 USD",
          "howToUse": "Compute it yourself from the fare to your first Stopover or, if none, Destination. Under Rule 25 A) 5) a), payment by check is made 'on the day and at the place where the failure to provide confirmed reserved space occurs'; if the alternate transportation departs first, United must send it within 24 hours. Under A) 5) b), if offered free or reduced-rate travel instead, United must tell you the amount and that you may decline it and take the money — decline it.",
          "catch": "The Rule 25 A) 4) d) EXCEPTIONS eliminate compensation entirely if: the flight is CANCELLED rather than oversold; you did not comply with ticketing/check-in/reconfirmation requirements; equipment of lesser capacity was substituted for operational or safety reasons (or, on aircraft of 60 or fewer seats, weight/balance restrictions); you are seated in another section at no extra charge; you are accommodated on Alternate Transportation planned to arrive 'not later than 60 minutes after the planned arrival time'; you are an airline employee or non-revenue; or you did not present yourself at the loading gate at least 15 minutes before a domestic or 30 minutes before an international departure.…"
        },
        {
          "topic": "Decline the check and claim proven actual damages",
          "ruleNumber": "Rule 25 A) 7)",
          "ruleNote": null,
          "plainEnglish": "Taking the check is a full and final release — acceptance 'will constitute full compensation for all actual or anticipatory damages.' Declining it keeps alive a claim for actual proven damages capped at $1,350 per ticketed passenger.",
          "exactQuote": "If UA's offer of compensation pursuant to the above provisions is not accepted, UA's liability is limited to actual damages proved not to exceed 1350 USD per Ticketed Passenger",
          "howToUse": "Do the arithmetic before you sign anything. If 200% or 400% of your fare is less than $1,350 and your real out-of-pocket losses are higher — replacement ticket, hotel, meals, ground transport, forfeited prepaid non-refundable bookings — say clearly 'I am not accepting the offered compensation,' get that noted, keep every receipt, and claim actual damages up to $1,350 in writing or in small claims.",
          "catch": "You carry the burden: 'Passenger will be responsible for providing documentation of all actual damages claimed.' The same paragraph excludes punitive, consequential and special damages, and the cap is expressly tied to damages 'as a result of UA's failure to provide the Passenger with confirmed reserved space' — it does not cover other grievances. If the formula amount already exceeds $1,350, declining makes you worse off; take the check."
        },
        {
          "topic": "Involuntary refund",
          "ruleNumber": "Rule 27 A)",
          "ruleNote": null,
          "plainEnglish": "Rule 27 A) is the involuntary-refund rule, expressly triggered by Rule 21 (refusal of transport) or Rule 24 (Schedule Change, Force Majeure Event, Irregular Operations). Fully unused ticket = fare and charges paid. Partly used = prorated by fare component for one-way fares; for a domestic round trip with equal outbound and inbound fares, 50% of the round-trip fare for the class paid, for the unflown segment only.",
          "exactQuote": "If no portion of the Ticket has been used: An amount equal to the fare and charges paid.",
          "howToUse": "Write: 'This is an involuntary refund under Rule 27 A), triggered by Rule 24. Please refund fare and charges to the original form of payment.' Then cite the timing separately: Rule 27 B) 6) commits United to issue refunds 'within seven (7) business days of determining that a refund is due for credit card purchases and twenty (20) business days after receiving a complete refund request' for cash, check or other payment. Also claim your bag fee under Rule 27 C) 1).",
          "catch": "'UA will make no refund when alternate transportation is provided by UA and accepted by the passenger' (Rule 27 A) 1) b) i)). Two silent clocks: Rule 27 H) bars overcharge claims not submitted in writing 'within 45 days after the operation of the flight Segment,' and Rule 27 C) 4) requires any service or other fee refund request 'within 90 days of the date the fee(s) was originally paid or flight date, whichever is later.'"
        },
        {
          "topic": "Baggage — the exclusion list and two fatal deadlines",
          "ruleNumber": "Rule 28 K)",
          "ruleNote": null,
          "plainEnglish": "For itineraries entirely within the U.S.A., Rule 28 K) 1) a) caps liability at USD 4,700 per ticketed passenger and states 'Passenger will be responsible for documenting and proving the actual value of the loss.' Two independently fatal deadlines: preliminary notice within 24 hours of arrival (K) 1) d)), and a completed written claim form received by UA's System Tracing Center within 45 days after the flight date (K) 1) f)). Miss either and, in the contract's words, 'no action shall lie against UA.'",
          "exactQuote": "a preliminary notice of claim must be submitted to UA by the Passenger within twenty-four hours after arrival of the flight on which the Baggage was or was to be transported",
          "howToUse": "Report at the airport baggage office before leaving and get an incident report number, then immediately obtain the written claim form (K) 1) e)) and diary the 45-day deadline. For wheelchairs and other assistive devices on domestic and to/from-Canada travel, Rule 28 K) 2) a) removes the liability cap but expressly preserves the notice and claim requirements — if you cannot file at the airport, contact United's Assistive Device Desk within 24 hours of arrival (seven calendar days for carriage to/from Canada).",
          "catch": "The Rule 28 K) 3) EXCLUSIONS list runs to 33 categories and swallows most of what people pack: computer hardware/software and electronic components, cell phones and electronic/mechanical items, cameras and photographic/cinematographic/audio/video equipment, jewelry, watches, precious metals and stones, eyeglasses and ALL other eyewear, medicines and medical equipment not used as assistive devices, listed musical instruments, business equipment and samples, antiques and collectibles, works of art, natural fur products, liquids/perfume/alcohol, tools, keys, money and gift cards, strollers and infant carrying seats, and essentially all recreational and sporting goods — plus anything checked in…"
        },
        {
          "topic": "Force majeure — what United disclaims",
          "ruleNumber": "Rule 24 D)",
          "ruleNote": null,
          "plainEnglish": "On a Force Majeure Event United claims the right to cancel with no liability, and states it 'may refund, in its sole discretion, any unused portions of the Ticket in the form of a travel certificate or travel credit.' Its contract therefore does not promise cash. This is materially weaker than Delta's, whose force majeure sentence opens 'Except as provided above.'",
          "exactQuote": "UA without notice, may cancel, terminate, divert, postpone, or delay any flight, right of carriage or reservations ... without any liability on the part of UA.",
          "howToUse": "Do not fight this on the contract — you will lose. Cite 14 CFR part 260, which requires a refund to the original form of payment for a cancelled flight regardless of cause and which the Contract of Carriage cannot waive: 'The DOT automatic refund rule applies regardless of the reason for cancellation and overrides the travel-credit option in Rule 24 D).'",
          "catch": "The Rule 24 B) 4) definition is sweeping: meteorological or geological conditions, acts of God, riots, terrorist activities, civil commotions, embargoes, wars, hostilities, 'either actual, anticipated, threatened or reported'; labour disputes; governmental regulation, demand or requirement; shortages of labour, fuel or facilities; damage to UA aircraft caused by another party; emergencies; and 'Any event not reasonably foreseen, anticipated or predicted by UA.' Lodging is separately refused under Rule 24 F) 1) 'When such interruption is due to circumstances outside UA's control.'"
        },
        {
          "topic": "Meals, hotel and ground transport",
          "ruleNumber": "Rule 24 F)",
          "ruleNote": null,
          "plainEnglish": "United's contract does promise meals (Rule 24 F) 2)), which Delta's domestic contract does not. Rule 24 F) 1) owes lodging — at UA's option either a room or, on the passenger's request only, an electronic travel certificate up to an amount determined by UA — when a UA flight incurs Irregular Operations and the delay is expected to exceed four hours between 10:00 p.m. and 6:00 a.m. local time. Rule 24 F) 3) owes ground transportation to the place of lodging by public conveyance when the hotel does not provide it.",
          "exactQuote": "UA will provide snacks and/or food and beverage vouchers in the event of an extensive delay caused by UA.",
          "howToUse": "Ask at the gate, on the spot: 'This is a United-caused delay. Rule 24 F) 2) provides food and beverage vouchers for an extensive delay caused by UA, and Rule 24 F) 1) and F) 3) provide lodging and ground transportation for an overnight Irregular Operations delay expected to exceed four hours between 10 p.m. and 6 a.m. Please issue them now.'",
          "catch": "The decisive trap, repeated three times: 'Where lodging has been offered but not accepted by a Passenger for whatever reason, UA is not liable to reimburse the Passenger for expenses relating to alternative lodging secured independently by the Passenger' — and the identical clause appears for food and beverage and for ground transportation. Book your own and you get nothing. Lodging is also refused at your permanent domicile, origin or stopover city, within the listed city groups (BWI/IAD/DCA; ORD/MDW/MKE; EWR/LGA/JFK/HPN; LGW/LHR and others), and for interruptions outside UA's control. 'Extensive delay' is left undefined, and Rule 24 F) 4) declares these amenities 'the sole and exclusive…"
        },
        {
          "topic": "Paid-for extras you didn't receive — the 90-day clock",
          "ruleNumber": "Rule 24 I) EXCEPTION; Rule 27 C)",
          "ruleNote": null,
          "plainEnglish": "If you paid a separate designated fee for a specific ancillary service or amenity in advance and it was not provided, it is refundable — but only if you ask within 90 days. Rule 27 C) separately covers: bag fees when you do not travel because of a cancellation, Schedule Change or Irregular Operations, plus reimbursement of the fee for any bag that is lost (C) 1)); booking service charges on a qualifying 24-hour cancellation (C) 2)); day-of-departure upgrade fees when First Class is not available on the later flight (C) 3)); and removal from a paid Premium Plus, Economy Plus or Preferred seat, or a downgrade from a paid class of service, without equal-or-better re-accommodation (C) 5)).",
          "exactQuote": "the Passenger is eligible for a refund of the amount paid if a refund request is made within 90 days of the date the fee was originally paid or the flight date, whichever is later",
          "howToUse": "Itemise each fee with amount and date and request refund of each specifically and in writing, citing Rule 27 C) and the EXCEPTION at the end of Rule 24 I). Nothing here is automatic under the contract — these are worded 'upon request.'",
          "catch": "(Rule 24's subsections run A) General, B) Definitions, C) Schedule Change, D) Force Majeure Event, E) Irregular Operations, F) Amenities for Delayed Passengers, G) Carrier in Default, H) other-carrier strike, I) class of service and ancillary amenities — the letters are confirmed by the document's own internal cross-references to 'C) 1)', 'E) 2)' and 'Rule 28 K) 2) b)'.) Substantively, Rule 24 I) states that ancillary services or amenities you did NOT separately purchase — live television, wi-fi, priority boarding, advance seat assignments, meal service — 'are not guaranteed' and United 'shall owe no refund with respect to any failure to provide that amenity,' whatever the cause. And Rule…"
        }
      ]
    },
    {
      "airline": "Southwest Airlines Co.",
      "iata": "WN",
      "cocUrl": "https://www.southwest.com/swa-resources/pdfs/corporate-commitments/contract-of-carriage.pdf",
      "lastUpdated": "56th Revised — Effective Date 07/16/2026.",
      "confidence": "high",
      "scheduleChangeThreshold": "Confirmed separately that Section 9(b)(1) opens 'In the event Southwest cancels a flight, or a flight is Significantly Delayed or Changed' — the cancellation limb carries no force-majeure carve-out.",
      "rebooksOnOtherAirlines": "No. There is no Rule 240-style endorsement to a competitor anywhere in the contract. Section 9(b)(1)(i) reads, verbatim: 'Southwest may offer to transport the Passenger at no additional charge on the next Southwest Airlines flight(s) on which space is available to the Passenger's intended destination' — permissive ('may') and own-metal only. Section 10 (Interline Transportation) is not an IRROPS re-accommodation right; it governs pre-ticketed interline itineraries and expressly states at 10(a)(7), in capitals, 'SOUTHWEST ASSUMES NO LIABILITY FOR THE ACTS OR OMISSIONS OF AN INTERLINE CARRIER.', not five — All Nippon Airways, China Airlines, Condor, EVA Air, Icelandair, Philippine Airlines, Singapore Airlines and Turkish Airlines. Practical consequence is unchanged: your leverage is the…",
      "buriedGem": "Section 1(b) subparts (D) and (E). Being re-routed onto an itinerary with more connection points than you booked, or downgraded a class of service, is BY DEFINITION a 'Significantly Delayed or Changed Flight' with no delay threshold to satisfy, even if you arrive on time. That makes you eligible under Section 9(b)(1)(iii) to decline both the alternative transportation and the Flight Credit and take a form-of-payment refund under Section 4(c)(3). Agents routinely move nonstop passengers onto one-stop itineraries and treat it as a save; almost nobody realises that act alone is a contractual refund trigger. Script: 'My replacement itinerary has more connection points than my original, which meets subpart (D) of the Significantly Delayed or Changed Flight definition in Section 1(b). Under Section 9(b)(1)(iii) I decline the alternative transportation and decline Flight Credit, and I elect a form-of-payment refund under Section 4(c)(3).'",
      "provisions": [
        {
          "topic": "Schedule change — arrival/departure time threshold",
          "ruleNumber": "Section 1(b), definition of",
          "ruleNote": "Section 1(b), definition of 'Significantly Delayed or Changed Flight', subparts A and B; operative via Section 9(b)(1)",
          "plainEnglish": "A 3-hour domestic / 6-hour international shift in either direction (departing that much earlier, or arriving that much later) converts a nonrefundable ticket into one refundable to your original form of payment rather than to Southwest credit.",
          "exactQuote": "The Passenger is scheduled to arrive at the destination airport three hours or more for domestic itineraries or six hours or more for international itineraries later than the original scheduled arrival time",
          "howToUse": "Do not accept the rebooking or the Flight Credit in the app first — accepting alternative transportation undercuts the 9(b)(1)(iii) election, which is conditioned on your NOT flying the changed itinerary and NOT accepting the credit. Say or write: 'This is a Significantly Delayed or Changed Flight under Section 1(b). Under Section 9(b)(1)(iii) I decline alternative transportation and decline Flight Credit, and elect a form-of-payment refund under Section 4(c)(3).'",
          "catch": "The cancellation limb of 9(b)(1) has no such qualifier, so if the flight is cancelled outright the cause is irrelevant."
        },
        {
          "topic": "Schedule change — extra connections, downgrade, airport swap",
          "ruleNumber": "Section 1(b), definition subparts (",
          "ruleNote": "Section 1(b), definition subparts (C), (D), (E) and (F)",
          "plainEnglish": "Four non-time-based triggers each independently entitle you to elect a refund: a different origination or destination airport, more connection points than you booked, a downgrade to a lower class of service, or (for an Individual with a Disability) different connecting airports. Arrival time is irrelevant to all four.",
          "exactQuote": "The Passenger is scheduled to travel on an itinerary with more connection points than that of the original itinerary; or E. The Passenger is downgraded to a lower class of service",
          "howToUse": "Compare the replacement itinerary to your original confirmation and name the specific subpart. Example: 'My original was nonstop; the replacement has a connection. That is subpart (D) of the Significantly Delayed or Changed Flight definition in Section 1(b), so Section 9(b)(1)(iii) applies.'",
          "catch": "The same 'Southwest-imposed' preface applies. And 9(b)(1)(iii) is conditioned on the passenger choosing 'not to fly on the Significantly Delayed or Changed Flight' — if you actually fly it, the election is gone. Decline before travel."
        },
        {
          "topic": "Involuntary refund — exclusive remedy, damages cap and payment timing",
          "ruleNumber": "Section 9(b)(1)(iii); exclusive-rem",
          "ruleNote": "Election at Section 9(b)(1)(iii); exclusive-remedy and damages cap at Section 9(b)(2); mechanics and timing at Section 4(c)(3)(i)–(vii)",
          "plainEnglish": "The refund covers the unused portion of the reservation including airfare, ancillary service fees, government fees and taxes. Credit-card refunds are processed typically no later than seven business days from the date Southwest determines the refund is due; cash purchases are refunded by check typically no later than 20 calendar days.",
          "exactQuote": "A refund to the original form of payment is your exclusive remedy in the event of a Southwest cancellation or Significantly Delayed or Changed Flight",
          "howToUse": "Cite Section 4(c)(3)(i) and the seven-business-day figure if the refund stalls. Note the outer limit in Section 4(c)(3): where a request is required, 'the Customer must make the request no later than one year from the date the Ticket was issued.'",
          "catch": "It is also a damages cap: 9(b)(2) continues 'Under no circumstances will Southwest be liable for incidental damages, consequential damages, special damages, or interest,' so the walk-up fare you buy on another carrier is not recoverable."
        },
        {
          "topic": "Rebooking on another airline",
          "ruleNumber": "Section 9(b)(1)(i); Section 10(a)(1)–(9)",
          "ruleNote": null,
          "plainEnglish": "Southwest owes you nothing on a competitor. Its only re-accommodation language is its own metal, and the verb is 'may', not 'will'.",
          "exactQuote": "Southwest may offer to transport the Passenger at no additional charge on the next Southwest Airlines flight(s) on which space is available",
          "howToUse": "Do not spend time demanding endorsement to another carrier — the contract does not support it. Pivot immediately to the refund election under Section 9(b)(1)(iii), get the money back to your card, and buy the competitor ticket yourself.",
          "catch": "Section 10(a)(7), in capitals: 'SOUTHWEST ASSUMES NO LIABILITY FOR THE ACTS OR OMISSIONS OF AN INTERLINE CARRIER.' Section 10(a)(5) adds that when Southwest ticket-issues with an Interline Carrier it 'acts only on behalf of such Interline Carrier.'"
        },
        {
          "topic": "Denied boarding — compensation amounts and the right to cash",
          "ruleNumber": "Section 9(c) (heading",
          "ruleNote": "Section 9(c) (heading: 'Denied Boarding Procedures Due to an Oversale'); amounts at 9(c)(5)(i)–(ii). NOTE the document's own cross-references call these subparts 'Section 9.b.(5)' and 'Section 9.b.(6)' — a genuine drafting inconsistency confirmed in the live PDF, so cite the section by NAME to avoid an argument about numbering.",
          "plainEnglish": "Involuntary denied boarding pays at least 200% of the Fare capped at $1,075 where the substitute arrival is more than 1 but less than 2 hours late domestic (1 to 4 hours international), and at least 400% capped at $2,150 beyond that. Payment is made on the day and at the place the denied boarding occurs, or within 24 hours if you depart first.",
          "exactQuote": "Compensation shall be at least four hundred percent (400%) of the Fare to the Passenger's destination or first Stopover, or Two Thousand One Hundred Fifty and 00/100 dollars ($2150.00), whichever is lower",
          "howToUse": "Refuse the LUV Voucher. Section 9(c)(5)(iv) preserves the election verbatim: the Passenger 'may refuse Southwest's offer of a voucher and insist on receiving compensation by draft.' Also demand the written explanatory statement of denied-boarding compensation and boarding priority rules, which 9(c)(6)(ii) requires them to hand you.",
          "catch": "Two escapes. 9(c)(4): nothing is owed if the substitute transportation is planned to arrive no later than ONE hour after your original arrival. 9(c)(3)(ii): no compensation where the denial results 'from substitution, for operational or safety reasons, of an aircraft having a lesser seating capacity' — a broad and frequently invoked carve-out. And 9(c)(5)(v): acceptance of compensation 'relieves Southwest from any further liability.'"
        },
        {
          "topic": "Denied boarding — ancillary fee refund, including for VOLUNTEERS",
          "ruleNumber": "Section 9(c)(6)(iii); refunded per",
          "ruleNote": "Section 9(c)(6)(iii); refunded per Section 4(c)(3)",
          "plainEnglish": "Separate from and on top of denied-boarding compensation, Southwest must refund unused optional-service fees — and it expressly applies whether you were bumped involuntarily OR volunteered.",
          "exactQuote": "In addition to the denied boarding compensation specified herein, Southwest shall refund all unused ancillary fees for optional services paid by a Passenger who is voluntarily or involuntarily denied boarding",
          "howToUse": "If you volunteered for a bump, still claim this; it is routinely overlooked. Say: 'Section 9(c)(6)(iii) requires refund of unused ancillary fees for optional services for voluntarily denied boarding as well. Please refund my upgraded boarding / seat fees under Section 4(c)(3).'",
          "catch": "Same subsection: 'Southwest is not required to refund the ancillary fees for services that are provided with respect to the Passenger's Alternate Transportation.' If the same product carries over to the new flight, nothing is owed."
        },
        {
          "topic": "Baggage — the categories Southwest refuses all liability for",
          "ruleNumber": "Section 7(g)(5) (High-Value Items)",
          "ruleNote": "Section 7(g)(5) (High-Value Items); Section 7(g)(4) (carry-on); Section 7(g)(6) (normal wear and defects); Section 7(f) (unsuitable baggage / limited release)",
          "plainEnglish": "The 7(g)(5) list continues through liquids, precious gems and metals, negotiable instruments, securities, business or personal documents, samples, items intended for sale, paintings and works of art, antiques, collectors' items, unique or irreplaceable items, heirlooms, research and scholastic items, manuscripts, furs and irreplaceable books — in carry-on OR checked baggage. Section 7(g)(4) separately disclaims all liability for personal property carried onboard, and 7(g)(6) excludes cuts, scratches, scuffs, stains, dents, punctures, marks, dirt and manufacturing defects.",
          "exactQuote": "Southwest assumes no responsibility for and will not be liable for money; jewelry; photographic, video, and optical equipment; computers and other electronic equipment; computer software; silverware and china; fragile or perishable items",
          "howToUse": "Do not check these categories. Excess valuation under 7(g)(2) does not cure the exclusion, so declaring value does not help. Realistic recovery is travel insurance or a credit-card benefit, not the airline.",
          "catch": "Section 7(f) is the sharper trap and is. You can be bound without signing anything."
        },
        {
          "topic": "Baggage — the very short claim deadlines and the liability cap",
          "ruleNumber": "Section 7(g)(8)(i)",
          "ruleNote": "Section 7(g)(8)(i)–(iii); cap at Section 7(g)(1); international time limits at Section 8(e)(1)",
          "plainEnglish": "Loss or substantial delay: notify and obtain a Baggage report number within FOUR HOURS. Damage: notify IN PERSON AT THE AIRPORT and obtain a report number within 24 hours. Lost bags additionally require a completed Property Loss Claim form postmarked or submitted within 30 days of the date Southwest issues it. Domestic cap is $4,700 per fare-paying passenger under 14 CFR 254.4.",
          "exactQuote": "the Passenger must notify Southwest of the claim and receive a Baggage report number not later than four (4) hours after either: (a) Arrival of the flight on which the loss or delay is alleged to have occurred, or; (b) Receipt of the Baggage",
          "howToUse": "Do not leave the airport without a Baggage report number — Section 7(g)(8) opens 'Southwest will not consider a claim unless the following steps are completed by the Passenger', making the report number a condition precedent. For international travel, Section 8(e)(1) applies the Convention windows instead: complaint within 7 calendar days for damage and 21 calendar days for delay, and an action for damages 'must be brought within two (2) years'.",
          "catch": "These are hard conditions, not guidelines, and they are far shorter than passengers assume — the 4-hour loss/delay window and the in-person 24-hour damage requirement are the most common reasons claims are refused outright. Section 8(e)(1) also requires in-person airport notification for international baggage damage."
        },
        {
          "topic": "Baggage — buying up the liability cap at $1 per $100",
          "ruleNumber": "Section 7(g)(1) and Section 7(g)(2)",
          "ruleNote": null,
          "plainEnglish": "At check-in you may declare value above the $4,700 cap and pay $1.00 for each $100.00 of excess valuation, to a maximum total declared value of $5,950.",
          "exactQuote": "The declared excess valuation for baggage shall not exceed One Thousand Two Hundred Fifty and 00/100 dollars ($1,250.00) above the Four Thousand Seven Hundred and 00/100 dollars ($4700.00) limitation",
          "howToUse": "Declare it at the counter at check-in — 7(g)(1) conditions it on declaration 'at time of check-in', so it cannot be added later. Ask for 'excess valuation coverage under Section 7(g)(2).'",
          "catch": "It buys only $1,250 of extra coverage, and 7(f)(7) routes High-Value Items into limited release regardless — so the categories most people want to insure remain excluded. Section 7(g)(2)(i) also lets Southwest inspect the bag and its contents once value is declared."
        },
        {
          "topic": "Force majeure — what is disclaimed, and what survives it",
          "ruleNumber": "Section 1(b) (definition of",
          "ruleNote": "Section 1(b) (definition of 'Force Majeure Event'); Section 6(a)(1) (safety) and 6(a)(2) (Force Majeure Event); refund duty at Section 9(b)(1)",
          "plainEnglish": "The definition continues through pandemic, public health emergency, catastrophe, government action, disturbance, volatile international conditions, armed conflict, civil unrest and riot. It lets Southwest cancel or delay at will under Section 6(a)(2).",
          "exactQuote": "Force Majeure Event means any event outside of Southwest's control, including, without limitation, acts of God, and meteorological events, such as storms, polar vortex, rain, wind, fire, fog, flooding, earthquakes, haze, or volcanic eruption",
          "howToUse": "What survives is the money. Section 9(b)(1) triggers on 'In the event Southwest cancels a flight' with no force-majeure exception attached, so the refund election stands even in a hurricane. Frame it: 'I am not disputing the cancellation. I am electing the Section 9(b)(1)(iii) refund, which the contract does not condition on cause.'",
          "catch": "Section 6(a)(1), verbatim: Southwest may cancel or delay a flight for reasons of aviation safety 'as determined unilaterally by Southwest... without any type of special, incidental, consequential, or other type of damages owed to the Passenger', and such reasons 'may include, without limitation, the lack of sufficient materials, staffing, or supplies for a flight to be operated.' Staffing shortages are effectively self-certified as safety cancellations."
        },
        {
          "topic": "Meals, hotel and ground transport — the structural trap",
          "ruleNumber": "Section 9(d)(1) (Ground Transportat",
          "ruleNote": "Section 9(d)(1) (Ground Transportation); Section 11(b)(1) (Customer Service Plan disclaimer); Section 9(b)(2) (damages cap)",
          "plainEnglish": "There is NO enforceable meal, hotel or ground-transport obligation anywhere in the Contract of Carriage. Section 9(d)(1) affirmatively disclaims ground transportation and puts it at the passenger's expense. The hotel and meal promises live in the Customer Service Plan, which Section 11(b)(1) declares is not a contract and which loses to the Contract of Carriage in any conflict.",
          "exactQuote": "The SWA CSP reflects Southwest Airlines' dedication to high-quality Customer service but is not a contract and does not create any contractual obligations on the part of Southwest",
          "howToUse": "Ask for the hotel and meal voucher at the airport as a service matter — Southwest does honour the CSP operationally for controllable disruptions. But do not build a small-claims case on it: under Wolens you sue on the Contract of Carriage, and this obligation was deliberately kept outside it. Sue on the refund instead.",
          "catch": "This is the single most important structural fact in the document. Section 9(b)(2) independently bars incidental, consequential and special damages, which is exactly what a hotel bill is. Note the contrast with American, whose Conditions of Carriage DO contain a hotel commitment."
        },
        {
          "topic": "Delayed bag — automatic refund of the oversize/overweight fee at 12 hours",
          "ruleNumber": "Section 7(g)(1)(ii)",
          "ruleNote": null,
          "plainEnglish": "If you paid an excess, oversize or overweight charge and the bag arrives 12+ hours late or never arrives, that specific charge is refunded, independently of any damages claim.",
          "exactQuote": "Southwest will refund the excess, oversize, and/or overweight charge paid if baggage is lost or delayed by twelve (12) or more hours following the arrival of the flight on which the baggage was expected to travel",
          "howToUse": "The subsection opens 'Provided the Passenger has notified Southwest of the loss or delay and received a Baggage report number' — so get the report number first, then state: 'My bag was delayed more than twelve hours; Section 7(g)(1)(ii) requires refund of the oversize/overweight charge.'",
          "catch": "Conditioned on the Baggage report number, which loops back to the four-hour reporting deadline in 7(g)(8)(i). It refunds only the special-handling charge, not the fare."
        },
        {
          "topic": "Suing Southwest — notice periods, venue and class-action waiver",
          "ruleNumber": "Section 11(a)(1)–(3); Section 11(c)(1)–(3)",
          "ruleNote": null,
          "plainEnglish": "Personal injury or death claims require written notice to Southwest within 21 days of the event (11(a)(1)). Suit must be commenced within one year of Southwest's WRITTEN denial (11(a)(2)). Governing law is Texas to the extent not preempted by federal law (11(c)(1)). Class and representative actions are waived (11(a)(3)).",
          "exactQuote": "No legal action on any claim described above may be maintained against Southwest unless commenced within one (1) year of Southwest Airlines' written denial of a claim, in whole or in part",
          "howToUse": "Get the denial in writing — the one-year clock runs from written denial, so a carrier that never denies in writing has arguably never started it. This is the Wolens vehicle: a small-claims breach-of-contract action citing a specific section (e.g. 9(b)(1)(iii)) is not preempted, whereas a state consumer-protection theory is.",
          "catch": "Section 11(c)(3) expressly renders the implied covenant of good faith and fair dealing 'inapplicable and... disclaimed' to the extent permissible by state law, and 11(c)(2) states no covenants or warranties 'may be implied in law or in equity.' Section 11(a)(3) strips attorneys' fees and any recovery from a passenger who proceeds classwide. The 21-day injury notice window is brutally short."
        }
      ]
    },
    {
      "airline": "American Airlines",
      "iata": "AA",
      "cocUrl": "https://www.aa.com/i18n/customer-service/support/conditions-of-carriage.html",
      "lastUpdated": "The live page carries 'Updated July 30, 2026' — four days before this check, which matters because AA revised this document repeatedly in 2026. SOURCING CAVEAT: aa.com returns HTTP 403 to direct…",
      "confidence": "medium",
      "scheduleChangeThreshold": "",
      "rebooksOnOtherAirlines": "No true Rule 240 — but not a flat no either, and the exact wording matters. If no American flights are available until the next day, and the disruption is caused by us, we'll rebook you on one of our partner airlines with available seats at no additional cost.' That is PARTNER-only, CONTROLLABLE-only and NEXT-DAY-only — three conjunctive conditions — not an obligation to endorse your ticket to any carrier with a seat. The old numbered Rule 240 endorsement is long gone. Both conditions ('caused by us' and 'no American flights until the next day') are where the argument is won or lost, so establish them on the record before asking.",
      "buriedGem": "The 4-hour international involuntary-refund trigger. AA's Conditions of Carriage set the international threshold at four hours, not the DOT's six — it is contractual (and therefore enforceable as a breach-of-contract claim under Wolens, where a DOT-rule violation is not privately enforceable), and almost nobody invokes it, because travellers who know the DOT dashboard assume six hours and stop asking at hour four. Script: 'Your Conditions of Carriage, updated July 30, 2026, set the involuntary refund trigger at 4 or more hours for international itineraries, not the DOT's six. My arrival delay exceeds four hours, so I am declining your alternative arrangements and requesting an involuntary refund of the unused ticket value and all optional fees to my original form of payment.' Runner-up gem: unlike Southwest, AA's hotel commitment for controllable overnight disruptions sits INSIDE the Conditions of Carriage, not only in the non-contractual Customer Service Plan.",
      "provisions": [
        {
          "topic": "Document structure — why there is no 'Rule 240' to cite",
          "ruleNumber": "Named section",
          "ruleNote": "None. The document is organised by NAMED sections — 'You', 'Your flight', 'Your ticket, bags & refunds', with subsections including 'Events beyond our control', 'Oversold flights', 'Delays, cancellations and diversions', 'Baggage liability (domestic flights)' — not by numbered tariff rules.",
          "plainEnglish": "Asking an AA agent for 'Rule 240' marks you as working from deregulation-era advice. The numbered domestic tariff rules were retired; the operative document is a named-section web page, supplemented by a separate Customer Service Plan.",
          "exactQuote": "Updated July 30, 2026",
          "howToUse": "Cite by section NAME and quote the sentence: 'Your Conditions of Carriage, under Delays, cancellations and diversions, state...' Screenshot the page at time of purchase — the page carries only an 'Updated' date and can be revised between your booking and your dispute.",
          "catch": "It does — 'Updated July 30, 2026' — and AA has used that malleability aggressively this year (see the downgrade provision below). The version you contracted on is the one you screenshotted, not the one live when you complain."
        },
        {
          "topic": "Involuntary refund — trigger, scope and the damages cap",
          "ruleNumber": "Section 'Delays",
          "ruleNote": "Section 'Delays, cancellations and diversions', read with 'Involuntary refunds' under 'Your ticket, bags & refunds'",
          "plainEnglish": "Cancellation, or a 3+ hour domestic / 4+ hour international departure or arrival delay, entitles you to a refund of the unused ticket value plus optional fees — but only if you decline (or are not offered) the alternative arrangements. AA states this is its sole obligation.",
          "exactQuote": "If your flight was delayed or canceled and you don't accept our alternative arrangements, or none were available, we'll refund the remaining ticket value and any optional fees according to our involuntary refunds policy. Beyond that, we have no further contractual obligation.",
          "howToUse": "Decline the rebooking explicitly and on the record BEFORE requesting the refund — the refund right is framed as the alternative to accepting re-accommodation. Ask for original form of payment and name the optional fees (seats, bags, upgrades) separately, since those are routinely omitted from the calculation.",
          "catch": "'our sole obligation' and 'Beyond that, we have no further contractual obligation' are damages caps: no fare differential on a competitor, no consequential loss. Note the asymmetry — the involuntary-refund trigger is 3h domestic / 4h international, but the separate non-refundable-ticket schedule-change refund is worded as 'a change of more than 4 hours to your departure time'. Cite the right one for your situation."
        },
        {
          "topic": "",
          "ruleNumber": "Section 'Your ticket",
          "ruleNote": "Section 'Your ticket, bags & refunds' (unnumbered)",
          "plainEnglish": "You are refunded the FARE DIFFERENCE between the cabin you bought and the cabin you flew, on the affected segment — not a flat percentage.",
          "exactQuote": "If you choose to travel when downgraded to a lower cabin, you will be refunded the difference between the original fare and the fare for the cabin flown on the affected segment.",
          "howToUse": "Compute the difference between the original fare and the fare for the cabin actually flown on that segment and demand exactly that, quoting the sentence above. If an agent offers a flat 40% of the ticketed fare, they are applying a superseded version — point to the July 30, 2026 update.",
          "catch": "MATERIAL, which drew a DOT complaint on the ground that DOT guidance requires the fare difference. The live page as of July 30, 2026 contains NO '40%' anywhere — AA appears to have backed down. Do not cite 40%; it would understate your claim by thousands on a long-haul premium ticket. Separately, a customer with a disability who declines to travel because a downgrade removed a needed accessibility feature is refunded promptly, as are their travel companions who choose not to fly."
        },
        {
          "topic": "Hotel and meals — AA's is CONTRACTUAL, unlike Southwest's",
          "ruleNumber": "Section 'Delays",
          "ruleNote": "Section 'Delays, cancellations and diversions'",
          "plainEnglish": "For a controllable disruption or a diversion that leaves you unboarded past 11:59 p.m. local on your scheduled arrival day, and you are away from your home city, AA commits IN THE CONDITIONS OF CARRIAGE to arrange or pay for a hotel. This is a contract term, not a Customer Service Plan courtesy.",
          "exactQuote": "If the disruption is our fault or you're diverted to another city, and we don't board before 11:59 p.m. local time on your scheduled arrival day, we'll arrange an overnight stay or cover the cost of an approved hotel with available rooms if you're away from your city of…",
          "howToUse": "Establish the three elements on the record: (1) the disruption is AA's fault or you were diverted, (2) you will not board before 11:59 p.m. local on your scheduled arrival day, (3) you are away from your city of residence. Then quote the sentence. Get WRITTEN authorisation before booking anything yourself.",
          "catch": "Note also there is no meal commitment in this sentence — only hotel."
        },
        {
          "topic": "Events beyond our control (force majeure)",
          "ruleNumber": "Section 'Events beyond our control'",
          "ruleNote": null,
          "plainEnglish": "The enumerated Force Majeure events include meteorological conditions, civil disturbances including war and embargoes, acts of terror, public health emergencies, labour disputes affecting AA's service, government regulations or requirements, shortage of labour, fuel or facilities of American or others, and any fact not reasonably foreseen or predicted by American. The effect is to sever hotel and expense obligations while leaving the residual-value refund intact.",
          "exactQuote": "When there's an event we can't control like weather, a strike or other civil disorder, we may have to cancel, divert or delay flights. If your ticket still has value (if you were, for example, re-accommodated in a different class of service) we'll refund the unused portion to…",
          "howToUse": "The classification decides everything. Ask the agent directly how the disruption is coded — controllable or uncontrollable — and get that answer in writing. That coding, not the actual weather, determines your hotel entitlement under the sentence quoted in the previous provision.",
          "catch": "'Shortage of labor... of American or others' is inside AA's own force-majeure list, so a staffing shortfall can be characterised as uncontrollable — the same self-certifying move Southwest makes through its aviation-safety clause. 'Any fact not reasonably foreseen or predicted by American' is a catch-all."
        },
        {
          "topic": "Oversold flights / denied boarding",
          "ruleNumber": "Section 'Oversold flights'",
          "ruleNote": "Section 'Oversold flights', implementing 14 CFR Part 250",
          "plainEnglish": "Volunteers first, then involuntary denied boarding by AA's boarding priority. The published table: domestic — up to 1 hour arrival delay, no compensation; 1–2 hours, 200% of one-way fare capped at $1,075; 2+ hours, 400% capped at $2,150. International — up to 1 hour, none; 1–4 hours, 200% capped at $1,550 (as printed on AA's page); 4+ hours, 400% capped at $2,150. Flights subject to EU261 offer a voucher or a cheque of EUR 300 (arrival delay under 4 hours) or EUR 600 (over 4 hours).",
          "exactQuote": "We will ask for passengers who are willing to voluntarily give up their seats in exchange for compensation in an amount and form to be determined solely at American's discretion.",
          "howToUse": "Insist on the written statement of denied-boarding compensation and boarding priority rules that Part 250 requires them to hand you, and insist on payment by cheque rather than a travel voucher — the federal election survives whatever the agent offers first. On an EU-departing flight, claim under EU261 as well; the amounts are independent of the US schedule.",
          "catch": "Volunteer compensation is expressly 'determined solely at American's discretion' — Part 250 protections attach to INVOLUNTARY denied boarding only, so once you volunteer you are negotiating, not enforcing. FLAG: the $1,550 international 1–4 hour cap printed on AA's page does not match the standard 14 CFR 250.5 figures ($1,075 / $2,150); verify the current federal caps before arguing that number, since the regulation controls if AA's table is stale."
        },
        {
          "topic": "Baggage (domestic) — liability limit and the exclusion list",
          "ruleNumber": "Named section",
          "ruleNote": "Section 'Baggage liability (domestic flights)'",
          "plainEnglish": "AA covers the provable value of loss, damage or delay to domestic checked baggage up to $4,700 per passenger, or up to $5,000 if you declare excess value at check-in. The exclusion list runs to antiques, artwork, books, business equipment, china, computers, fragile items, furs, jewelry, keys, liquids, medication, money, perishables, precious metals, timepieces and similar valuables. Normal wear — 'minor scratches, scuffs, stains, dents, cuts or dirt' — is excluded, as are carry-on items and improperly packed items. Wheelchairs and mobility devices are treated separately and ARE covered.",
          "exactQuote": "minor scratches, scuffs, stains, dents, cuts or dirt from normal wear and tear",
          "howToUse": "$4,700 is the 14 CFR 254.4 regulatory FLOOR, not a limit AA chose — it cannot contract below it. Document value with receipts and photographs, and claim the checked-bag fee back separately from the damages claim. Declare excess value at check-in if you must carry something above the cap; it cannot be added afterwards.",
          "catch": "The exclusion list is the operative document, not your memory of it — pull the current list off the page before a dispute, because the agent will read the enumerated categories back to you. Excess valuation does not defeat the exclusions."
        },
        {
          "topic": "Baggage — the reporting deadlines, which are shorter than passengers expect",
          "ruleNumber": "Named section",
          "ruleNote": "Section 'Baggage liability (domestic flights)'; international time limits governed by the Montreal Convention as incorporated",
          "plainEnglish": "Delayed bag: file within 4 hours of arriving at your final destination (12 hours if you used Bags VIP Luggage Delivery). Damaged bag: before leaving the airport, or within 6 hours of receipt. Mobility or medical device delayed: within 24 hours of arrival domestic, 21 days international. Mobility or medical device damaged: within 24 hours of receiving the device domestic, 7 days international. Expense questionnaires are due within 30 days, and legal action within 2 years.",
          "exactQuote": "If your bags are damaged, you should file a report before you leave the airport, or within 6 hours of receiving your bags.",
          "howToUse": "File before you leave the airport regardless of which window applies — carriers routinely argue that damage discovered later was not caused in transit. Keep every receipt for interim purchases and submit inside the 30-day window. If you travel with a wheelchair, note the 24-hour domestic device deadline: it is a 2026 tightening and it is easy to blow.",
          "catch": "They govern INTERNATIONAL itineraries; AA's domestic windows are far shorter — 4 hours for a delayed bag and 6 hours for damage. Do not rely on 7 or 21 days on a domestic ticket."
        },
        {
          "topic": "Customer Service Plan — whether AA disclaims it the way Southwest does",
          "ruleNumber": "Customer Service Plan",
          "ruleNote": "Customer Service Plan, aa.com/i18n/customer-service/support/customer-service-plan.html, issued under 14 CFR 259.5 — a separate document from the Conditions of Carriage",
          "plainEnglish": "AA's Conditions of Carriage links to the Customer Service Plan but, on the passes I made through the live page, contains no sentence expressly declaring the Plan non-contractual — unlike Southwest, whose Section 11(b)(1) says exactly that.",
          "howToUse": "This matters less for AA than it would for Southwest, because AA's hotel commitment for controllable overnight disruptions sits inside the Conditions of Carriage itself — so you can sue on the contract term directly rather than on the Plan. Cite the Conditions of Carriage sentence, not the Plan.",
          "catch": "UNRESOLVED: absence of a disclaimer in my extraction is not proof there is none — the proxy rendering may not have surfaced boilerplate. Do not build a suit on the Customer Service Plan alone without reading the live page yourself; the enforceable hotel language is in the Conditions of Carriage and that is the safer vehicle."
        }
      ]
    },
    {
      "airline": "Alaska Airlines, Inc. / Hawaiian Airlines, Inc. (single joint Contract of Carriage)",
      "iata": "AS / HA",
      "cocUrl": "https://www.alaskaair.com/content/legal/contract-of-carriage",
      "lastUpdated": "Revised May 26, 2026. The opening paragraph states carriage is 'provided by Alaska Airlines, Inc. and Hawaiian Airlines, Inc. (Alaska Airlines, Inc. and Hawaiian Airlines, Inc. are referred to herein…",
      "provisions": [
        {
          "topic": "Schedule change — threshold for free change or full refund",
          "ruleNumber": "Rule 1, definition XX (",
          "ruleNote": "Rule 1, definition XX ('Significantly delayed or Changed Flight'), read with Rule 8.B.b",
          "plainEnglish": "Three hours is the trigger — and it is not only about time. Definition XX lists seven triggers: (a) departure 3+ hours earlier or later; (b) arrival 3+ hours earlier or later; (c) different origination or destination airport; (d) downgrade to a lower class of service; (e) an itinerary with more connection points than the original; (f) for a guest with a disability, different connecting airports; (g) for a guest with a disability, a substitute aircraft missing needed accessibility features. Triggers (c)–(g) carry NO minimum time threshold. Definition XX draws no domestic/international distinction, so the 3-hour trigger applies to transpacific Hawaiian flying too, where the DOT…",
          "exactQuote": "The guest is scheduled to depart from the origination airport three or more hours earlier or later than the original departure time.",
          "howToUse": "Say: 'Under Rule 1 definition XX my itinerary is a Significantly delayed or Changed Flight because [3+ hr shift / added connection point / downgrade / airport change]. I am declining rebooking and declining any voucher, and I am requesting a refund to my original form of payment under Rule 8.B.b and Rule 17.D.' Put it in writing the same day. The 'more connection points' trigger (XX.e) is the one agents do not know about — quote it word for word.",
          "catch": "It then fires only if all three conditions are met: (i) you decide not to fly the changed flight; (ii) you do not accept rebooking (or none can be offered); and (iii) you do not accept a voucher, if offered. Accept the travel credit and you have waived the cash refund. Separately, Rule 8.A.c disclaims schedule times as 'not guaranteed and are not a part of this contract,' and Rule 8.B.a states Alaska is 'not liable for any Flight Cancellation or Significantly Delayed or Changed Flight' — both will be cited against any damages claim beyond the refund. Note also that for a DOWNGRADE where you still choose to fly, Rule 8.B.b's Note and Rule 17.C.a give only the fare difference, not a full…"
        },
        {
          "topic": "Rebooking on a competitor (the old 'Rule 240' question)",
          "ruleNumber": "Rule 8.H.e (denied boarding) and",
          "ruleNote": "Rule 8.H.e (denied boarding) and Rule 8.D (force majeure); Rule 6.B.b (endorsement); Rule 4.M",
          "plainEnglish": "Honest answer: there is NO general Rule 240-style obligation. The only place the contract mentions putting you on another airline is involuntary denied boarding (Rule 8.H.e), and even there it is expressly 'at Alaska's sole discretion.' For ordinary cancellations and delays, Rule 8.D says Alaska 'may' re-accommodate you on another carrier — permissive, not mandatory. Rule 6.B.b's endorsement right is only for rerouting at YOUR request, and Rule 6.B.a limits Alaska to reissuing 'only between points on the original Ticket which it serves.' Rule 4.M cuts the other way entirely.",
          "exactQuote": "if unable to provide onward transportation acceptable to the Passenger, at Alaska's sole discretion and the request of the Passenger, will transport the Passenger by other Carrier or combination of Carriers",
          "howToUse": "Only invoke this if you were denied boarding on an oversold flight. Then say: 'Rule 8.H.e — I am requesting transportation on another carrier without Stopover on its next flight in my original class of service, at no additional cost.' You must actually make the request; the rule is conditioned on 'the request of the Passenger.' For a cancellation, do not argue Rule 8.H — argue Rule 8.B.b for the refund and rebook yourself.",
          "catch": "'At Alaska's sole discretion' is fatal to enforcing it as a duty. The interline flight need only be provided if it 'will provide an earlier arrival at the Passenger's destination, next Stopover point, or transfer point.'.E.d item (iii) — 'may not be endorsed to or accepted by any other carrier' — not item (iv) (which is the non-refundable/non-transferable clause)."
        },
        {
          "topic": "Involuntary refund",
          "ruleNumber": "Rule 17.D (amount), with Rule 17.",
          "ruleNote": "Rule 17.D (amount), with Rule 17.A (entitlement), Rule 17.E (escape hatch), Rule 17.G (outside limit)",
          "plainEnglish": "When Alaska/Hawaiian cancels, significantly changes, denies you boarding, or refuses transport through no fault of yours, Rule 17.D sets the amount: the full fare and charges paid if wholly unused, or the difference between fare paid and the fare applicable to the used portion if partly used. Rule 17.A confirms any refund due is made using the original form of payment.",
          "exactQuote": "If no portion of the Ticket has been used and no portion of the transportation has been provided: An amount equal to the fare and charges paid.",
          "howToUse": "Write: 'This is a request for an involuntary refund under Rule 17.D following a Rule 8 schedule irregularity. Refund the full fare and charges to the original form of payment.' Cite 17.D, not 17.H — Rule 17.H is expressly headed 'Voluntary Refunds' and routes you to a Credit instead of cash. For timing, the general refund-issuance provision is Rule 17.B.a.v (seven business days for credit card, twenty business days for cash/check/other); back it up with the DOT prompt-refund rule, since 17.B is headed 'Refunds of refundable tickets' and an agent may argue it does not govern an involuntary 17.D refund.",
          "catch": "Fly you into any airport in the same cluster and your refund evaporates. Also Rule 17.D.a: no obligation to refund a fully unused Ticket that 'does not reflect a confirmed reservation on an Alaska flight involved in a schedule irregularity, unless such Ticket was issued by Alaska.' Rule 17.G: 'Refunds will not apply for Tickets presented later than one (1) year from the date of issuance of the original Ticket.'"
        },
        {
          "topic": "Denied boarding — procedure and compensation",
          "ruleNumber": "Rule 8.H (procedure, boarding pr",
          "ruleNote": "Rule 8.H (procedure, boarding priority, exclusions) and Rule 8.I (amounts)",
          "plainEnglish": "Volunteers must be solicited first (8.H.c). If not enough volunteer, boarding priority under 8.H.d is: all passengers holding confirmed seat assignments board first, then passengers without confirmed seat assignments in order of check-in time (with possible exceptions for unaccompanied minors, qualified individuals with a disability, or severe hardship). Amounts under 8.I.a (domestic): no compensation if rerouted to arrive within 1 hour; at least 200% of the fare capped at $1,075 for 1–2 hours; at least 400% capped at $2,150 for over 2 hours. International from the U.S. (8.I.b) uses the same percentages on a 1–4 hour band. Canada-origin (8.I.c) is a flat CAD $400 / CAD $800. Rule 8.H.e adds…",
          "exactQuote": "At least 400% of the fare to the Passenger's destination or first Stopover, or $2,150, whichever is lower, if Alaska does not offer alternate transportation … more than two (2) hours after the planned arrival time",
          "howToUse": "At the gate say: 'I am being denied boarding involuntarily. Under Rule 8.I I am entitled to [200%/400%] of my fare to my destination or first Stopover, and I decline a travel certificate — I want the payment.' If they warned you about possible involuntary bumping while asking for volunteers, note that Rule 8.H.c bars them from later bumping you involuntarily unless you were told at that moment both of the possibility AND 'of the amount of compensation to which he/she would have been entitled' — if they did not state the amount, say so.",
          "catch": "Rule 8.H.g strips compensation entirely if: the flight is cancelled; a smaller-capacity aircraft was substituted for government requisition, operational or safety reasons and Alaska 'took all reasonable measures to avoid the substitution'; on a 60-or-fewer-seat aircraft a safety weight/balance restriction applies; you are re-accommodated in another section at no extra charge; Alaska gets you there within one hour; or you are a non-revenue/standby traveler. Missing the check-in cutoff cancels your reservation and makes you ineligible. Rule 8.H.a: on Codeshare Partner-operated flights the OPERATING carrier's contract governs, and flights oversold originating outside the U.S.A./Canada get…"
        },
        {
          "topic": "Baggage — exclusions from liability and claim deadlines",
          "ruleNumber": "Rule 15.N (limits and exclusions)",
          "ruleNote": "Rule 15.N (limits and exclusions), Rule 15.N.c (unsuitable-articles list), Rule 15.P (declared value), Rule 15.Q (24-hour notice), Rule 15.R (time limits)",
          "plainEnglish": "Domestic cap is USD $4,700 per ticketed passenger (Rule 15.N, per 14 C.F.R. 254.4); Rule 15.P lets you declare up to USD $5,000 at $1.00 per $100.00 of additional declared value. Rule 15.N.c lists exactly 21 enumerated categories for which Alaska assumes NO liability in checked baggage: cash/currency; negotiable papers; securities; business or personal contracts and documents; jewelry and watches; cameras, video and photographic equipment; electronic equipment/devices; computers and components; binoculars/telescopes/eyeglasses; silverware, pottery, porcelain and china; precious metals and stones; art objects, sculptures, paintings; historical artifacts; original manuscripts; irreplaceable…",
          "exactQuote": "For Domestic Carriage, notice and proof of loss must be presented in writing to an office of Alaska within forty-five (45) days after the alleged occurrence of the events giving rise to the claim",
          "howToUse": "File the airport report before you leave the baggage hall — Rule 15.Q's clock is 24 hours, not 24 days. Then send written notice within 45 days: 'Written notice of claim under Rule 15.R.b.' If they reject you as late, quote the saving clause verbatim: 'Failure to give the above notice shall not be a bar if the claimant can show good cause for his/her failure to bring the claim within 45 days.' If a wheelchair or assistive device is involved, invoke Rule 15.O instead — the $4,700 cap is waived entirely.",
          "catch": "Rule 15.N.c's list swallows most of what is actually valuable in a suitcase, and Rule 15.P expressly provides that 'Excluded items listed in Rule 15(N)(1) above are not acceptable for higher value declaration' — so you cannot buy coverage for your laptop at any price. And 15.N.f: 30 minutes after the bag is made available in the public claim area, it stops being their problem."
        },
        {
          "topic": "Force majeure and irregular operations — what they disclaim and what survives",
          "ruleNumber": "Rule 8.D and Rule 8.A.c",
          "ruleNote": "Rule 8.D and Rule 8.A.c/8.A.d, with the definition at Rule 1.BB; Rule 7.A",
          "plainEnglish": "Rule 1.BB defines a Force Majeure Event as 'any event outside Carrier's control,' including weather conditions. Rule 8.D then lets them cancel, divert, postpone or delay 'without any liability to Alaska, subject to Applicable Laws.' Rule 8.A.c disclaims all published schedule times as 'not guaranteed and are not a part of this contract.' What SURVIVES is the important part: Rule 8.B is expressly written to apply to 'any Cancellation or Significantly Delayed or Changed Flight' with no controllability carve-out — so the Rule 8.B.b / Rule 17.D refund right is not lost to weather. Only the Rule 8.E amenities are lost, because 8.E is limited to 'a lengthy delay caused by us' and 8.E.a to…",
          "exactQuote": "we may cancel, terminate, divert, postpone, or delay any flight, right of carriage, or reservations (whether or not confirmed) without any prior notice to you",
          "howToUse": "When an agent says 'it's weather, there's nothing we can do,' answer: 'Agreed on hotels — Rule 8.E is limited to delays caused by you. But Rule 8.B applies to ANY Cancellation or Significantly Delayed or Changed Flight with no weather exception, so my refund right under 8.B.b and Rule 17.D is unaffected. Please process the refund to my original form of payment.' That distinction wins the argument. Bonus: Rule 1.SS defines 'Schedule Irregularity' as excluding Force Majeure Events, which means the Rule 17.E co-terminal no-refund bar is itself keyed to non-force-majeure irregularities.",
          "catch": "Rule 8.D's full text continues: they 'may offer to re-accommodate you on another available Alaska flight or on another carrier or combination of carriers, or may refund you or provide you a travel certificate for any unused portions of your ticket.' Do not accept the certificate — Rule 8.B.b(iii) makes accepting a voucher fatal to the cash refund, and Rule 8.E.d makes accepting a travel credit a waiver of the amenities. Rule 7.A separately lets them cancel your reservation outright 'whenever necessary or advisable by reason of a Force Majeure Event.' Rule 8.B.a also disclaims liability for the cancellation itself."
        },
        {
          "topic": "Meals, hotel, and ground transportation",
          "ruleNumber": "Rule 8.E.a (hotel), 8.E.b (meals",
          "ruleNote": "Rule 8.E.a (hotel), 8.E.b (meals), 8.E.c (ground transport), 8.E.d (the waiver)",
          "plainEnglish": "Hotel: if you experience an overnight stay at an airport 100 or more miles from your home because your flight is cancelled or delayed due to circumstances within their control, they provide complimentary accommodation plus round-trip ground transportation — by voucher, or reimbursement of reasonable hotel and round-trip ground transport costs if no voucher hotels are available. Meals: a reasonable meal at the airport if the delay will extend beyond three hours. Ground transport: provided, or reimbursed on receipt, when lodging is provided and the hotel does not shuttle.",
          "exactQuote": "We will offer a reasonable meal to each ticket guest at the airport if the delay will extend beyond three (3) hours.",
          "howToUse": "Ask by rule: 'Rule 8.E.b — my delay exceeds three hours, I am requesting a meal.' For an overnight: 'Rule 8.E.a — I am 100 or more miles from home and this is a delay within your control; I am requesting a hotel voucher, or reimbursement for reasonable hotel and round-trip ground transportation costs if no voucher hotels are available.' Keep every receipt; the rule is written in reimbursement terms.",
          "catch": "Rule 8.E.d: 'Your acceptance of a travel credit indicates your waiver of any of the above amenities.' Take the credit at the gate and you have contracted away the hotel. Rule 8.E.c kills reimbursement where ground transport 'has been offered but not accepted by you for whatever reason.' The hotel obligation is also conditioned on there being 'available hotels in the area,' and the 100-mile-from-home condition means locals get nothing. Note the meals clause (8.E.b) also states no alcoholic beverages and that options 'may depend on airport vendor availability.'"
        },
        {
          "topic": "Bereavement / compassion refund of a nonrefundable fare",
          "ruleNumber": "Rule 17.H.f",
          "ruleNote": null,
          "plainEnglish": "Buried in the middle of the VOLUNTARY refunds rule: Alaska/Hawaiian will refund a guest on a main fare who cannot commence or continue travel because of the death of an immediate family member — expressly 'regardless of if they were traveling or not' — or of a travelling companion on the same itinerary and dates. This is a refund, not a credit, and it is not advertised in the booking flow.",
          "exactQuote": "Alaska will issue a refund for a guest on a main fare who is unable to commence or continue travel because of the death of their immediate family member(s)",
          "howToUse": "Call or write: 'I am requesting a refund under Rule 17.H.f, the Compassion Policy.' Have ready exactly the four things the rule demands at the time of refund — name of the deceased, relation of the deceased to the passenger, name of the funeral home, and the funeral home's phone number. Supplying all four up front is what gets it approved; agents unfamiliar with 17.H.f will otherwise offer a credit.",
          "catch": "Expressly limited to a guest 'on a main fare' — Saver/basic fares are outside it. It sits under Rule 17.H (Voluntary Refunds), so the general 17.H conditions apply: the reservation must be cancelled prior to ticketed departure time, the ticket must be on Alaska ticket stock (carrier code 027) per 17.H.e, and unused flight coupons must be surrendered within one year of the Ticket issue date per 17.H.d (reinforced by Rule 17.G)."
        },
        {
          "topic": "Free extension of ticket validity when they cancel",
          "ruleNumber": "Rule 4.N",
          "ruleNote": null,
          "plainEnglish": "If an Alaska flight cancellation, or Alaska's inability to provide space, prevents you from using a ticket during its validity period, Alaska must extend the validity — with no additional collection of fare — until its first flight with space available in the class of service you paid for. This is a distinct right from a refund, useful when you want the trip rather than the money and the expiry date is closing in.",
          "exactQuote": "Alaska will, without additional collection of fare, extend the Ticket validity period of such Passenger's Ticket until the first flight of Alaska on which space is available",
          "howToUse": "Say: 'Rule 4.N — my Ticket validity must be extended without additional collection of fare to your first flight on which space is available in the class of service for which the fare has been paid, because an Alaska flight cancellation prevented me from using it.' This defeats a demand for a fare difference or a reissue fee.",
          "catch": "It only extends validity; it does not confirm you on any particular flight. 'Space available in the class of service for which the fare has been paid' lets them wait for inventory in your original fare bucket rather than putting you on the next departure. The trigger is limited to an Alaska flight cancellation or Alaska being unable to provide space — not your own change of plans."
        },
        {
          "topic": "Wheelchairs and assistive devices — liability cap waived entirely",
          "ruleNumber": "Rule 15.O (and Rule 15.N Exception 1)",
          "ruleNote": null,
          "plainEnglish": "The $4,700 domestic baggage cap does not apply to wheelchairs or other Assistive Devices. Liability is based on the cost of repair or the replacement value of the device. Rule 15.N Exception 1 frames it as 'the original, documented purchased price of the device' (except for International Carriage to or from Canada).",
          "exactQuote": "Alaska's normal limit of liability will be waived for substantiated claims involving loss, damage, or delay in delivery to wheelchairs or other Assistive Devices",
          "howToUse": "State: 'Rule 15.O — the normal liability limit is waived for Assistive Devices. My claim is based on cost of repair or replacement value, not the $4,700 baggage cap.' Then supply exactly what Rule 15.O.b lists: the baggage incident report number, your itinerary, the baggage tag, evidence of purchase, and the model, serial number and type of the device. Supplying all of it pre-empts the usual document ping-pong. You may also request that Alaska make the repairs, which 15.O.b expressly permits at the passenger's request.",
          "catch": "Rule 15.O.a actually requires a WRITTEN REPORT to an Alaska representative within TWENTY-FOUR (24) HOURS of arrival; only if you cannot file within that window may you contact Alaska Central Baggage at 1-877-815-8253 within SEVEN (7) CALENDAR DAYS — and by its own terms that reporting paragraph is framed as applying to Carriage to or from Canada. Do not rely on a 72-hour deadline. the repair/replacement-value measure excludes flights departing from the EEA or the UK, and Rule 15.O.c lets Alaska inspect and document pre-existing damage at check-in (which becomes their defence later) and refuse oversized devices that cannot be carried safely on small aircraft."
        }
      ],
      "buriedGem": "Rule 1 definition XX combined with Rule 8.B.b: a 'Significantly delayed or Changed Flight' includes an itinerary with 'more connection points than the original itinerary' (XX.e) and a downgrade 'to a lower class of service' (XX.d) — with NO minimum time threshold. So if Alaska/Hawaiian converts your nonstop into a connection, you are contractually entitled to a full refund of a NONREFUNDABLE ticket to your original form of payment even though nothing is late. Practically nobody invokes this, because the industry folk wisdom is 'you need a 3-hour delay.' Two honest caveats added on verification: Rule 8.B.b requires that you hold a nonrefundable ticket, that Alaska be the merchant of record, and that you decline both the rebooking and any voucher; and for the downgrade trigger specifically, if you still choose to fly, the 8.B.b Note and Rule 17.C.a give only the fare difference. The 'more connection points' trigger is the clean one. Definition XX also draws no domestic/international…",
      "rebooksOnOtherAirlines": "No — not as a general obligation. The only interline commitment is for denied boarding, and it is discretionary: Rule 8.H.e provides transport 'by other Carrier or combination of Carriers' only 'at Alaska's sole discretion and the request of the Passenger,' and only if that flight 'will provide an earlier arrival.' For ordinary cancellations Rule 8.D is purely permissive — 'We may offer to re-accommodate you on another available Alaska flight or on another carrier or combination of carriers, or may refund you or provide you a travel certificate for any unused portions of your ticket.' Rule 6.B.b's endorsement right runs only to rerouting at the passenger's request made at least 3 hours before departure, and Rule 6.B.a limits Alaska to points on the original Ticket 'which it serves.' Rule…",
      "scheduleChangeThreshold": "Three hours in either direction on departure OR arrival (definition XX.a and XX.b) — plus five non-time triggers with no threshold at all: a different origination or destination airport (XX.c), a downgrade to a lower class of service (XX.d), an itinerary with more connection points than the original (XX.e), and, for a guest with a disability, different connecting airports (XX.f) or a substitute aircraft missing needed accessibility features (XX.g). Any one makes it a 'Significantly delayed or Changed Flight' under Rule 1 definition XX and unlocks the Rule 8.B.b / Rule 17.D refund. Definition XX draws no domestic/international distinction, so it applies equally to both.",
      "confidence": "high"
    },
    {
      "airline": "JetBlue",
      "iata": "B6",
      "cocUrl": "https://cms.jetblue.com/public/dam/ui-assets/p/legal/Contract_of_Carriage_2026-06-01.pdf",
      "lastUpdated": "2026-06-01, Revision 102 — confirmed in the footer of every page of the live PDF. It supersedes Revision 98 of 2025-06-27, which JetBlue's public-facing links were still serving.",
      "confidence": "medium",
      "scheduleChangeThreshold": "There is none, and this is the single most important thing to know about JetBlue's contract. There is no defined \"significant change,\" no delay threshold, and no refund right triggered by a delay of any length. Section 25.b disclaims schedules outright — times \"are not guaranteed and form no part of this Contract of Carriage\" — and Section 25.a limits your remedy to actual cancellation or failure to operate. Section 4 (Changes, Cancellations, and Refunds) covers only voluntary passenger-initiated changes and says nothing about airline-initiated schedule changes. JetBlue's published 3-hour/6-hour significant-change policy lives in its Customer Assurance \"Our Promise\" pages, and Section 37.e states in terms that those policies \"form no part of this Contract of Carriage\" and may be revised…",
      "rebooksOnOtherAirlines": "Flatly no, and JetBlue is unusually blunt about it. Section 28 (\"Reservations on Other Carriers\") is a single sentence in its entirety: \"Carrier will only accept reservations made on, or tickets issued by, other carriers, in accordance with federal law when a carrier has ceased operations following bankruptcy.\" That is the REVERSE direction — JetBlue honoring a failed airline's ticket — and it is the only cross-carrier accommodation anywhere in the document. Sections 25.a and 26 both confine your remedy to \"another of Carrier's flights,\" and Section 37.c to \"the next available JetBlue flight.\" Section 36 provides that where an interline partner appears on your ticket JetBlue acts \"only as agent for such other airline\" and assumes no responsibility for it. There is no Rule 240 and no…",
      "buriedGem": "Section 38.a.1 — the lowest-available-fare guarantee, with a stated money remedy written into the contract itself. If you book by phone at 1-800-JETBLUE or at a JetBlue ticket counter or city ticket office and supply specific dates and times, JetBlue must offer the lowest available fare; if it fails to, the contract fixes its liability at \"the difference between the fare quoted and the lowest available fare for which the Passenger was eligible at that time.\" It is a liquidated-damages clause sitting at the bottom of the Passenger Service Plan where nobody reads, it is in the contract text rather than the non-binding hyperlinked policies, and essentially no passenger ever claims it — exactly the kind of small, provable, contract-based claim Wolens leaves open. The claim only works against a lower fare that was available through the SAME channel at that time.",
      "provisions": [
        {
          "topic": "Schedule change / delay",
          "ruleNumber": "Section 25.a and 25.b; Section 37.e",
          "ruleNote": null,
          "plainEnglish": "A delay of any length gives you nothing under this contract. Schedules are expressly excluded from it, JetBlue may substitute carriers or aircraft and alter or omit intermediate stops without notice, and it disclaims all liability for missed connections — including connections to its own flights. Only an actual cancellation or failure to operate triggers the refund/rebooking choice.",
          "exactQuote": "times shown in schedules or elsewhere are not guaranteed and form no part of this Contract of Carriage",
          "howToUse": "Do not argue the contract here — you will lose. Argue the federal rule: \"Under the DOT refund rule this is a significant change and I am requesting a refund to the original form of payment, not a Travel Bank credit.\" You may cite JetBlue's published Customer Assurance thresholds as evidence of its own practice and as a fairness argument, while understanding Section 37.e means they are not contract terms you can sue on. Get anything an agent promises verbally in writing — Section 29 lets JetBlue change the contract at any time without prior notice.",
          "catch": "Section 37.e removes the entire Customer Assurance program from the contract, so the generous-sounding public policy is revocable at will and is not what you sue on. Section 25 also stacks all-caps waivers of special, incidental and consequential damages in both subsection a and subsection b."
        },
        {
          "topic": "Cancellation — your two options",
          "ruleNumber": "Section 25.a and Section 37.c",
          "ruleNote": null,
          "plainEnglish": "If JetBlue cancels or fails to operate a flight, you choose: transport on another JetBlue flight in the same class of service at no additional charge, or a full refund. If part of the trip was already flown, the refund equals the applicable one-way fare for the cancelled portion.",
          "exactQuote": "A Passenger whose flight is cancelled by JetBlue will receive, at the Passenger's option, a full refund or reaccommodation on the next available JetBlue flight in the same class of service at no additional charge or fare",
          "howToUse": "Use the contract's own words: \"Under Section 37.c I am exercising my option for a full refund to the original form of payment,\" or \"for reaccommodation on the next available JetBlue flight in the same class of service at no additional charge.\" The phrase \"at the Passenger's option\" is the operative language — the choice is yours, not the agent's — so push back on any offer of a Travel Bank credit as the only remedy. Section 25.a is the parallel cite and uses \"at the request of the Passenger.\"",
          "catch": "Section 37.a.2 excludes taxes and fees from all Section 37 refunds, makes YOU responsible for chasing compensation if you booked outside a JetBlue channel, and converts TrueBlue Award bookings into points rather than money — except in the case of involuntary denied boarding, which is refunded normally. Section 37.a.3 disqualifies itineraries originating in the UK or an EC state from Section 37 relief entirely, leaving only EU261/UK261. And \"same class of service\" is limited to JetBlue metal — see Section 28."
        },
        {
          "topic": "Denied boarding — your refund-or-reroute option",
          "ruleNumber": "Section 26 (read with Section 4.c.3",
          "ruleNote": "Section 26 (read with Section 4.c.3 for refund mechanics)",
          "plainEnglish": "Its first sentence merely routes cancellations to Section 37. Where JetBlue denies boarding to a passenger with a valid reservation, you may take either free transport on another JetBlue flight to the same destination subject to space, or a refund of the applicable fare paid. Partial trips are refunded at the applicable one-way fare for the unflown portion.",
          "exactQuote": "the Passenger will be entitled, at his or her option, to either (i) transportation at no extra charge on another of Carrier's flights to the same destination, subject to space availability, or (ii) a refund of the applicable fare paid",
          "howToUse": "Ask for it as \"the option under Section 26,\" and add \"to the original form of payment\" every single time — Section 4.c.3 confirms refunds go to the original form of payment, but JetBlue's default offer is a Travel Bank credit. Section 38.a.5 commits JetBlue to credit card refunds \"promptly\" and cash or check refunds within 20 days of receiving all necessary information; quote that if it stalls. Note this is separate from and additional to the denied-boarding COMPENSATION under Section 27.",
          "catch": "Do not cite Section 26 for a cancellation — its cancellation sentence only cross-refers to Section 37, and an agent reading along will catch the error. The rebooking option is capped at \"another of Carrier's flights\" and is \"subject to space availability,\" which on a thin JetBlue route can mean days. Section 24.g separately makes a Section 26 refund the SOLE recourse for a passenger refused carriage or removed en route, with an all-caps bar on indirect, special and consequential damages."
        },
        {
          "topic": "Denied boarding — procedure and compensation",
          "ruleNumber": "Section 27 (a–f), reinforced by Section 37.f",
          "ruleNote": null,
          "plainEnglish": "On an oversold flight, involuntary bumping pays 200% of the one-way fare capped at $1,075 if the rebooking arrives 1–2 hours late domestic (1–4 hours international), or 400% capped at $2,150 beyond that. JetBlue bumps in reverse check-in order — last to check in goes first — and must give you a written explanatory statement before the denied boarding occurs.",
          "exactQuote": "Carrier shall deny boarding to such Passengers in the order of when Passengers checked in, commencing with those Passengers who checked in last.",
          "howToUse": "Check in the instant the window opens — Section 27.e makes check-in time the sole bumping criterion, so this is the one rule you can pre-empt entirely. At the gate: \"I am not volunteering; this is an involuntary denied boarding under Section 27.\" Then: \"Section 27.f requires a written explanatory statement before I am denied boarding — please provide it.\" That statement is the document that proves your claim later. Do not sign anything until the compensation amount is stated in writing.",
          "catch": "Section 27.c makes acceptance of the compensation a full release of further liability. Section 27.d strips eligibility where you did not fully comply with ticketing and check-in rules, where a smaller aircraft was substituted for operational or safety reasons, where you were reseated at no extra charge, where alternate transport arrives within one hour, or where you volunteered. Section 27.d.2 excludes flights originating in the UK or an EC state from Section 27 altogether — those fall to EU261/UK261 instead. Section 27.a and 37.f both stress that accepting a volunteer offer of ANY amount forfeits involuntary compensation."
        },
        {
          "topic": "Baggage — exclusions and the very short claim clock",
          "ruleNumber": "Section 18 (limits",
          "ruleNote": "Section 18 (limits/exclusions), Section 19 (fragile), Section 20 (improperly packaged), Section 22.a (deadlines)",
          "plainEnglish": "Domestic liability caps at $4,700, raisable to $5,000 total for $1 per $100 declared at check-in. JetBlue refuses to carry — and pays nothing for — medicines, money, checks, securities, jewelry and watches, wigs, cameras, video/audio and other electronic equipment including computers and software, CDs/DVDs, automotive and boat parts, silverware, optical equipment including contact lenses, dental and orthodontic devices, keys, negotiable papers, business documents, samples, paintings, antiques, artifacts, manuscripts, animal antlers, furs, irreplaceable books, writing instruments, heirlooms and collector's items. Section 19 adds a broad no-liability list of fragile goods: bicycles, musical…",
          "exactQuote": "initial notice of any claim for loss, damage, or delay in delivery of baggage must be given at any Passenger service counter or any office of Carrier within four (4) hours after arrival of the flight",
          "howToUse": "Do not leave the airport without filing at the baggage service counter — four hours is the tightest initial-notice window at any major U.S. carrier and it runs from flight ARRIVAL, not from when you give up at the carousel. Then send the confirming written claim within 21 days. If you miss either deadline, Section 22.a preserves the claim where you satisfy JetBlue you were unable to give notice, so state your reason expressly. If a wheelchair or assistive device was damaged, quote Section 18.b: Qualified Individuals with a Disability \"will have no limit on liability for repair or replacement.\"",
          "catch": "Section 18.f is unusually harsh — for domestic transportation, if an excluded valuable is lost, damaged or delayed, \"Passenger will not be entitled to any reimbursement or compensation from Carrier, whether or not a limited liability release has been signed.\" Excess valuation may not be declared on Section 18.f, Section 19 or Section 20 items. Section 18.g excludes wheels, handles, zippers, external locks and straps from fair wear and tear, and Section 18.h bars special, incidental and consequential damages entirely. Recovery is original purchase price less depreciation. The one-year suit clock runs from JetBlue's WRITTEN denial — so make it deny in writing rather than letting the claim go…"
        },
        {
          "topic": "Force majeure — what is disclaimed",
          "ruleNumber": "Section 25.c",
          "ruleNote": "Section 25.c; \"Controllable Irregularity\" and \"Force Majeure Event\" defined in Section 1",
          "plainEnglish": "JetBlue has no liability for any delay, cancellation or default caused by force majeure, defined to include weather and acts of God, riots, civil unrest and protests, pandemic declaration or public health emergency, strikes and any labor-related dispute, wars and hostilities, government regulation or directive, shortages of labor, fuel or facilities, and a catch-all for anything beyond its control or not reasonably foreseen. What survives is Section 25.a/26/37.c — refund or rebooking on JetBlue.",
          "exactQuote": "Any other condition or cause beyond Carrier's control or any fact not reasonably foreseen by Carrier.",
          "howToUse": "The leverage word is \"Controllable Irregularity,\" defined in Section 1 as a delay, cancellation or diversion that is NOT caused by a Force Majeure Event — and defined \"as used in Section 38,\" which is precisely where the amenities live. Ask the agent to state on the record whether the disruption is a Controllable Irregularity, because that single classification is what unlocks Section 38.a.12. Crew shortage attributable to JetBlue's own scheduling, maintenance and aircraft swaps are not enumerated in the Section 25.c list.",
          "catch": "\"Shortages of labor\" and \"any other labor-related dispute\" are both enumerated force majeure events, so JetBlue's own crew shortfall can be argued into the exclusion despite not being force majeure in the ordinary sense. The Section 1 definition also chains the exclusion forward: if the original event in a chain of multiple events was a Force Majeure Event, the downstream irregularity is deemed uncontrollable too — which lets a morning weather event justify an evening cancellation."
        },
        {
          "topic": "Meals, hotel and ground transportation",
          "ruleNumber": "Section 38.a.12 (amenities) and Sect",
          "ruleNote": "Section 38.a.12 (amenities) and Section 30 (ground transport)",
          "plainEnglish": "Only one amenity obligation exists, and it is weak: if a Controllable Irregularity causes a Departure Delay of six or more hours, JetBlue MAY, on your request, provide meal vouchers and/or a hotel voucher. Ground transportation is disclaimed in its entirety — Section 30 reads in full: \"Ground transportation is exclusively the responsibility of Passenger.\" There is no meal-at-three-hours provision and no hotel entitlement.",
          "exactQuote": "the Passenger experiences a Departure Delay of six (6) of more hours, Carrier may, upon request from the Passenger, provide the following amenities: meal vouchers and/or a hotel voucher.",
          "howToUse": "You must ASK — the rule is expressly conditioned on \"upon request from the Passenger,\" so a passenger who waits to be offered gets nothing. At six hours say: \"Under Section 38.a.12 this is a Controllable Irregularity with a Departure Delay of six or more hours; I am requesting meal and hotel vouchers.\" Departure Delay is defined in Section 1 as a delay prior to pushback from the gate, so the clock runs against your scheduled departure time, not your arrival.",
          "catch": "\"May … provide\" plus \"and/or\" makes this discretionary in both whether and what, which is close to unenforceable as written — so ask politely rather than demanding, and escalate on goodwill rather than on the text. Section 30 means you will never be reimbursed for a taxi or Uber to the hotel. Note the drafting error in the operative sentence (\"six (6) of more hours\") — quote it as written so your citation matches the document. The Section 38.a preamble also warns that the HYPERLINKED policy documents are directional and do not form contract terms; the numbered items themselves, including 38.a.12, are in the contract text."
        }
      ]
    },
    {
      "airline": "Frontier Airlines",
      "iata": "F9",
      "cocUrl": "https://f9prodcdn.azureedge.net/media/11004/coc_r1_english.pdf",
      "lastUpdated": "R1 (05/05/26). Most section footers still carry R0 (01/16/26); Section 12 (Checked Baggage) footer carries R1, which is where the revision landed.",
      "confidence": "high",
      "scheduleChangeThreshold": "Section 17.C and 17.E use the term 'significantly delayed or changed' and Section 2 (Definitions, subsections A–L) does NOT define it — I read every definition. Section 21.A ('In all cases, this Contract of Carriage will be subordinate to any applicable law') pulls in DOT's refund rule at 14 CFR Part 260 and 49 U.S.C. 42305: 3 hours domestic / 6 hours international, plus origination or destination airport change, more connection points, or downgrade. (Note: the Fifth Circuit's Feb. 2026 vacatur in Airlines for America v. DOT hit the ancillary-fee TRANSPARENCY rule, not Part 260 — the refund thresholds still stand.) Frontier's separate Customer Service Plan states the same numbers verbatim: refund eligibility for 'a significant schedule change or delay of 180 minutes or more for domestic…",
      "rebooksOnOtherAirlines": "NO, twice. Section 17.C: 'Frontier will have no obligation to provide transportation on another carrier.' Section 10.G (Misconnected Passengers): 'Frontier will not provide transportation on another airline or reimburse the cost of transportation purchased from another airline.' No Rule 240 analogue survives. Worse, 10.G's second sentence: if you misconnect because ANOTHER airline's inbound was late, your Frontier ticket 'will be canceled and no refund or accommodation on another flight will be due unless available and purchased at the applicable price by the passenger.'",
      "buriedGem": "Section 19.E — the no-show forgiveness clause. Frontier's no-show regime is uniquely punitive: under Section 19.C.2.b the 'No-Show Cancellation Service Charge' equals 'the fare plus all ancillary purchases plus all government-imposed charges, taxes and fees and certain carrier charges,' i.e. 100% of ticket value, and under Section 2.G and Section 10.F it cascades automatically to 'all subsequent flights, including return flights, on the itinerary.' But 19.E carves it out: 'If the No-Show Cancellation involves a significantly delayed or changed flight or alternative transportation which the passenger did not affirmatively accept (after the passenger's original flight was cancelled or significantly delayed or changed), then Frontier will not apply a No-Show Cancellation Service Charge and will refund the fare, including taxes and fees for ancillary services not provided.' So if Frontier moved your flight significantly, you never clicked Accept, and you simply didn't show — you are…",
      "provisions": [
        {
          "topic": "Schedule change before day of travel",
          "ruleNumber": "Section 17.E (Failure to Operate on",
          "ruleNote": "Section 17.E (Failure to Operate on Schedule or Failure to Carry)",
          "plainEnglish": "If Frontier changes its schedule before your travel day and the result is a significant delay or change, Frontier must arrange to fly you over its own route system to the destination, and must give you a full refund of the unused portion — but only if you refuse everything else it offers.",
          "exactQuote": "In the event the Frontier flight is significantly delayed or changed as a result of this schedule or itinerary change, Frontier shall (if it is the merchant of record), provide passengers a full refund for the unused portion of the ticket",
          "howToUse": "In writing, state: 'Under Section 17.E.2 of Frontier's Contract of Carriage R1 (05/05/26), I decline the significantly delayed or changed flight, I decline any alternative flight, and I decline any voucher, travel credit, or other form of compensation. I request the full refund of the unused portion to my original form of payment.' Use all three declines — the contract lists exactly those three acceptances as the things that extinguish the refund duty. Never click Accept on the schedule-change email first.",
          "catch": "(1) 'significantly' is undefined in the contract — Section 2 has no definition — so bring the Customer Service Plan's 180/360-minute figure. (2) The refund duty dies the moment you accept the changed flight, an alternative flight, OR a voucher/travel credit, and Frontier's self-service flow pushes you into exactly that. (3) It is conditioned on Frontier being 'merchant of record,' so OTA bookings get deflected to the agency."
        },
        {
          "topic": "Cancellation, significant delay, misconnection, or lesser-capacity aircraft",
          "ruleNumber": "Section 17.C",
          "ruleNote": null,
          "plainEnglish": "Four triggers: (i) your flight is cancelled or significantly delayed or changed; (ii) you're denied boarding because a lesser-capacity aircraft was substituted; (iii) you miss a connecting Frontier flight because of a delayed or cancelled Frontier flight; (iv) a scheduled stop is omitted and you're delivered elsewhere. In all four, Frontier must carry you on its own flights at no additional charge to your original destination or an 'equivalent destination' — or refund you if you decline all alternatives.",
          "exactQuote": "Frontier will provide transportation on its own flights at no additional charge to the passenger's original destination or equivalent destination as listed in the Same-Day Flight Changes section of https://www.flyfrontier.com/travel/travel-info/travel-policies. Frontier will…",
          "howToUse": "Ask for 'reaccommodation under Section 17.C, including to an equivalent destination.' The equivalent-destination list is the Same-Day Flight Changes list on flyfrontier.com/travel/travel-info/travel-policies — pull it up on your phone and name a co-listed airport rather than accepting a next-day flight. If nothing works, state that you decline alternative transportation, the delayed or changed flight, and any voucher or travel credit, and demand the refund 'for the unused portion of the passenger's ticket including taxes and fees for ancillary services not provided.'",
          "catch": "Trigger (iii) is expressly limited to Frontier flights — the contract says '(but not flights of other carriers)' — and Section 10.G then cancels your ticket outright with no refund if another airline's late inbound caused the misconnect. Frontier 'may also offer a voucher, travel credit, or other form of compensation as an alternative to a refund.' Closing sentence: 'the foregoing shall be the limit of Frontier's liability for the matters covered by this provision.'"
        },
        {
          "topic": "Rebooking on another airline (Rule 240 equivalent)",
          "ruleNumber": "Sections 17",
          "ruleNote": "Sections 17.C and 10.G; no interline provision exists anywhere in the document",
          "plainEnglish": "There is none. Frontier has affirmatively contracted OUT of interline rebooking in two separate places. If Frontier can't carry you, its entire obligation is its own next available seat or your money back.",
          "exactQuote": "Frontier will not provide transportation on another airline or reimburse the cost of transportation purchased from another airline.",
          "howToUse": "Do not demand endorsement to another carrier — the contract forecloses it and you lose credibility. Pivot immediately to the refund under 17.C (or 17.E.2 for pre-travel-day changes) and itemize it under 19.A.4. Frontier is not interline for baggage either, so plan to reclaim bags yourself.",
          "catch": "Section 21.L: except for baggage policies, 'the policies, rules, and procedures of the operating airline will apply on any codeshare flight' — so on a codeshare, a partner's contract may control. Section 21.D blocks reliance on a gate agent: 'No employee or agent of Frontier has the authority to waive, modify, or alter any provisions of the Contract of Carriage unless authorized by a corporate officer,' and 'Accommodations provided beyond what is required by the Contract of Carriage do not alter the Contract of Carriage.'"
        },
        {
          "topic": "Involuntary refund — what must be included",
          "ruleNumber": "Section 19.A.4.a (no use); 19.A.4.b.",
          "ruleNote": "Section 19.A.4.a (no use); 19.A.4.b.i and 19.A.4.b.ii (partial use); 19.A.2 (taxes refunded first)",
          "plainEnglish": "If you're entitled to a refund and haven't flown any of it, the refund equals the fare PLUS every ancillary you bought (checked or carry-on bag, seat assignments), PLUS all government-imposed charges, taxes and fees, PLUS carrier charges. Government taxes and fees are refunded first (19.A.2). Partial-use refunds are prorated from the point of termination.",
          "exactQuote": "No Use – If no portion of the ticket has been used, the refund amount will be equal to the fare, plus any ancillary purchases (checked or carry-on bag, seat assignments, etc.), all government-imposed charges, taxes, and fees, and carrier charges paid for the ticket issued to the…",
          "howToUse": "Itemize. Frontier's refunds routinely come back as base fare only. Write: 'Per Section 19.A.4.a I am owed the fare, plus ancillary purchases (seat assignment $X, carry-on $Y, checked bag $Z), plus all government-imposed charges, taxes, and fees, plus carrier charges.' List every line from your receipt. For partial trips cite 19.A.4.b.i (one-way, terminated at an intermediate or stopover point) or 19.A.4.b.ii (round-trip).",
          "catch": "All of 19.A.4 is prefaced 'Subject to applicable law.' Section 19.A.3: 'cancellation fees or service charges will be assessed in a separate transaction and netted against the refunded amount' — watch for a refund that nets to near zero. Separately, Section 9.B gives the 24-hour cash refund but excludes 'tickets purchased for travel within 7 days (168 hours) of purchase'; Section 19.B.2 confirms those are refunded as TRAVEL CREDIT, not cash."
        },
        {
          "topic": "Denied boarding — compensation amounts",
          "ruleNumber": "Section 18.C (table) and Notes 1–2",
          "ruleNote": null,
          "plainEnglish": "Overbooking only. New arrival within:59 — no compensation. Domestic 1:00–1:59 late (international 1:00–3:59): 200% of the one-way fare, capped at $1,550. Domestic 2 hours or more (international 4 hours or more): 400%, capped at $2,150. Note Frontier's 200% cap of $1,550 is actually ABOVE the federal $1,075 figure — that is what its contract says.",
          "exactQuote": "400% (4x) of the one-way fare, not to exceed $2150",
          "howToUse": "Compute it before you speak: one-way fare for the affected segment x 2 or x 4 based on your actual rebooked arrival delay. Then: 'Under Section 18.C I am entitled to $___ in involuntary denied boarding compensation, and under Section 18.E.1 I decline the Electronic Travel Voucher in favor of the applicable cash compensation.'",
          "catch": "Note 1: 'Frontier is not obligated to provide compensation for denied boarding when an aircraft of lesser capacity is substituted due to operational or safety reasons' — the most common real bump. Note 2: nothing is due if boarding is denied for any reason other than overbooking. Section 18.F.2: 'Acceptance of any Denied Boarding Compensation constitutes full compensation for damages.'"
        },
        {
          "topic": "Denied boarding — right to cash instead of a voucher",
          "ruleNumber": "Section 18.E.1",
          "ruleNote": null,
          "plainEnglish": "Frontier may offer an Electronic Travel Voucher in lieu of cash for an involuntary bump, but you have an express contractual right to refuse it and take the cash.",
          "exactQuote": "Passengers may decline such offer in favor of the applicable cash compensation.",
          "howToUse": "Say it at the gate: 'I decline the Electronic Travel Voucher under Section 18.E.1 and elect the applicable cash compensation under Section 18.C.' Under 18.F.1 the offer is made 'on the day and at the place where the failure to provide confirmed space occurred,' and if your replacement flight departs first, 'payment will be made by mail or other means within 24 hours.' Get the agent's name.",
          "catch": "The voucher is worse than it looks, per 18.E.1 itself: 'has no refund value, will expire 365 days from date of issuance, is not transferable, cannot be applied to group travel (more than nine passengers on a booking),' and 'Changes to a ticket purchased with an Electronic Travel Voucher may result in a change fee and any additional fare difference.'"
        },
        {
          "topic": "Denied boarding — free 72-hour date change",
          "ruleNumber": "Section 18.D.2",
          "ruleNote": null,
          "plainEnglish": "If you're bumped, voluntarily or involuntarily, and want to change your travel DATE rather than take the next flight, Frontier must reticket you free for travel within 72 hours if space is available.",
          "exactQuote": "If a passenger who has been denied boarding, voluntarily or involuntarily, pursuant to this section, wishes to modify the travel date, if space is available, a ticket will be provided for travel within 72 hours at no additional charge.",
          "howToUse": "Useful when same-day rebooking is worthless to you. 'Under Section 18.D.2 I'd like to move to [flight] departing within 72 hours at no additional charge.' Separate from and additive to the 18.C cash compensation — taking a later date does not waive it.",
          "catch": "'If space is available.' Nothing in 18.D obliges Frontier to open inventory, and on thin routes there may be no seat inside 72 hours."
        },
        {
          "topic": "Baggage — liability limit and exclusions",
          "ruleNumber": "Section 16.A.1 (",
          "ruleNote": "Section 16.A.1 ($4,700 domestic); 16.A.1.i (excluded contents); 16.A.1.ii–vii (excluded damage types); 16.A.2 (1,519 SDR Montreal); 16.A.3 (Warsaw). Note Section 16 is titled 'Claim Limits and Procedures' but subsection 16.A is headed 'Limitations of Liability'; the short Section 15 is a separate general liability section and is NOT the baggage rule.",
          "plainEnglish": "Domestic liability caps at $4,700 for all bags checked under a single passenger's name. The excluded-contents list runs roughly 50 categories including computer equipment, photographic/video/electronic equipment, cell phones, jewelry, money, medication, eyeglasses, sunglasses, optics, keys, books, food/perishables, hand and power tools, art, business documents, and 'fragile articles.' Separately excluded is DAMAGE to prosthetic devices, medical equipment, musical instruments, recreational or sporting equipment, and baby items including car seats and strollers when not packed in a hard-sided case; plus handle/strap/wheel/zipper wear, ordinary wear and tear, over-packing or misuse, and liquid…",
          "exactQuote": "Frontier's limit of liability, if any, for the loss, damage, or delay in the carriage of checked baggage shall be limited to $4,700 (or such greater amount as may be set forth in 14 CFR Part 254 at the time of the occurrence)",
          "howToUse": "Assume nothing valuable in a checked bag is covered — carry it on. If you must claim, frame the loss as a category NOT on the 16.A.1.i list (clothing, the luggage itself, ordinary household goods). For damage claims, photograph the packing before you leave the airport to defeat the 16.A.1.iii hard-sided-case exclusion and the 16.A.1.vi over-packing exclusion.",
          "catch": "16.A.4: 'Frontier does not accept declarations of higher value or accept fees based on such declarations' — you cannot buy above the cap at any price. 16.A.5 pays 'the lesser of the documented original purchase price less applicable depreciation or the cost to make repairs,' not replacement cost. 16.A.10: 'Frontier's employees and agents are not liable to passengers.'"
        },
        {
          "topic": "Baggage — claim deadline (4 hours)",
          "ruleNumber": "Section 16.B.1 (domestic); 16.B.2 (M",
          "ruleNote": "Section 16.B.1 (domestic); 16.B.2 (Montreal Convention)",
          "plainEnglish": "On domestic flights you have only FOUR HOURS from flight arrival to report damage, delay, or loss. Pilferage claims get 24 hours. Supporting documentation is due within 30 days of receiving the claim form packet, and Frontier is not liable if it's late.",
          "exactQuote": "any claim based on damage, delay, or loss of baggage must be reported to Frontier within 4 hours of the arrival of the flight on which the loss or damage is claimed to have occurred",
          "howToUse": "Do not leave the airport without a written mishandled-baggage report and a file reference number. If you discover damage after leaving, report it immediately anyway; where honestly applicable, characterize it as pilferage, which carries the 24-hour window. Calendar the 30-day documentation deadline the day the packet arrives.",
          "catch": "Four hours is far shorter than the Montreal Convention's 7 days for damage / 21 days for delay or loss, which under 16.B.2 apply only to covered international itineraries. Frontier can deny purely on timing without reaching the merits."
        },
        {
          "topic": "Baggage — assistive devices and delayed-bag expenses",
          "ruleNumber": "Sections 16",
          "ruleNote": "Sections 16.A.6 (assistive devices) and 16.A.7 (incidental expenses); 16.A.8 and 16.B.3–16.B.4 (bag fee refunds)",
          "plainEnglish": "Wheelchairs, mobility aids and assistive devices are reimbursed up to the ORIGINAL PURCHASE PRICE with no $4,700 cap and no depreciation. Separately, incidental expenses from delayed bag delivery are reimbursed per DOT guidelines. Bag-fee refunds for lost or significantly delayed bags are capped at the fee actually paid (16.A.8).",
          "exactQuote": "Frontier's liability for wheelchairs, mobility aids, and assistive devices used by a passenger with a disability if lost or damaged by Frontier shall be up to the original purchase price of the device without regard to the above limitations of liability.",
          "howToUse": "Submit the original purchase invoice and demand that figure, quoting 'without regard to the above limitations of liability' — that phrase defeats both the $4,700 cap and the 16.A.5 depreciation rule. For a delayed bag, keep toiletry/clothing receipts and claim under 16.A.7, and separately demand the bag fee back.",
          "catch": "16.A.7: 'Any amounts paid to the passenger for incidental expenses will be deducted from the total loss amount prior to check issuance.' And 16.A.1.iii still excludes damage to 'Medical equipment' not packed in a hard-sided case — expect Frontier to route an assistive-device claim through that exclusion instead of 16.A.6. Under 16.B.3 the bag-fee refund is forfeited if you never filed a mishandled baggage report."
        },
        {
          "topic": "Force majeure and 'schedules are not part of the contract'",
          "ruleNumber": "Section 17.B (force majeure); 17.A (",
          "ruleNote": "Section 17.B (force majeure); 17.A (schedules not guaranteed); 17.F (tarmac delays, via separate plan)",
          "plainEnglish": "In a force majeure event Frontier owes you nothing except a refund of the unused ticket. Section 17.A separately disclaims schedules entirely: published schedules, flight times, aircraft types and seat assignments 'are not guaranteed and form no part of this Contract of Carriage.' What survives force majeure is exactly one thing — the refund.",
          "exactQuote": "In the occurrence of a force majeure event (i.e., an act, event, or circumstance that is beyond Frontier's control), Frontier may cancel, divert, or delay any flight without liability except to provide a refund for the unused portion of the ticket.",
          "howToUse": "Don't argue the cause. Concede it and pin them to the surviving duty: 'I accept this was a force majeure event. Section 17.B expressly preserves a refund for the unused portion of the ticket, and I am requesting it to the original form of payment.' Weather is not a defense to that refund.",
          "catch": "'Force majeure' is defined circularly and with no enumerated list — literally anything 'beyond Frontier's control' — so Frontier decides. And 17.A means the timetable is contractually not part of the contract, so there is nothing to sue on for a schedule alone. Tarmac delays are punted entirely to a separate plan that is 'subject to change without notice.'"
        },
        {
          "topic": "Diversions to a nearby city",
          "ruleNumber": "Section 17.D, with 12 enumerated cit",
          "ruleNote": "Section 17.D, with 12 enumerated city groups)",
          "plainEnglish": "On a diversion you get the full 17.C remedy UNLESS your original destination city and either the diversion city or the city where the flight ultimately terminates are both within one of 12 listed groups — e.g. EWR/LGA/JFK/HPN/ISP/TTN/PHL; BUR/LAX/ONT/SNA/LGB; OAK/SFO/SJC; MCO/TPA/DAB/MLB/SRQ; ORD/MDW/MKE; COS/DEN; DFW/DAL; IAH/EFD/HOU; FLL/MIA/PBI; TPA/SRQ/RSW; BWI/IAD/DCA/PHL; SJU/BQN/PSE. Inside a group, Frontier has 'met its obligation' and owes no refund.",
          "exactQuote": "Frontier has met its obligation for transport to the final destination and will issue no refund, but may, at its discretion, provide alternate transportation (which could include ground transportation) to transport passengers to the original destination city at no additional…",
          "howToUse": "Read the 12 groups before arguing. If your diversion airport is NOT in a common group with your destination, 17.D does not apply and the full 17.C rights survive: 'Section 17.D does not apply here — [diversion city] and [destination] are not within any common city group, so Section 17.C governs.' That is a checkable, winning argument.",
          "catch": "Inside a group you get nothing as of right; ground transport is expressly 'at its discretion.' The groups are drawn generously for Frontier — Colorado Springs/Denver, Milwaukee/Chicago, and Ft. Myers/Tampa are all treated as one city."
        },
        {
          "topic": "Meals, hotel, ground transportation",
          "ruleNumber": "Section 11.B.",
          "ruleNote": "No affirmative obligation anywhere in the CoC, meal, and lodging appear nowhere; 'ground transportation' appears once, in 17.D, and is discretionary). See also Section 11.B.",
          "plainEnglish": "The Contract of Carriage contains ZERO commitment to meals, hotels, or ground transport for a delay or cancellation of any length. Section 11.B affirmatively puts inter-airport transfers on you. The one place amenities exist is Frontier's SEPARATE Customer Service Plan, which does commit to meal vouchers for controllable delays of 3 hours or more — but that is not this contract, and it makes no hotel commitment either.",
          "exactQuote": "When a passenger requires connecting service with arrival at one airport and departure from another airport, transportation between those airports must be arranged by and at the expense of the passenger.",
          "howToUse": "Don't build a contract argument on hotels or meals — there is nothing to cite. Instead cite the Customer Service Plan by name for the meal voucher ('Frontier will provide meal vouchers for flight delays of 3 hours or more or for cancellations that result in a Frontier rebooking that departs 3 hours or greater after the originally scheduled departure time'), and route any denial to a DOT consumer complaint rather than a contract claim.",
          "catch": "Section 21.D forecloses reliance on goodwill: any hotel or meal voucher a supervisor hands out is an 'accommodation provided beyond what is required by the Contract of Carriage' that 'do[es] not alter the Contract of Carriage' — past generosity creates no precedent. There is no hotel commitment in the Customer Service Plan either."
        },
        {
          "topic": "Deadline to sue, forum, jury and class waivers",
          "ruleNumber": "Sections 21",
          "ruleNote": "Sections 21.J (6-month limitation), 21.K (Colorado law, jury waiver), 21.I (no class actions), 21.C (amendment without notice)",
          "plainEnglish": "You have only SIX MONTHS from the date of the alleged incident to file suit. Colorado law governs, jury trial is irrevocably waived, and class or representative proceedings are barred. Frontier may also amend the contract without notice, though 21.C says no change applies to carriage that has already commenced.",
          "exactQuote": "No legal action may be brought by a passenger against Frontier unless commenced within 6 months from the date of the alleged incident.",
          "howToUse": "Calendar the 6-month date the day the incident happens. Do not let a long customer-relations back-and-forth run out the clock — that is how most Frontier claims die. File in small claims well before month six; the claim is breach of the Contract of Carriage itself, which survives ADA preemption under American Airlines v. Wolens. Save a dated PDF of the CoC version in force on your travel date, because 21.C permits amendment without notice.",
          "catch": "Enforceability of a 6-month contractual shortening varies by jurisdiction — assume it is enforceable. There is NO arbitration clause, so small claims court remains open, but 21.I means you cannot aggregate with other passengers."
        }
      ]
    },
    {
      "airline": "Allegiant Air",
      "iata": "G4",
      "cocUrl": "https://www.allegiantair.com/contract-carriage",
      "lastUpdated": "Effective July 21, 2026 (as displayed on the page)",
      "confidence": "medium",
      "scheduleChangeThreshold": "3 HOURS DOMESTIC / 6 HOURS INTERNATIONAL — and unlike Frontier this number is written into the contract itself, at Article 85.E (subsection letter now CONFIRMED, not a guess). Verbatim triggers: departure from the origination airport 3+ hours (domestic) / 6+ hours (international) EARLIER than originally scheduled; arrival at the destination airport 3+ / 6+ hours LATER; departure from a different origination airport or arrival at a different destination airport; an itinerary 'with more connection points than that of the original itinerary'; downgrade to a lower class of service; and for a passenger with a disability, travel through different connecting airports or on substitute aircraft lacking needed accessibility features. The airport-change, added-connection and downgrade triggers have…",
      "rebooksOnOtherAirlines": "NO — CONFIRMED. Article 85.D confines the remedy to 'transport on another of Allegiant's flights on which space is available at no additional charge,' and Article 90.B likewise to 'another of Carrier's flights.' Allegiant maintains no interline or codeshare agreements and the contract contains no interline provision at all; it warns it cannot guarantee that passengers will make connections to its own flights or those of other airlines. There is no ticket to endorse. Practically, on a route Allegiant flies twice a week 'our next available flight' can be days out, and your real remedy is the refund — take it and self-rebook.",
      "buriedGem": "Article 105.B — the volunteer-disclosure precondition, plus the cash-or-check default in Article 105.E.1.b. Verbatim: 'Carrier will not deny boarding to any passenger involuntarily who was earlier asked to volunteer without having been informed about the possibility of being denied boarding involuntarily and the amount of compensation specified in Article 105.E. below.' Two consequences almost nobody uses. First, when a gate agent solicits volunteers with a vague credit offer, never states the involuntary-DBC dollar figure, and then bumps someone from that solicited group, that is a standalone breach of Allegiant's own contract, independent of the compensation. Second, the payment DEFAULT is cash or check — 'the airline must give each passenger who qualifies for involuntary denied boarding compensation a payment by cash or check for the amount specified above, on the day and at the place the involuntary denied boarding occurs' — not an Allegiant credit voucher. Say 'cash or check…",
      "provisions": [
        {
          "topic": "Schedule change threshold",
          "ruleNumber": "Article 85.E (Failure to Operate as",
          "ruleNote": "Article 85.E (Failure to Operate as Scheduled) — subsection letter CONFIRMED",
          "plainEnglish": "Allegiant defines 'significant delay or change' inside its own contract: arrival or departure shifted 3+ hours domestic / 6+ hours international, a different origination or destination airport, more connection points than originally ticketed, a downgrade in class of service, or (for a passenger with a disability) different connecting airports or a substitute aircraft missing needed accessibility features.",
          "exactQuote": "The passenger is scheduled to arrive at the destination airport three hours or more for domestic itineraries or six hours or more for international itineraries later than the original scheduled arrival time",
          "howToUse": "Because the threshold is IN the contract, this is directly enforceable as breach of contract under American Airlines v. Wolens — you don't need to argue DOT regulations. Write: 'This is a significant change under Article 85.E of Allegiant's Contract of Carriage effective July 21, 2026, because [state the specific trigger]. Under Article 85.D and Article 90.B I elect a refund of the unused portion to my original form of payment.' Check the non-time triggers first — an airport swap or an added connection qualifies with zero delay.",
          "catch": "85.E only defines the trigger; 85.D supplies the remedy. Note the drafting seam: 85.D's third limb ties the refund specifically to 'a schedule change made voluntarily by Carrier' that is significant under 85.E — so for a weather cancellation, argue under 85.D's first two limbs and Article 90.B rather than the 85.E route."
        },
        {
          "topic": "Remedy for cancellation or significant delay",
          "ruleNumber": "Article 85.D, read with Article 90.B",
          "ruleNote": "Article 85.D, read with Article 90.B — both CONFIRMED",
          "plainEnglish": "When Allegiant cancels, significantly delays, or fails to operate, it must offer a seat on another Allegiant flight at no extra charge, or a refund of the unused portion per Article 90, or — for a voluntary Allegiant schedule change that is significant under 85.E — a refund. Article 90.B is the stronger of the two: for a cancellation or a trip terminated short of your final destination, the choice among rebooking, refund of fare plus taxes and ancillary fees, or a credit voucher is expressly 'at the passenger's option.'",
          "exactQuote": "Carrier will offer to each passenger confirmed on an affected flight: transport on another of Allegiant's flights on which space is available at no additional charge; or a refund of the unused portion of the passenger's fare in accordance with Article 90 below",
          "howToUse": "Lead with 90.B, not 85.D, because 90.B contains the words 'at the passenger's option': 'Under Article 90.B the election is at the passenger's option. I elect a refund of the fare for the unused transportation including any taxes and ancillary fees — not a credit voucher.' The refund duty is not conditioned on fault, so weather does not defeat it.",
          "catch": "'On which space is available' does real work on twice-weekly leisure routes, where the next Allegiant seat can be several days out and there is no duty to buy you onto a competitor. Article 85 also disclaims consequential damages, so lost hotel nights, missed cruises, lost wages and prepaid excursions are not recoverable."
        },
        {
          "topic": "Rebooking on another airline",
          "ruleNumber": "Article 85.D and Article 90.B",
          "ruleNote": "Article 85.D and Article 90.B — no interline provision exists anywhere in the contract (CONFIRMED)",
          "plainEnglish": "There is no Rule 240 equivalent. Allegiant has no interline agreements; both reaccommodation clauses are confined to Allegiant's own flights, and the contract disclaims any guarantee of connections to other airlines' flights.",
          "exactQuote": "transport on another of Allegiant's flights on which space is available at no additional charge",
          "howToUse": "Don't ask for an endorsement — there is no mechanism and no contractual hook. Take the refund the same day under Article 90.B and buy your own replacement. Because Allegiant sells point-to-point with no interline baggage, nothing is stranded on the far side.",
          "catch": "With no interline, a self-connection you built across Allegiant and another airline is entirely at your own risk — a delay on leg one gives you no claim on leg two, against either carrier."
        },
        {
          "topic": "Involuntary and automatic refunds",
          "ruleNumber": "Article 90.A (nonrefundable baseline",
          "ruleNote": "Article 90.A (nonrefundable baseline); 90.B (cancellation/termination); 90.C (denied boarding); 90.D (how refunds are made); 90.G (processing times); 90.H (automatic refunds) — subsection letters now CONFIRMED (the contract uses letters, not numbers)",
          "plainEnglish": "Article 90.A starts from 'Nonrefundable fares are not eligible for refunds, except as provided in Articles 85.A above and 90.B. through 90.D. below' — so you must place yourself inside an exception. 90.B covers cancellation or a trip terminated before your final destination and refunds fare plus taxes and ancillary fees at the passenger's option. 90.H makes refunds automatic in defined circumstances. 90.G sets the clock: 7 business days for credit or debit card, 20 calendar days for cash or check.",
          "exactQuote": "A fare refund shall be provided automatically by the Carrier",
          "howToUse": "If the money hasn't landed, cite 90.H and 90.G together: 'Article 90.H requires an automatic refund and Article 90.G requires card refunds no later than seven (7) business days from the date the refund request is received. It has been X days.' Then itemize ancillaries line by line — bags, seat selection, priority boarding, trip flex — since Allegiant's ancillary load is a large share of the ticket and is routinely omitted from refunds.",
          "catch": "90.A's nonrefundable default means the burden is on you to name the exception. And 90.B lists a credit voucher as one of the three options — say explicitly that you elect the refund, not the voucher."
        },
        {
          "topic": "24-hour cancellation refund",
          "ruleNumber": "Article 90.D.3",
          "ruleNote": "Article 90.D.3 — CONFIRMED (this sits inside 90.D, not standing alone as 90.D)",
          "plainEnglish": "Cancel an entire itinerary within 24 hours of booking and get a full refund — but only if the initial flight's scheduled departure was at least one week (168 hours) away at the time you booked.",
          "exactQuote": "if a customer cancels an entire air transportation itinerary within 24 hours after booking the itinerary and the scheduled time of departure of the initial flight in the itinerary was at least one week (168 hours) away at time of booking, a full refund will be issued",
          "howToUse": "Cancel the WHOLE itinerary, not a segment — the clause says 'an entire air transportation itinerary,' and partial cancellations fall outside it. Do it in writing with a timestamp, and note the 90.G processing clock starts from the request.",
          "catch": "The 168-hour lookback excludes most last-minute leisure bookings, which is a large share of Allegiant's business. Unlike Frontier's near-departure carve-out, Allegiant's version pays a full refund rather than credit — but only inside the window."
        },
        {
          "topic": "Denied boarding — procedure, disclosure precondition, and compensation",
          "ruleNumber": "Named section",
          "ruleNote": "",
          "plainEnglish": "Allegiant must request volunteers before bumping anyone, and may not involuntarily bump someone it earlier asked to volunteer unless it first told that person that involuntary denial was possible and what the compensation would be. Under 105.D there is no compensation if your substitute transportation is planned to arrive within one hour of your original arrival time. Amounts under 105.E: 200% of the one-way fare capped at $1,075 for 1–2 hours; 400% capped at $2,150 beyond 2 hours. Payment is by cash or check on the day and at the place of the bumping, or sent within 24 hours if your substitute flight departs first.",
          "exactQuote": "Carrier will not deny boarding to any passenger involuntarily who was earlier asked to volunteer without having been informed about the possibility of being denied boarding involuntarily and the amount of compensation specified in Article 105.E. below.",
          "howToUse": "Three sentences at the gate: (1) 'Was I asked to volunteer? If so, was I told the involuntary denied boarding compensation amount? Article 105.B bars involuntarily denying boarding to a solicited passenger who wasn't told.' (2) 'My delay is X hours, so compensation under Article 105.E is 400% of my one-way fare, capped at $2,150.' (3) 'Article 105.E.1.b requires payment by cash or check today at this gate.' Write down the agent's name and the time — the disclosure failure is a clean, provable contract breach.",
          "catch": "Compensation is tied to your one-way FARE, and Allegiant's base fares are deliberately tiny with the value loaded into ancillaries — 400% of a $39 fare is $156, nowhere near the cap. The 105.D one-hour exception knocks out most bumps outright. Accepting the payment generally settles the claim."
        },
        {
          "topic": "Baggage — liability limits and exclusions",
          "ruleNumber": "Article 75 (Baggage",
          "ruleNote": "Article 75 (Baggage – Limitation of Liability); Article 76 (Fragile and Perishable Items as Baggage); Article 77 (Assistive Devices) — article numbers CONFIRMED; internal subsection labels within Article 75 could not be pinned down, so cite the article and quote the language",
          "plainEnglish": "$4,700 domestic or 1,519 Special Drawing Rights international, per fare-paying passenger, and only for the PROVEN amount of damage or loss. The excluded list is long: money, jewelry, cameras, photographic/video/electronic equipment including computers, sound reproduction equipment, electronic cigarettes and vaping devices, lithium batteries, silverware, natural fur products, precious gems, stones and metals, medication, orthotics and optics (except assistive devices of passengers with disabilities), negotiable papers, securities, business and personal documents, business equipment and samples, blueprints, photographs, artistic items, paintings and works of art, antiques, collectors' items,…",
          "exactQuote": "is limited to the proven amount of damage or loss, but in no event shall be greater than four thousand, seven hundred dollars ($4,700) Domestic or 1,519 Special Drawing Rights International per fare-paying passenger",
          "howToUse": "Carry every excluded category on. The cap is on PROVEN damage, so a claim without receipts, photos and serial numbers is worth nothing regardless of the limit. For a mobility device, invoke Article 77 (Assistive Devices) rather than Article 75 — assistive devices are handled separately, including repair and loaner provisions.",
          "catch": "Note the exclusion list expressly carves out 'assistive devices of passengers with disabilities' from the orthotics/optics exclusion — quote that carve-out if a claim is pushed into the exclusion list. Article 76 lets Allegiant accept fragile, perishable, previously damaged or improperly packed items only conditionally, on terms that can release it from liability."
        },
        {
          "topic": "Baggage — claim deadlines",
          "ruleNumber": "Article 80 (Claims)",
          "ruleNote": "Article 80 (Claims) — 24-hour mishandled baggage report, 21-day written amendment, 1-year suit limitation from written denial — CONFIRMED at the article level",
          "plainEnglish": "A mishandled baggage report must be presented within 24 hours of arrival; a written amendment to the claim within 21 days of the occurrence; and any lawsuit must be commenced within one year of Allegiant's written denial of the claim.",
          "exactQuote": "No claim will be entertained by Carrier unless a mishandled baggage report is presented within 24 hours",
          "howToUse": "File at the baggage service office before leaving the airport and keep the reference number; if you can't, file within 24 hours through any documented channel. Follow with a written itemized claim inside 21 days even if the airline is still 'searching' — the 21-day clock runs from the occurrence, not from the search ending.",
          "catch": "24 hours is short, though six times more generous than Frontier's 4 hours. Exploit the asymmetry in the other direction: Allegiant gives you ONE YEAR to sue from written denial, whereas Frontier's Section 21.J is 6 months from the incident — Allegiant's litigation clock is far friendlier, so don't panic-settle."
        },
        {
          "topic": "Delayed or lost bag — automatic bag fee refund",
          "ruleNumber": "Article 74 (Significantly Delayed or",
          "ruleNote": "Article 74 (Significantly Delayed or Lost Bags) — CONFIRMED",
          "plainEnglish": "If your checked bag isn't delivered within 12 hours of arrival for a domestic itinerary (15 hours for international flights of 12 hours or less, 30 hours for longer international flights), Allegiant must promptly refund the checked bag fee you paid — provided you filed a mishandled baggage report.",
          "exactQuote": "Within 12 hours of the flight's arrival",
          "howToUse": "This is separate from and additional to any damages claim, and almost nobody asks. Once the 12-hour mark passes: 'Under Article 74 my checked bag was significantly delayed; please refund the checked bag fee of $__ to my original form of payment.' Refund timing follows Article 90.G — 7 business days by card.",
          "catch": "Conditioned on having filed the mishandled baggage report, which loops back to Article 80's 24-hour deadline — miss that and you lose this too. And the refund is only the FEE, not compensation for the delay."
        },
        {
          "topic": "Force majeure, consequential damages, and diversions",
          "ruleNumber": "Article 85.B (causes beyond Carrier",
          "ruleNote": "Article 85.B (causes beyond Carrier's control); the consequential-damages disclaimer and the diversion rule both sit in Article 85 (reported at 85.F and 85.G, but the two extractions disagreed on which letter is which — cite 'Article 85' and quote the language, not the letter); see also Article 25",
          "plainEnglish": "Article 85.B lists acts of God, governmental actions, fire, weather, passenger behavior, medical emergencies, Air Traffic Control, security matters, strikes or labor disputes, and inability to obtain fuel as beyond Allegiant's control. Article 85 disclaims all consequential damages and incidental costs including lost wages and emotional distress. On a diversion, carriage by air is deemed COMPLETED at the diversion airport. What survives regardless of cause is the 85.D / 90.B rebooking-or-refund election.",
          "exactQuote": "Carrier shall not be liable for any consequential damages or incidental costs incurred by passengers",
          "howToUse": "Concede the cause and pin them to what survives: 'I accept this was beyond Allegiant's control under Article 85.B. Article 85.D and Article 90.B nonetheless require Carrier to offer transport on another Allegiant flight or a refund of the unused portion, at the passenger's option. I elect the refund.' Do not claim hotel, meals, lost wages or missed events — expressly excluded, and raising them weakens you.",
          "catch": "The diversion rule is the sharpest edge in this contract: once the aircraft lands at the diversion airport, carriage by air is deemed completed. Some extractions of that clause include an 'unless Carrier arranges ground transportation to the original destination at no additional cost' qualifier — read the current text before relying on either reading, and note Article 25 separately disclaims any ground-transport responsibility."
        },
        {
          "topic": "Meals, hotel, ground transportation",
          "ruleNumber": "Article 25 (Ground Transportation)",
          "ruleNote": "Article 25 (Ground Transportation) — a disclaimer, not an obligation. No hotel, meal or lodging obligation exists anywhere in the contract (CONFIRMED).",
          "plainEnglish": "None. Allegiant's contract contains no hotel, meal, or ground transport obligation, and Article 25 affirmatively disclaims responsibility for getting you or your bags between an Allegiant airport and anywhere else.",
          "exactQuote": "Carrier does not assume responsibility for the ground transportation of any passenger or his or her baggage between any airport used by Carrier and any other location.",
          "howToUse": "Don't argue amenities under this contract. If Allegiant's separate Customer Service Plan or its DOT dashboard commitment promises meal or hotel vouchers for controllable delays, cite THAT document by name and escalate to DOT — those are consumer-protection commitments, enforceable through a different channel, not terms of this contract.",
          "catch": "Article 25's disclaimer is broad enough to cover the diversion scenario, which is exactly when you need a ride. Any voucher offered is discretionary goodwill and creates no precedent."
        },
        {
          "topic": "Class action waiver and right to change the contract",
          "ruleNumber": "Article 81 (Class Action Waiver); Ar",
          "ruleNote": "Article 81 (Class Action Waiver); Article 127 (Right to Change Contract) — CONFIRMED. No arbitration clause exists.",
          "plainEnglish": "Claims must be brought individually, not as part of a class or representative proceeding. Article 127 reserves Allegiant's right to modify the contract, subject to written corporate officer approval. There is NO arbitration clause, so court remains open to you.",
          "exactQuote": "any lawsuit brought against Carrier, any of its affiliated entities, or any of its agents, directors, employees or officials related to this Contract of Carriage ... shall be brought only in an individual capacity, and shall not be brought in or asserted as part of a class…",
          "howToUse": "Small claims court is the venue this points to and it works: the claim is breach of Allegiant's own Contract of Carriage, which survives ADA preemption under American Airlines v. Wolens, and Article 80 gives you a year from written claim denial. Before filing, download and date-stamp a PDF of the CoC version in effect ON YOUR TRAVEL DATE — Article 127 lets Allegiant change the terms and you need to prove which version governed your ticket.",
          "catch": "The waiver reaches agents, directors, employees and officials, so you can't route around it by naming individuals. Individual-only claims mean no economies of scale on small-dollar disputes."
        }
      ]
    },
    {
      "airline": "Spirit Airlines (ceased all operations 2 May 2026; Chapter 11 converted to Chapter 7 liquidation)",
      "iata": "NK",
      "cocUrl": "https://content.spirit.com/Shared/en-us/Documents/Contract_of_Carriage.pdf",
      "lastUpdated": "'UPDATED AS OF APRIL 30, 2026' —. This is the final revision, issued two days before shutdown. Citing any 'Rule' number to Spirit or to a court would be wrong.",
      "provisions": [
        {
          "topic": "Schedule change — threshold for free change or refund",
          "ruleNumber": "Section 10.2.3 (refund",
          "ruleNote": "Section 10.2.3 (refund/re-accommodation/credit) and Section 8.2 (fee-free change)",
          "plainEnglish": "Spirit ran a two-tier clock under §10.2.3. If the change occurred MORE than 7 days before departure it was a 'schedule change' and the trigger was in excess of 1 hour. If it occurred WITHIN 7 days of departure it was a 'cancellation or delay' and the trigger was in excess of 2 hours. Independently of time, the same rights were triggered by a change in origination or arrival airport, connecting points added to an itinerary, or a downgrade in travel option. Any trigger gave three options at the passenger's election: refund, re-accommodation, or a credit for future travel.",
          "exactQuote": "a schedule change (change occurs more than seven (7) days from scheduled departure ) in excess of one (1) hour, a change in origination or arrival airport, connecting points added to an itinerary, or a downgrade in travel option, will have three (3) options available to them: 1)…",
          "howToUse": "For a live claim in the bankruptcy or a chargeback dispute, write: 'Spirit Contract of Carriage (rev. 30 Apr 2026) §10.2.3 entitled me to elect a refund; §10.7 required Spirit to process it to my original form of payment within seven business days after the flight was scheduled to depart. Spirit did not. This is a breach of Spirit's own contract of carriage, which under American Airlines v. Wolens is not preempted by the Airline Deregulation Act.' Attach the itinerary and the cancellation notice.",
          "catch": "The 1-hour tier applied only more than 7 days out; inside 7 days you needed a full 2 hours. §10.1 is blunt about the baseline: 'No refunds will be made for non-refundable reservations.' And §12.4: 'No employee of Spirit has the authority to modify, waive or alter any term of this Contract of Carriage unless authorized by an officer of Spirit Airlines' — so anything an agent promised verbally is unenforceable. Note also that §8.2's fee-free-change language states its own thresholds (schedule change 'greater than one hour', delayed flight 'greater than two hours') WITHOUT the 7-day split; the two-tier structure lives in §10.2.3."
        },
        {
          "topic": "Rebooking on another airline",
          "ruleNumber": "Section 8.2 (final sentence); Secti",
          "ruleNote": "Section 8.2 (final sentence); Sections 7.3.4.1 and 7.3.5.1",
          "plainEnglish": "Spirit's contract contained no interline agreement and no endorsement obligation of any kind. §8.2 committed it only to rebooking you on Spirit's own next available flight, 'either direct to the destination or via connections through other airports' — meaning other Spirit connections. It then stated in terms that it would not pay for a ticket you bought on someone else. §§7.3.4.1 and 7.3.5.1 confirm the isolation operationally: bags were never checked to another airline's destination. This is precisely why the May 2026 shutdown stranded people with nothing but a refund — there was no contractual hook to demand a seat on Delta or American.",
          "exactQuote": "With limited exceptions, Spirit will not reimburse guests for flights that they book on other carriers.",
          "howToUse": "Do not attempt this argument — there is no provision to invoke. If you were stranded, the usable claim is the §10.2.3 refund plus a credit-card chargeback, not reimbursement for the replacement ticket you had to buy.",
          "catch": "'With limited exceptions' is undefined anywhere in the document, so it gives the passenger nothing to enforce — it is a reservation of discretion for Spirit, not a promise."
        },
        {
          "topic": "Involuntary refund",
          "ruleNumber": "Section 10.2 (10.2.1",
          "ruleNote": "Section 10.2 (10.2.1–10.2.4), with the payment clock at Section 10.7",
          "plainEnglish": "Where Spirit was 'unable to provide a previously confirmed seat and is unable to reroute the guest via Spirit,' §10.2 required a refund: the full fare paid if no portion of the reservation was used (10.2.1), or the amount of the unused portion if partly used (10.2.2), always to the original form of payment (10.2.4). §10.7 ('Automatic Refunds') set the deadlines: 7 business days for credit-card purchases, 7 calendar days for cash or a U.S.-issued debit card, and 20 calendar days for any other form of payment — each running from when the flight was scheduled to depart for cancelled flights, or from when the rebooked flight departed without the guest.",
          "exactQuote": "If no portion of the reservation has been used, the refund will be equal to the fare paid by the guest.",
          "howToUse": "In a proof of claim or chargeback, cite §10.2.1 for the amount, §10.2.4 for the form of payment, and §10.7 for the deadline that was missed. The refund address in §10.5 is Corporate Guest Relations, Attention: Refunds, 1731 Radiant Drive, Dania Beach, FL 33004 — use it for written notice and copy the Chapter 7 trustee. Note that Spirit stated at shutdown it would refund tickets purchased directly from the airline, while tickets bought through an agent were the agent's responsibility — so pursue an OTA-issued ticket with the OTA first.",
          "catch": "§10.2.4 restricts refunds to the original form of payment — which is exactly why card purchases were auto-refunded after the shutdown while vouchers, travel credits and Free Spirit points were not. Those become general unsecured claims in the Chapter 7 estate, behind secured lenders and aircraft lessors."
        },
        {
          "topic": "Denied boarding — procedure and compensation",
          "ruleNumber": "Section 9 overall; 9.1 volunteers",
          "ruleNote": "Section 9 overall; 9.1 volunteers, 9.2 involuntary priority, 9.3.3 exclusions, 9.3.4 amounts, 9.3.6 method and timing of payment, 9.3.7 guest's options",
          "plainEnglish": "Volunteers first (§9.1). If short, §9.2 gave priority to remain booked, in order, to reservations including guests who: are unaccompanied minors; have a qualified disability; booked or paid to upgrade to 'Spirit First' or 'Premium Economy' seating; have Free Spirit Gold or Silver status; and checked in earliest. Amounts (§9.3.4, domestic): no compensation if rerouted to arrive within 1 hour; the lower of 200% of the travel option or $1,075 for more than 1 but less than 2 hours; the lower of 400% or $2,150 beyond 2 hours. International from the U.S. uses a 1–4 hour band for the 200% tier. §9.3.6 required payment on the day and at the place the denied boarding occurred.",
          "exactQuote": "the airline must give each guest who qualifies for involuntary denied boarding compensation a payment by cash , digital prepaid card, or check … on the day and at the place the involuntary denied boarding occurs",
          "howToUse": "Historically: 'Section 9.3.6 — payment is due today, at this airport, by cash, digital prepaid card or check. I decline the travel voucher.' §9.3.6 expressly preserved that 'The guest may insist on the Involuntary Denied Boarding Compensation or refuse all compensation,' and required disclosure of all material restrictions before you accepted free or discounted transportation instead. §9.3.7 preserved the right to decline payment and sue for damages — never take the gate settlement if your losses exceed the cap.",
          "catch": "§9.3.3 disqualified you if you had not complied with ticketing/check-in/reconfirmation requirements, if the flight was cancelled rather than oversold, if a smaller-capacity aircraft was substituted for safety or operational reasons, if you were offered accommodation in another section at no extra charge, or if Spirit got you there within one hour. §9.2's stated priority is itself hedged — 'The selection of guests for involuntary denial of boarding is solely at Spirit's discretion.' And §11 excluded non-revenue guests entirely: they 'are not entitled to service recovery compensation, denied boarding compensation, or amenities related to trip interruptions.' §9.3.7 also warned that acceptance…"
        },
        {
          "topic": "Baggage — exclusions from liability and claim deadlines",
          "ruleNumber": "Section 7.7 (general exclusions), 7",
          "ruleNote": "Section 7.7 (general exclusions), 7.7.1.1 (excluded-items list), 7.7.1.2 and 7.7.2.3 (caps), 7.7.2.4 (no declared value), 7.3.5 (4-hour report), 7.3.10 (30-day claim)",
          "plainEnglish": "Spirit had the harshest deadline of any major U.S. carrier: a mishandled baggage report had to be filed with a Spirit representative at the airport within FOUR HOURS of the arrival of the flight you travelled on (extended to 72 hours only for a wheelchair or scooter), and the full claim with all documents within 30 days of arrival. §7.7.1.1 disclaimed all liability for a sweeping list including antiques, artifacts, art supplies, blueprints and maps, books, business documents and equipment, CD/DVDs, china and ceramics, collectibles, computers and laptops, cosmetics, e-cigarettes, all electronics and accessories, all eyewear, furs, heirlooms, jewelry, keys, liquids and alcohol, machinery,…",
          "exactQuote": "The claim and all the required documents must be received within thirty (30) days of the date of arrival unless applicable law or treaty provides for a longer period of time.",
          "howToUse": "Historically the only workable move was to file the report at the baggage office before leaving the airport — via the virtual Baggage Service Office (vBSO) or in person — get the report number (File ID), then submit at www.spirit.com/bagclaim within 30 days with verifiable proof of purchase for every claimed item valued at $50.00 or more. On an international itinerary, invoke the treaty carve-out in §7.3.5: 7 days for damage and 21 days for delay under the Montreal Convention override the 4-hour domestic rule.",
          "catch": "Four hours is brutal and, unlike Alaska's Rule 15.R.b, there is NO 'good cause' saving clause anywhere in Spirit's document. §7.7.2.4 is the other sting: 'Spirit does NOT accept declarations of higher value' — you could not buy up from the $4,700 cap at any price. And §7.7.1.1's list means the cap was academic for most valuables, since liability was zero to begin with. Reimbursement was also measured by 'the original purchase price, less reasonable depreciation for prior usage' (§7.3.10), with depreciation not applied to assistive devices."
        },
        {
          "topic": "Force majeure and irregular operations — what they disclaim, what survives",
          "ruleNumber": "Section 4.4.2 (right to refuse",
          "ruleNote": "Section 4.4.2 (right to refuse/cancel), Section 8.1 (schedules), Section 8.3 (amenities), Section 12.1 (consequential damages)",
          "plainEnglish": "Spirit had NO defined 'Force Majeure Event' term — the phrase appears nowhere in the document. §4.4.2 let it refuse or remove passengers 'whenever necessary or advisable by reason of weather or other conditions beyond its control (including, without limitation, acts of God, labor disturbances, strikes, civil commotions, embargoes, wars, hostilities, or disturbances) actual, threatened, or reported.' §8.1 disclaimed schedules as forming 'no part of the terms of transportation' and disclaimed responsibility for making connections on its own or any other carrier's flights. §12.1 disclaimed direct, indirect, special and consequential damages outright. What SURVIVED is §10.2.3: the…",
          "exactQuote": "Amenities provided by Spirit are provided as a courtesy to the guest and are not to be considered an obligation of Spirit.",
          "howToUse": "The winning framing was always: 'I accept that §8.3 amenities are discretionary and weather-limited. §10.2.3 is not — it contains no exception for causes outside your control. My election is a refund to the original form of payment under §10.2.4, payable within seven business days under §10.7.'",
          "catch": "§12.1 means you recover the fare and nothing else — no self-booked hotel, no missed cruise, no lost wages, 'whether or not Spirit has knowledge that such damages might be incurred,' and 'Purchase of a reservation does not guarantee transportation.' §12.2.1 reserved the right to change the contract without notice, and §12.2.3 excluded everything linked from the document, so Spirit's website promises were not part of the contract."
        },
        {
          "topic": "Meals, hotel, and ground transportation",
          "ruleNumber": "Section 8.3",
          "ruleNote": null,
          "plainEnglish": "For a controllable cancellation or an extended controllable delay departing after the scheduled departure day, Spirit committed to overnight accommodation for non-local guests, or reimbursement of reasonable costs, plus ground transportation to and from the hotel where the hotel had no shuttle. For delays of three hours or more, or a cancellation, due to causes within its control, it committed to a meal voucher redeemable at any establishment that sells food and accepts the vouchers.",
          "exactQuote": "For delays of three hours or more or a cancellation due to causes within our control, Spirit will provide a meal voucher",
          "howToUse": "Historically: 'Section 8.3 — this is a controllable delay exceeding three hours; I am requesting the meal voucher. If this pushes overnight and I am a non-local guest, I am requesting hotel accommodation and ground transportation, or reimbursement of reasonable costs.' Keep receipts, because the clause is written in reimbursement terms.",
          "catch": "Three hard exclusions. First, §8.3's own opening undercuts everything that follows: amenities are 'not to be considered an obligation of Spirit,' a real defence to any breach claim, and Spirit 'assumes no responsibility for personal or business expenses incurred by a guest as a result of a flight delay, cancellation, or schedule change.' Second, nothing at all where 'the cancellation or misconnection is caused by severe weather, Air Traffic Control decisions or other issues or causes outside of Spirit's control.' Third — the one most people hit — 'No lodging will be provided to a guest on any Spirit flight which is delayed or canceled in the originating city on the guest's reservation.'…"
        },
        {
          "topic": "Wind-down: the limitation period, forum, and class-action bar that outlive the airline",
          "ruleNumber": "Section 13.3 (six-month limitation)",
          "ruleNote": "Section 13.3 (six-month limitation), 13.1 (Florida law, jury waiver), 13.2 (no class action), 12.4 (no employee waiver)",
          "plainEnglish": "The contract contains NO cessation-of-operations, insolvency or bankruptcy provision of any kind — 'bankrupt' and 'insolven' appear zero times in the 30 April 2026 revision issued two days before shutdown. What it does contain is the clock governing every stranded passenger's claim: §13.3 bars any legal action against Spirit or its directors, officers, employees or agents unless commenced within six months of the alleged incident. For the 2 May 2026 shutdown that is approximately 2 November 2026 — roughly three months away as of this writing. §13.1 imposes Florida law and an irrevocable jury waiver; §13.2 bars class or representative proceedings, forcing individual claims.",
          "exactQuote": "No legal action may be brought by a passenger against Spirit or its directors, officers, employees or agents unless commenced within six (6) months from the date of the alleged incident.",
          "howToUse": "Two time-critical steps. (1) Credit or debit card purchase: file a chargeback for services not rendered — under the Fair Credit Billing Act you generally have 60 days from the statement on which the charge appeared, which is faster and far more likely to pay out than the bankruptcy. (2) Vouchers, travel credits, Free Spirit points, or unpaid refunds: file a Proof of Claim in the Chapter 7 case, citing §10.2.3 and §10.7 as the contractual basis and the missed deadline as the breach. Under American Airlines v. Wolens a claim for breach of the airline's own contract of carriage is not preempted by the Airline Deregulation Act, so §10.2.3 is the operative language — but the Chapter 7 automatic…",
          "catch": "The six-month limit and the class-action bar are exactly what make individual passenger recovery impractical against a liquidating estate. As general unsecured creditors, passengers sit behind secured lenders and aircraft lessors, so a Proof of Claim is likely to return cents on the dollar or nothing. The chargeback, not the contract, is the realistic remedy — and §13.3's clock may be academic once the estate is administered. Note this provision's enforceability against a liquidating estate is a legal question beyond the contract's four corners; consult counsel or the trustee's notices for the bar date, which controls in practice."
        }
      ],
      "buriedGem": "Section 10.2.3's automatic-refund sentence, quoted here exactly as printed including the document's own typo: 'If a guest rejects or fails to respond to an offer of the changes to their flight, re-accommodation of the flig ht, or a created for future [sic] in these instances, and the original flight and re-accommodated flight depart without the guest, a refund will be automatically issued.' Silence was election. Combined with §10.7's 7-business-day credit-card deadline, this converts every unrefunded May 2026 passenger into a straightforward breach-of-contract claimant rather than someone arguing about DOT regulations — and breach of the airline's own contract is precisely what American Airlines v. Wolens leaves enforceable. Almost nobody quotes §10.2.3 in a Proof of Claim or chargeback letter, yet it is the single sentence making the refund a contractual debt Spirit owed automatically, without any request from the passenger.",
      "rebooksOnOtherAirlines": "No. Flatly no, and the contract says so in terms. Section 8.2 committed Spirit only to rebooking 'on Spirit's first flight on which seats are available to the guest's original destination without additional charge,' with staff rebooking 'on alternate Spirit flights, either direct to the destination or via connections through other airports' — meaning other Spirit connections — and then closed: 'With limited exceptions, Spirit will not reimburse guests for flights that they book on other carriers.' There is no interline provision and no endorsement clause; the word 'interline' does not appear anywhere in the 63-page document. Sections 7.3.4.1 and 7.3.5.1 confirm it operationally: 'Bags are not checked to other airline destinations or stopovers.' Spirit never had any version of Rule 240.",
      "scheduleChangeThreshold": "Two-tier, per Section 10.2.3. More than 7 days before scheduled departure it counted as a 'schedule change' and the threshold was in excess of 1 hour. Within 7 days of flight departure it counted as a 'cancellation or delay' and the threshold was in excess of 2 hours. Independently of time, the same rights were triggered by a change in origination or arrival airport, connecting points added to an itinerary, or a downgrade in travel option. Any trigger gave a choice of refund, re-accommodation, or credit for future travel — and if the guest never responded and both the original and re-accommodated flights departed without them, a refund issued automatically. Section 8.2 separately allowed a change with no fee and no fare difference on the same city pair, using thresholds stated as 'greater…",
      "confidence": "high"
    }
  ],
  "schedule": {
    "whatItIs": "A \"schedule change\" is any change the AIRLINE makes to your flight after you've paid — a shifted departure time, a swapped aircraft, a new connection, a re-timed return, a moved airport, or a cancelled-and-rebooked flight. It is not a delay on the day of travel; it happens weeks or months out, silently, by email or app notification that most people skim and ignore. It is also extremely common. Airlines load schedules up to ~330 days out but only firm them up as departure approaches, re-publishing schedules on a near-weekly cadence; frequent flyers who book far in advance report that the large majority of long-lead bookings pick up at least one schedule change before they fly. The further…",
    "dotBaseline": "Since October 2024, 14 CFR Part 260 (DOT's \"Refunds and Other Consumer Protections\" final rule) makes this a federal entitlement, not a courtesy. The operative term is \"significantly delayed or changed flight\" (14 CFR 260.2). Verbatim, it means a covered flight itinerary with a carrier-made delay or change where, as a result:\n(1) you are scheduled to depart the origination airport 3+ hours (domestic) / 6+ hours (international) EARLIER than originally scheduled;\n(2) you are scheduled to arrive at the destination 3+ hours (domestic) / 6+ hours (international) LATER than originally scheduled;\n(3) you are scheduled to depart from a different origination airport or arrive at a different…",
    "whyItWorks": "Airlines routinely grant far more than 14 CFR Part 260 requires, for three structural reasons. First, published policy already exceeds the federal floor at most carriers, because refunding you is worse for them than moving you. Alaska is the most generous in the industry: a schedule change of as little as 60 minutes lets you take a full cash refund to original form of payment OR rebook to a flight departing up to one day earlier or later — three hours better than the DOT floor. United's published policy lets you self-serve a free rebooking when your time moves by more than 30 minutes (same city pair, within 24 hours). Delta's agency-facing rebooking policy triggers at 120 minutes, not 180,…",
    "tactics": [
      {
        "name": "Do nothing — let the schedule change come to you",
        "how": "If you booked far out and think you might want to move the flight, DO NOT pay a change fee or eat a fare difference immediately. Check the reservation every 2-3 weeks in the app or on the airline site (compare the current times against your original confirmation email — this is why you keep it). Airlines republish schedules constantly; a long-lead booking is likelier than not to move at some point. The instant it does, your change becomes free or cheap.",
        "worth": "The entire fare difference plus any change fee. On a re-booked domestic ticket this is commonly $150-$400; on international premium cabins it can be four figures. Costs nothing but patience.",
        "risk": "Pure waiting game — the change may never come, or may come too late to be useful, or may be 45 minutes when you needed 3 hours. Do not rely on it for travel you must move by a hard deadline. Only works if you actually check; the notification email is easy to miss and some changes are pushed with no meaningful alert."
      },
      {
        "name": "Trade the change for a better flight the same day",
        "how": "When the change lands, first go find the flight you actually want on Google Flights or the airline's own search — ignore the price shown, you are not buying it. Then self-serve if the app offers alternatives (United and Delta both surface a 'find another flight' option after a change), and call only if the app won't show the flight you want. Ask by flight number: 'Your schedule change moved me from the 8:10am to the 11:45am. That doesn't work. Please protect me on flight 1422 at 6:30pm instead.'",
        "worth": "Free move to a materially better itinerary — a nonstop instead of a connection, a civilized departure time, a longer or shorter connection. Frequently several hundred dollars of fare difference waived.",
        "risk": "Policy, not law. Firm at United above 30 minutes and Delta above 120 minutes on the same city pair; discretionary elsewhere, especially if the flight you want is in a much higher fare bucket. Expect resistance if you're jumping to a peak-demand flight."
      },
      {
        "name": "Push the date, not just the time",
        "how": "Ask explicitly for a different DAY, and name the carrier's own window rather than asking open-endedly. Alaska: 'Please move me to one day earlier/later, per your schedule change policy.' Delta: 'Your schedule change policy allows rebooking within two days of the original date — please put me on the flight two days later.' American and JetBlue have comparable windows (JetBlue up to 5 days). Ask for the return leg to be adjusted at the same time — Delta's own agency policy directs agents to move the return to protect the original trip length.",
        "worth": "A free date change is the single highest-dollar outcome here, because date changes are what airlines normally charge the most for. Turning a Tuesday return into a Thursday return at no cost is routinely worth $300-$800.",
        "risk": "Windows are narrow (±1 to ±2 days at most carriers) and some are conditioned on timing — Delta's ±2-day agency window applies when the change occurs 7+ days before departure. Asking for a week's shift will get a flat no and can make the agent defensive about the whole request. Ask inside the window and you're asking them to do something they're already authorized to do."
      },
      {
        "name": "Change the airport",
        "how": "Ask for a co-terminal or nearby-airport substitution: EWR instead of JFK/LGA, MDW instead of ORD, OAK/SJC instead of SFO, BWI instead of DCA/IAD. The magic phrase for Delta is the 100-mile radius: 'Your reaccommodation policy permits alternates within a 100-mile radius of the original origin and destination — please rebook me out of [airport].' Other carriers have similar but less publicly documented latitude.",
        "worth": "Can be worth more than the fare itself if it saves a long ground transfer, a hotel night, or parking. Also the cleanest way to get onto a nonstop.",
        "risk": "The most discretionary item on this list and the most agent-dependent. Delta has it in writing for agents; at other carriers you are asking for a favor. Note the reverse direction is a firm right: if the AIRLINE moves you to a different airport, that is criterion (3) of the federal definition and you can refuse and demand a cash refund outright."
      },
      {
        "name": "Take cash back on a nonrefundable ticket",
        "how": "If the change hits any federal trigger — 3h domestic / 6h international, different airport, an added connection, or a downgrade — do not accept the rebooking. State the trigger and the regulation: 'This is a significant change under 14 CFR Part 260. I am declining the rebooking and requesting a refund to my original form of payment, not an eCredit.' If the flight is already auto-rebooked in your record, say explicitly that you never affirmatively accepted it. Route it through the airline's Refunds department if the phone agent balks.",
        "worth": "100% of the fare plus taxes plus ancillary fees — seats, bags, pets — on a ticket that was worth nothing in cash the day before. On a nonrefundable or Basic Economy fare this is the whole ticket price back.",
        "risk": "This is a firm legal right, not a favor — but you must decline the alternative to get it, and you must say 'original form of payment.' The most common failure mode is being handed a voucher: 14 CFR 260.7 says a voucher cannot be deemed accepted without your affirmative agreement, so refusing it is not a negotiation, it's the rule. Beware airlines computing the delay wrong (comparing the wrong legs, or only the changed segment rather than the total itinerary shift) — do the arithmetic yourself, original scheduled arrival vs new scheduled arrival."
      },
      {
        "name": "Refuse the auto-rebooking before you touch anything",
        "how": "When the email or app push arrives, do not click the confirm/accept button while you decide. Read what actually changed, compute the delta against your original confirmation, then decide between (a) a free move to something better and (b) cash back. Only then respond. If you already clicked accept, call and say you want to revert to the original entitlement — often granted, but you are now asking rather than entitled.",
        "worth": "It is the precondition for every other tactic. Free option value on the entire ticket.",
        "risk": "Minimal, but time-bounded — the refund entitlement under 260.6 runs to the scheduled departure date, and inventory on the flight you actually want evaporates. Don't sit on it for weeks."
      },
      {
        "name": "Collect on a downgrade or a lost nonstop",
        "how": "Two triggers people almost never claim. If an aircraft swap drops you from a lie-flat/first/premium cabin into a lower one, that is criterion (5) — a significant change — and you can refuse the itinerary entirely for a full refund, or press for the fare difference plus a better routing. If your nonstop becomes a connection, that is criterion (4), added connection points; American treats nonstop-to-connecting as significant on its face regardless of the time delta. Say the words: 'This adds a connection point / downgrades my class of service, which is a significant change under Part 260.'",
        "worth": "Cabin downgrades on international premium tickets are the largest single-item recovery in this whole area — often $1,000-$5,000 of value. The nonstop-to-connecting trigger is valuable because it has NO time threshold: a 20-minute change that adds a stop still qualifies.",
        "risk": "Firm on the refuse-and-refund side. The fare-difference-refund-and-still-fly outcome is negotiated, not guaranteed by Part 260, so decide in advance whether you'd rather have the money or the trip. Downgrade claims are also where airlines most often try to route you to a voucher."
      },
      {
        "name": "Pick the channel deliberately, then hang up and call again",
        "how": "App/web self-service first — it is free, instant, and never argues; United and Delta both expose alternative flights after a change, and Alaska now lets you take the cash refund online. Escalate to phone only when the flight you want isn't offered online. On the phone, open with the specific flight number you want, not an open question. If refused, thank the agent, hang up, and call back — the widely-documented pattern is that the same request gets different answers from different agents, and people are routinely told no twice and yes on the third call. For a denied refund, escalate in writing to the carrier's Passenger Refunds department with your delta arithmetic spelled out, then file a DOT Aviation Consumer Protection complaint. Treat a credit card chargeback as a genuine last resort…",
        "worth": "Converts a coin-flip into a near-certainty on anything inside policy. The DOT complaint is the real backstop on the legal-right items and carriers respond to it.",
        "risk": "Repeated calling costs time and works only where the agent has discretion — it will not manufacture a right that doesn't exist, and on a 90-minute change with no other trigger you are simply asking nicely. Be pleasant and concrete; agents extend more latitude to callers who name a specific flight and a specific policy than to callers who are angry or vague."
      },
      {
        "name": "Know when you have nothing",
        "how": "Before you call, check whether the change actually clears a line. Under 3 hours domestic / 6 hours international, same airports, same number of connections, same cabin — the federal refund right does not exist and you are relying entirely on the carrier's own lower thresholds (Alaska 60 min, United 30 min, Delta 120 min, AA's change-fee waiver under 4 hours) or on goodwill. Airlines are aware of the thresholds and changes landing at 2h55m are not accidental.",
        "worth": "Saves you from burning credibility on an unwinnable ask, and tells you which carrier's lower threshold to invoke by name.",
        "risk": "None — this is the calibration step. The honest summary: the CASH REFUND on a qualifying significant change is a firm federal right you can insist on and complain about. Everything else — a specific better flight, a different day, a different airport, keeping the ticket AND getting money back — is airline policy plus the individual agent, and should be asked for as such."
      }
    ],
    "sources": [
      {
        "label": "14 CFR 260.2 — definition of \"significantly delayed or changed flight\" (Cornell LII)",
        "url": "https://www.law.cornell.edu/cfr/text/14/260.2"
      },
      {
        "label": "14 CFR 260.6 — refunding fares for cancelled, delayed or changed flights (Cornell LII)",
        "url": "https://www.law.cornell.edu/cfr/text/14/260.6"
      },
      {
        "label": "14 CFR 260.7 — affirmative acceptance required before a voucher replaces a refund (Cornell LII)",
        "url": "https://www.law.cornell.edu/cfr/text/14/260.7"
      },
      {
        "label": "14 CFR Part 260 — full rule, Refunds for Airline Fare and Ancillary Service Fees (eCFR)",
        "url": "https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-260"
      },
      {
        "label": "DOT final rule, \"Refunds and Other Consumer Protections\" (Federal Register, 26 Apr 2024)",
        "url": "https://www.federalregister.gov/documents/2024/04/26/2024-07177/refunds-and-other-consumer-protections"
      },
      {
        "label": "DOT — Biden-Harris Administration Announces Final Rule Requiring Automatic Refunds",
        "url": "https://www.transportation.gov/briefing-room/biden-harris-administration-announces-final-rule-requiring-automatic-refunds-airline"
      },
      {
        "label": "DOT enforcement discretion on renumbered flights, extended to 7 Jul 2027 (Federal Register, 7 Jul 2026)",
        "url": "https://www.federalregister.gov/documents/2026/07/07/2026-13675/airline-refunds-and-other-consumer-protections"
      },
      {
        "label": "DOT enforcement pause, original notice (Federal Register, 5 Dec 2025)",
        "url": "https://www.federalregister.gov/documents/2025/12/05/2025-22140/airline-refunds-and-other-consumer-protections"
      },
      {
        "label": "Eckert Seamans — DOT Pauses Enforcement of Certain Refund Obligations (scope of the pause)",
        "url": "https://www.eckertseamans.com/stay-informed/blogs/aviation/dot-pauses-enforcement-of-certain-refund-obligations"
      },
      {
        "label": "DOT Aviation Consumer Protection — Refunds",
        "url": "https://www.transportation.gov/individuals/aviation-consumer-protection/refunds"
      }
    ]
  }
};
