# Ayu Website

Static personal website published with GitHub Pages.

## Publish source

GitHub Pages deploys the root of the `gh-pages` branch. The public site lives in `ayu-site/`:

- `ayu-site/index.html` - homepage
- `ayu-site/css/style.css` - homepage styles
- `ayu-site/js/main.js` - homepage interactions and Animalese playback
- `ayu-site/data.json` - work content loaded by the homepage
- `ayu-site/animalese/` - letter-based Animalese audio files
- `ayu-site/works/` and `ayu-site/avatars/` - site images

## Local preview

From the repository root, run:

```cmd
python -m http.server 8000
```

Then visit `http://localhost:8000/ayu-site/`.

## Deployment

Commit and push changes on `gh-pages`. GitHub Pages publishes the branch root automatically.
