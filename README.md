# Gimkit Don't Look Down console helper

A copy-paste script for **solo Don't Look Down**. No Playwright, no extension.

**Paste only on the lobby screen that already shows `Start game`.** The script clicks that button, then auto-answers for 59 minutes.

## Do not paste on `/kits`

**Wrong:** `https://www.gimkit.com/kits`, any screen with **Play Live**, or **Game Duration**.

Play Live opens a **new page** and **kills the paste**. You have to set up Don't Look Down yourself first.

**Right:** the Don't Look Down lobby with a **Start game** button.

## 1. Set up the game yourself (before F12)

Do all of this in the browser. Leave DevTools closed.

1. Sign into Gimkit
2. Open your kit
3. Click **Play Live**
4. Pick **Don't Look Down**
5. Set **Game Duration to 59 minutes** (Gimkit's max; 60 gets rejected)
6. Click **Continue** until you see the lobby **Start game** button

Stay on that Start game screen.

## 2. Open the console on that same tab

- Windows: `F12` or `Ctrl+Shift+J`
- Mac: `Cmd+Option+J`

Click the **Console** tab.

## 3. Paste `gimkit.js` and press Enter

1. Open [`gimkit.js`](./gimkit.js) on GitHub
2. Click **Raw**
3. Select All, Copy
4. Click the Gimkit console, paste, Enter

You should see `[gimkit] lobby — clicking Start game`, then `[gimkit] in game`.

It clicks **Start game** and auto-answers for 59 minutes.

Stop with `window.__gkh.stop()` or by refreshing.

If you already started and you see Height / **Answer Questions**, you can paste there too. It skips Start and just auto-plays.

## What it does from the lobby

1. Clicks **Start game** (or **Start hosting**)
2. Starts the 59-minute timer only after Height / Answer Questions / answer tiles are up
3. Every ~1.5s: open **Answer Questions**, pick the correct choice from sniffed `isCorrect` / "This is Correct" / page scripts, click it, then click **Continue** so it does not get stuck on feedback

It does not count a click as success until answer tiles actually show up.

## Options (top of `gimkit.js`)

| Option | Default | When to change it |
| --- | --- | --- |
| `sessionMinutes` | `59` | How long to auto-play after the game starts. |
| `actionDelayMs` | `1500` | Raise if clicks get ignored. Lower if it feels slow. |
| `verifyScans` | `2` | How many times the same correct answer must show before it clicks. Raise if it guesses wrong. |

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `you are on kits` | You pasted on `/kits` or Play Live. Finish setup yourself, then paste on **Start game**. |
| `this is still the settings screen` | Set duration to **59**, click **Continue**, then paste on **Start game**. |
| `no Start game button` | You are not in the DLD lobby yet. Get to **Start game**, then paste. |
| `Start game did not stay on this page` | A new tab opened. Paste the script in **that** tab's console. |
| It opens Answer Questions but never picks | Wait a question or two so network sniff can cache `isCorrect`. |
| Stuck on a checkmark / +Energy screen | It should hit Continue; if not, click Continue once and let it resume. |

## License

MIT. See [LICENSE](./LICENSE).
