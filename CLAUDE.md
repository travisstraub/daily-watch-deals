@AGENTS.md

## Automated builder

This repository is maintained by an automated builder: Claude Code running on the OpenClaw droplet, working from briefs in the owner's queue.

- Publish only with `sudo -n -u sitepub /usr/local/bin/site-publish`. Never run `git push`, change remotes or edit git config.
- Protected files need the owner: AGENTS.md, CLAUDE.md, vercel.json, CNAME, package.json, .gitignore, .env files, AMAZON-SETUP.md, scripts/check-amazon.mjs, the analytics, consent and ads files in src/, the Google verification file and existing tests.
- Always run `npm run build` and `npm test`, and commit the regenerated `public/` output with the source change.
