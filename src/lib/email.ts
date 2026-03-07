import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const defaultFrom =
  process.env.RESEND_FROM_EMAIL || "TravelPlanner <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const result = await resend.emails.send({
    from: defaultFrom,
    to: email,
    subject: "Reset your TravelPlanner password",
    text: [
      "Reset your TravelPlanner password",
      "",
      `Open this link to reset your password: ${resetUrl}`,
      "",
      "This link expires in 1 hour. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <h2>Reset your password</h2>
      <p>Someone requested a password reset for your TravelPlanner account.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    `,
  });

  if (result.error) {
    throw new Error(`Resend failed: ${result.error.message}`);
  }
}