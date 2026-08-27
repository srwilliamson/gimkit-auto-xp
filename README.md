# Gimkit Don't Look Down console helper

A copy-paste script for **solo Don't Look Down**. No Playwright, no extension.

Paste it on the **lobby Start game screen**. It clicks Start, then answers questions for 59 minutes.

Do **not** paste on `/kits`. Play Live opens a new page and kills the script.

## 1. Set up the game yourself

1. Sign into Gimkit
2. Open your kit → **Play Live** → **Don't Look Down**
3. Set **Game Duration to 59 minutes** (Gimkit's max; 60 gets rejected)
4. Continue until you are on the **lobby** with a **Start game** button

Leave the console closed until this screen. Duration and mode have to be done before you paste.

## 2. Open the console on that lobby

Stay on the Start game screen.

- Windows: `F12` or `Ctrl+Shift+J`
- Mac: `Cmd+Option+J`

## 3. Paste and run

1. Open [`gimkit.js`](./gimkit.js) on GitHub
2. Click **Raw**, Select All, Copy
3. Click the console, paste, Enter

You should see `[gimkit] lobby — clicking Start game`, then `[gimkit] in game`.

Stop with `window.__gkh.stop()` or by refreshing.

If you already started and you see Height / **Answer Questions**, you can paste there too. It skips Start and just auto-plays.

## What it does from the lobby

1. Clicks **Start game**
2. Starts the 59-minute timer only after Height / Answer Questions is up
3. Every ~1.5s: open **Answer Questions**, pick the correct choice from sniffed `isCorrect` / "This is Correct" / page scripts, click it, then click **Continue** so it does not get stuck on feedback

It does not count a click as success until answer tiles actually show up.

## Questions (exact phrase + 3 wrong)

Gimkit multiple choice is **1 correct answer** and **3 wrong** ones. Copy the **exact phrase** as it appears on the card. Do not paraphrase.

`questions` in `gimkit.js` is empty by default. Fill it in if sniffing misses:

```js
questions: [
  {
    q: "What is 2 + 2?",
    correct: "4",
    wrong: ["3", "5", "22"]
  },
],
```

`q` is the exact question text. `correct` is the exact right tile. `wrong` is the three exact wrong tiles.

If all four tiles on screen match `correct` + the 3 wrong, it clicks `correct`. If the exact question phrase is on screen and the correct tile is there, it clicks that too. Then it still falls back to sniffed `isCorrect`.

## Options (top of `gimkit.js`)

| Option | Default | When to change it |
| --- | --- | --- |
| `questions` | `[]` (empty) | Add `{ q, correct, wrong: [w1, w2, w3] }` with **exact** wording. 1 right, 3 wrong. |
| `sessionMinutes` | `59` | How long to auto-play after the game starts. |
| `actionDelayMs` | `1500` | Raise if clicks get ignored. Lower if it feels slow. |
| `verifyScans` | `2` | How many times the same correct answer must show before it clicks. Raise if it guesses wrong. |

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `you are on kits` | Do not paste there. Finish setup, paste on Start game. |
| `this is still the settings screen` | Set 59 min, Continue, then paste on Start game. |
| `no Start game button` | You are not in the DLD lobby yet. Get to Start game, then paste. |
| `Start game did not stay on this page` | A new tab opened. Paste the script in that tab's console. |
| It opens Answer Questions but never picks | Wait a question or two so network sniff can cache `isCorrect`. |
| Stuck on a checkmark / +Energy screen | It should hit Continue; if not, click Continue once and let it resume. |

## License

MIT. See [LICENSE](./LICENSE).
