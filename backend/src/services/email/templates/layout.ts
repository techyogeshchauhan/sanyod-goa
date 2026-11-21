export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Shared HTML shell, styled like the live site's order emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #1F2E4E; color: #fff; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">SANYOD</h1>
      <p style="margin: 4px 0 0; font-size: 13px;">Sankhya Yog Darshan</p>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>`;
}
