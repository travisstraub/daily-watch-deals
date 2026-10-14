# Private Google Ads tag validation — never merge this branch

This branch is an isolated, Vercel-auth-protected test preview. The operator
approved one clearly identified Google Ads test event, with no traffic purchase,
Amazon navigation, ad click or purchase. Withdrawal may reload the page and cause
a cookie-free consent-status signal. Production Ads must remain disabled.

The preview hostname will be obtained from Vercel's GitHub deployment result and
pinned exactly before the test integration is enabled. No wildcard, production
hostname, credentials, deployment-protection changes or bypass is permitted.

## One-event ledger

| Run | Authorization | Event status | Receipt |
| --- | --- | --- | --- |
| DWF-ADS-VALIDATION-20261014-01 | One manual Ads test event approved | NOT SENT — preparation only | Unverified |

The coding agent must not fire the event. The authorized cloud-browser tester
will connect Tag Assistant separately and update the ledger with the UTC time
and observed result. Uncheck Tag Assistant's “Include debug signal in URL”:
normal URL sanitization remains in effect.
