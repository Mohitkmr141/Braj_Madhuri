import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request) {
  try {
    const rawUser = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASS;
    
    if (!rawUser || !rawPass) {
      return NextResponse.json({
        success: false,
        error: "Missing EMAIL_USER or EMAIL_PASS in environment variables.",
        userConfigured: !!rawUser,
        passConfigured: !!rawPass
      }, { status: 400 });
    }

    const user = rawUser.trim();
    const pass = rawPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"The Braj Madhuri Test" <${user}>`,
      to: user,
      subject: 'Test Email from The Braj Madhuri',
      text: 'If you receive this, the SMTP configuration on Vercel is working perfectly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4A1521;">🪷 The Braj Madhuri - SMTP Verification</h2>
          <p>If you are reading this email, your Gmail SMTP configuration (App Password) is working correctly!</p>
          <p style="font-size: 12px; color: #888;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: "Test email sent successfully! Check your inbox."
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

