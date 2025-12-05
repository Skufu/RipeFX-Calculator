Mission Brief
Your mission, should you choose to accept it, is to build an elegant, embeddable FX & fee transparency widget that showcases Ripe’s pricing advantage in stablecoin → fiat conversion.

Users should instantly see: How much fiat do I actually receive? Where did every cent go? The goal is to make fees so clear and fair-looking that people instinctively trust the “Net Fiat Received” number on a tiny slice of screen.

Inputs
Your widget must accept:

Stablecoin Amount
e.g. 10 USDC, 250 USDC, etc.
Target Fiat Currency
e.g. PHP, THB, IDR, MYR, etc. (at least 2 currencies supported).

Optional but nice:

Direction toggle (Send vs Receive)
Preset buttons (e.g. 10 / 50 / 100 USDC).

Inputs should be optimized for mobile: compact, clear, and easy to edit.


Core Logic
Use a mock but competitive FX rate, for example:

Interbank FX: 1 USDC = 59.0 PHP
Customer rate (after spread): 1 USDC = 58.5 PHP

Your calculation should explicitly separate:

Gross Fiat Amount
stablecoin_amount × customer_rate
Ripe Transaction Fee
e.g. 0.5% of the stablecoin or fiat amount
Network Fee
e.g. a flat $2 equivalent (converted to local fiat if needed)
FX Spread
The difference between the interbank rate and the customer rate
Expressed as an effective percentage (e.g. 0.25%).

The final result is the Net Fiat Received after all deductions.


Output Requirements
Design a small, responsive widget that shows:

Headline Result
e.g. “You send 100 USDC → Recipient gets ₱5,800.00”

Breakdown Section
Gross fiat amount at customer rate
Minus Ripe transaction fee
Minus network fee
Implied FX spread (optional text and/or %)
Final net fiat received.

Trust-Building Visuals
Clear labels, aligned decimals, clean typography.
Make it obvious that nothing is “hidden”—every component of cost is visible.

Embeddable Feel
Looks like a self-contained card that could be dropped into any partner site(e.g. bordered, with its own background, no external layout dependencies).


To Solve This Bounty (Minimum Requirements)
A submission counts as solved if you deliver:

A working widget that:
Accepts a stablecoin amount and at least two target fiat currencies.
Uses a mock FX rate and clearly separates:
Gross fiat,
Ripe transaction fee (e.g. 0.5%),
Network fee (e.g. $2),
Net fiat received.
The output updates instantly as the user types or changes inputs.
The UI is:
Visibly optimized for mobile usage,
Clearly formatted with currency symbols and 2–4 decimal places where relevant.

Bonus Points
Built as a single, isolated component:
e.g. a React/Vue/Angular component that can be exported and embedded.
Uses a number/currency formatting library to handle:
Rounding,
Locale-specific formatting,
Edge cases (very small or very large amounts).
Theme support:
Light/dark mode variants or brand color customization.
Comparative view:
Show “Typical legacy provider” vs “Ripe” cost and net received.
Extra toggles:
Direction (Send X, Receive Y),
“View detailed math” expand/collapse section.
Clean, commented code and modular structure for real-world reuse.

Ripe’s broader story:
Building the next-generation global payments infrastructure to become the
“Visa of Asian stablecoin settlement”.
Targeting high-growth Southeast Asia/APAC markets where stablecoins are
already used to send, spend, and earn, not just trade.
Solving the last-mile liquidity problem by connecting:
Crypto wallets directly to existing QR payment rails and e-wallets(e.g. GCash-style systems),
Instantly converting stablecoins → local fiat at the point of sale.


Ripe’s “three-sided network”:
Integrates:
Stablecoin issuers and chains (e.g. Tether),
Wallets and neobanks,
Country payment processors / e-wallets,
Aiming for strong network effects in a $5T+ global e-wallet market.

Use cases this widget helps explain:
Everyday payments,
Payroll,
Remittances,
Trade finance and more—all needing clear, trusted FX + fee visibility.

24-hour feasibility:
Vanilla HTML/CSS/JS with clean math is enough for a strong entry.
Focus on clarity and trust in the UI: tight layout, aligned columns,
and labels that a non-technical user understands at a glance.

