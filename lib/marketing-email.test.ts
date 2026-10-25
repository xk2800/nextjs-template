import assert from "node:assert"
import { textToBroadcastHtml, textToBroadcastText, UNSUBSCRIBE_PLACEHOLDER } from "./marketing-email"

const html = textToBroadcastHtml("  Hi <b>all</b> & co\nline two\n\n\nSecond \"para\"  ")
assert.equal((html.match(/<p style="margin:0 0 16px/g) || []).length, 2) // blank lines split paragraphs
assert.ok(html.includes("Hi &lt;b&gt;all&lt;/b&gt; &amp; co<br>line two")) // escaped, newline → <br>
assert.ok(html.includes("Second &quot;para&quot;"))
assert.ok(!html.includes("<b>"))
assert.ok(html.includes(`href="${UNSUBSCRIBE_PLACEHOLDER}"`)) // every broadcast carries an unsubscribe link

assert.ok(textToBroadcastText(" hello ").startsWith("hello\n"))
assert.ok(textToBroadcastText("hello").endsWith(UNSUBSCRIBE_PLACEHOLDER))

console.log("marketing-email: ok")
