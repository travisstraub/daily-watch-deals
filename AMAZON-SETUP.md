# Creators API connection setup

The production website and DNS are unchanged. This branch adds an isolated diagnostic; it does not connect the storefront yet.

Create a Creators API application/credential in Amazon Associates Central. Use the client ID, client secret, and credential version provided there, not legacy PA-API access keys. The diagnostic supports versions 3.1, 3.2, and 3.3 and requests the US marketplace.

Configure these server-only variables as Vercel environment variables after importing travisstraub/daily-watch-deals into the intended Vercel team:

- AMAZON_CREATORS_CLIENT_ID (Secret)
- AMAZON_CREATORS_CLIENT_SECRET (Secret)
- AMAZON_CREATORS_CREDENTIAL_VERSION (Config; the version Amazon supplies)
- AMAZON_ASSOCIATE_TAG (Config; straubmediagr-20)

Do not paste credentials in chat or put them in source code. A separate local development credential can be saved in an ignored .env.local file. With Node 22 or newer, run:

    node --env-file=.env.local scripts/check-amazon.mjs

This makes two requests: OAuth authentication, then a single-watch GetItems request. Output includes only status, stage, and counts. A successful test confirms this request works; it does not confirm historical data access or permission to offer price tracking.

Offline verification:

    node --test test/check-amazon.test.mjs

Before production migration: implement the current-offer storefront, validate real responses, preserve Amazon-returned affiliate URLs, test the Vercel deployment, then obtain project-specific DNS values and change the website records at the authoritative DNS provider. Preserve unrelated DNS records.

References:
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation
