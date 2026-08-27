# Gimkit Don't Look Down console helper

A copy-paste script for **solo Don't Look Down**. No Playwright, no extension.

Paste it on Gimkit. It picks your kit, sets **Game Duration to 59 minutes** (Gimkit's max; 60 gets rejected), starts the game, then answers questions for that session.

## 1. Sign in

Be logged into Gimkit in Chrome or Edge.

## 2. Open kits (or an already-running game)

Best: [https://www.gimkit.com/kits](https://www.gimkit.com/kits)

You can also paste after you already started Don't Look Down. Setup is skipped if the Height HUD or **Answer Questions** is on screen.

## 3. Open the console

- Windows: `F12` or `Ctrl+Shift+J`
- Mac: `Cmd+Option+J`

## 4. Paste and run

1. Open [`gimkit.js`](./gimkit.js) on GitHub
2. Click **Raw**, Select All, Copy
3. Click the console, paste, Enter

You should see `[gimkit] console helper on /kits` then the setup steps.

Stop with `window.__gkh.stop()` or by refreshing.

## What it does

1. Clicks **Play Live** on kit #1 (change `kitIndex` for a different kit)
2. Clicks **Don't Look Down**
3. Clicks **Continue**
4. Sets **Game Duration** to **59**, waits, and checks the field really shows 59 before continuing
5. Clicks **Start game**
6. Starts the 59-minute timer only after the game is actually up
7. Every ~1.5s: open **Answer Questions**, read the correct choice from sniffed `isCorrect` / "This is Correct" / page scripts, click it, then click **Continue** so it does not get stuck on feedback

It does not count a click as success until answer tiles actually show up.

## Options (top of `gimkit.js`)

| Option | Default | When to change it |
| --- | --- | --- |
| `kitIndex` | `0` | `0` is the first Play Live on /kits. Use `1` for the second kit, and so on. |
| `gameMode` | `Don't Look Down` | Leave this unless Gimkit renamed the mode. |
| `sessionMinutes` | `59` | Gimkit max. Do not set 60. |
| `actionDelayMs` | `1500` | Raise if clicks get ignored. Lower if it feels slow. |
| `verifyScans` | `2` | How many times the same correct answer must show before it clicks. Raise if it guesses wrong. |
| `setupStepMs` | `1800` | Pause between setup clicks. Raise if it skips Don't Look Down or duration. |

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `not logged in` | Sign into Gimkit, open /kits, paste again. |
| `no Play Live button` | You are not on /kits, or kits have not loaded yet. Wait, refresh, paste again. |
| `could not verify 59 min` | Set duration to 59 yourself, click Continue, paste on Start game. |
| `never reached the game` | Finish Start game yourself, then paste once Height / Answer Questions is visible. |
| It opens Answer Questions but never picks | Wait a question or two so network sniff can cache `isCorrect`. |
| Stuck on a checkmark / +Energy screen | It should hit Continue; if not, click Continue once and let it resume. |

## License

MIT. See [LICENSE](./LICENSE).
