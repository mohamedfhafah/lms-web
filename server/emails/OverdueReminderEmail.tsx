export type OverdueEmailProps = {
  name: string;
  days: number;
  pretId: string;
};

export function renderOverdueReminderEmail({ name, days, pretId }: OverdueEmailProps): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rappel de retard</title>
  </head>
  <body style="margin:0;padding:20px;background:#f9fafb;">
    <div style="max-width:680px;margin:0 auto;">
      <div style="margin:0 0 16px 0;text-align:center;color:#111827;font-weight:600;">
        Bibliothèque – Rappel de retard
      </div>
      <div style="max-width:640px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <h1 style="margin:0 0 16px 0;font-size:20px;">Emprunt en retard</h1>
        <p style="margin:0 0 12px 0;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';line-height:1.6;color:#111827;">
          Bonjour ${name},
        </p>
        <p style="margin:0 0 12px 0;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';line-height:1.6;color:#111827;">
          Votre emprunt (ID: <strong>${pretId}</strong>) est en retard de <strong>${days} jour(s)</strong>.
          Merci de retourner l'ouvrage dès que possible ou de contacter la bibliothèque pour assistance.
        </p>
        <p style="margin-top:16px;font-size:12px;color:#4b5563;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';line-height:1.6;">
          Ceci est un rappel automatique. Si vous avez déjà effectué le retour, veuillez ignorer ce message.
        </p>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#4b5563;text-align:center;">
        © ${year} Bibliothèque
      </p>
    </div>
  </body>
</html>`;
}
