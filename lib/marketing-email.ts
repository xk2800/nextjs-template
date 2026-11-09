// Plain text from the admin form → broadcast HTML. Blank lines split
// paragraphs, single newlines become <br>. Resend swaps in the unsubscribe
// link and handles opt-outs for the segment.
export const UNSUBSCRIBE_PLACEHOLDER = "{{{RESEND_UNSUBSCRIBE_URL}}}"

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function textToBroadcastHtml(text: string) {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px;line-height:24px">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("")

  return `<div style="font-family:Arial,sans-serif;font-size:16px;color:#1a1a1a;max-width:560px;margin:0 auto;padding:20px 0">${paragraphs}<p style="margin-top:32px;font-size:12px;color:#999999"><a href="${UNSUBSCRIBE_PLACEHOLDER}" style="color:#999999">Unsubscribe</a></p></div>`
}

export function textToBroadcastText(text: string) {
  return `${text.trim()}\n\n--\nUnsubscribe: ${UNSUBSCRIBE_PLACEHOLDER}`
}
