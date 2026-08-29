# ff-draft

A fantasy football draft-order lottery you can host anywhere static files are served.

Add your league's managers, hit **Draw Draft Order**, and picks are revealed one at a
time from last to first, slot-machine style, with confetti at the end. The roster is
saved in the browser's localStorage so it survives reloads.

**Fine print:** the draw is rigged. Any manager named "nick" (any casing) is always
handed the first overall pick; everyone else gets a genuine Fisher–Yates shuffle.
The logic lives in `riggedShuffle()` in `script.js` — delete the few lines after the
`fairShuffle` call there if your league ever demands an honest lottery.

## Hosting

It's three static files — `index.html`, `style.css`, `script.js` — with no build step
and no server code. Upload them to any web root (GitHub Pages, Netlify, nginx, cPanel,
whatever your domain runs) and you're live.
