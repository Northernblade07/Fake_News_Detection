// lib/mailer.ts
import "server-only";
import { Resend, CreateEmailOptions } from "resend";

// ===== Environment variables & validations =====
const API_KEY: string = process.env.RESEND_API_KEY!;
const MAIL_FROM: string = process.env.MAIL_FROM!; // e.g. "YourApp <no-reply@yourdomain.com>"

if (!API_KEY) throw new Error("RESEND_API_KEY not set");
if (!MAIL_FROM) throw new Error('MAIL_FROM not set (e.g. "YourApp <no-reply@yourdomain.com>")');

// ===== Singleton Resend client =====
declare global {
  var _resendClient: Resend | undefined;
}

const resend = global._resendClient ?? new Resend(API_KEY);
if (process.env.NODE_ENV === "development") global._resendClient = resend;

// ===== Mail function & types =====
export type SendMailParams = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[]; // camelCase in your code
  headers?: Record<string, string>;
};

export async function sendMail(params: SendMailParams): Promise<{ id: string }> {
  const to = Array.isArray(params.to) ? params.to : [params.to];

  // Map to Resend SDK's snake_case properties
  const emailOptions: CreateEmailOptions = {
    from: MAIL_FROM,
    to,
    subject: params.subject,
    html: params.html??undefined,
    text: params.text??"",
    headers: params.headers??undefined,
    reply_to: params.replyTo??undefined, // correct snake_case
  };

  const { data, error } = await resend.emails.send(emailOptions);

  if (error) {
    // Type-safe error handling
    if (typeof error === "string") throw new Error(error);
    if (error instanceof Error) throw error;
    throw new Error("Resend send error");
  }

  if (!data?.id) throw new Error("Failed to get email ID from Resend");

  return { id: data.id };
}

// ===== OTP email template =====
export function otpEmailHtml(
  purpose: "verify" | "reset",
  code: string,
  expiresInMinutes = Number(process.env.OTP_EXPIRY_MINUTES ?? 10)
): string {
  const title = purpose === "verify" ? "Verify your account" : "Reset your password";
  return `
    <div style="font-family:Arial,sans-serif">
      <h2>${title}</h2>
      <p>Your one-time code is:</p>
      <p style="font-size:22px;font-weight:700;letter-spacing:3px">${code}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p>If this wasn't requested, please ignore this email.</p>
    </div>
  `;
}
