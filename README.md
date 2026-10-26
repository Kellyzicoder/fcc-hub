# FCC Hub

One home for **Favourite Child Church**'s apps, like the Microsoft 365 start page. Sign in once and see the apps your role uses:

| App | Where it lives |
|---|---|
| Attendance | fcc-welcome.vercel.app/app |
| First-timers (welcome form) | fcc-welcome.vercel.app |
| New converts | fcc-new-converts.vercel.app |
| Livestream | fcclive.vercel.app |

## How it works

- Plain HTML, CSS and JavaScript. No build step.
- Sign-in uses the **same Supabase accounts** as the attendance app (email code or password). Your role comes from `app_me()`, so nobody needs a new account.
- `config.js` has the app links and which roles see which app. Change them there.
- **QR code** buttons show a code for the normal form, to print and put on a table. People scan it with their own phones.
- **Shared device** buttons open a form with `?shared=1`. Use this on a church iPad or phone that many people use: after each person sends the form, it clears itself for the next person.

## Keeping it safe

- Only Supabase's **publishable** key is in `config.js`. Never put the secret / service_role key here.
- The hub only reads the signed-in person's own role. Each app's data is protected by the database's own rules.
