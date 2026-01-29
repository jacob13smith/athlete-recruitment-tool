import { Resend } from "resend"

// Initialize Resend client (only if API key is provided)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend API key not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset your RecruitMe password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
              <h1 style="color: #1f2937; margin-top: 0;">Reset your password</h1>
              <p>You requested to reset your password for your RecruitMe account.</p>
              <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.</p>
              <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} RecruitMe. All rights reserved.</p>
          </body>
        </html>
      `,
      text: `Reset your password\n\nYou requested to reset your password for your RecruitMe account.\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send email" 
    }
  }
}

/**
 * Send email verification link (required to publish profile)
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend API key not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"
  const verifyUrl = `${appUrl}/verify-email?token=${token}`

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify your RecruitMe email",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
              <h1 style="color: #1f2937; margin-top: 0;">Verify your email</h1>
              <p>Thanks for signing up for RecruitMe. Verify your email to publish your recruitment profile and get a shareable link.</p>
              <p>Click the button below to verify. This link will expire in 24 hours.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify email</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
              <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} RecruitMe. All rights reserved.</p>
          </body>
        </html>
      `,
      text: `Verify your RecruitMe email\n\nThanks for signing up. Verify your email to publish your recruitment profile.\n\nClick this link to verify (expires in 24 hours):\n${verifyUrl}\n\nIf you didn't create an account, you can safely ignore this email.`,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
