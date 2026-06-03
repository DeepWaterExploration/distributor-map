# Distributor Map

A full-viewport dark, monochrome world map plotting distributors from
`public/distributors.json` as glowing clustered pins. Built to be embedded in an
iframe. Static — deploys to GitHub Pages with no backend or API keys.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # run data + clipboard unit tests
npm run build    # typecheck + production build to dist/
```

## Update distributors

Edit `public/distributors.json` (array of objects):

```json
{
  "name": "Example Co",
  "website": "https://example.com/",
  "address": "123 Main St, City",
  "phone": "+1 555 123 4567",
  "email": "info@example.com",
  "coordinates": [12.3456, -65.4321]
}
```

`coordinates` is `[latitude, longitude]`. Any of `website`/`address`/`phone`/`email`
may be empty (`""`) and will be hidden in the popup. `name` and a valid
`coordinates` pair are required. Commit and push — the site rebuilds and redeploys.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
deploys to GitHub Pages. One-time setup: in the repo, go to
**Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.

## Embed

```html
<iframe src="https://<user>.github.io/<repo>/" style="border:0;width:100%;height:600px"></iframe>
```
