import { NextResponse } from 'next/server';
import { sendContactEmail } from '../../../lib/mailer.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your name.' },
        { status: 400 }
      );
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your message.' },
        { status: 400 }
      );
    }

    console.log(`[Contact API] Processing inquiry from ${name} (${email})...`);

    const result = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'Website Inquiry',
      message: message.trim(),
    });

    if (result.skipped) {
      console.warn('[Contact API] Email credentials missing or skipped');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service is currently unavailable. Please reach out via WhatsApp or direct email.',
        },
        { status: 503 }
      );
    }

    if (!result.success) {
      console.error('[Contact API] Failed to send contact email:', result.admin?.error);
      return NextResponse.json(
        {
          success: false,
          error: result.admin?.error || 'Failed to send your message. Please try again later or contact us on WhatsApp.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you shortly.',
    });
  } catch (error) {
    console.error('[Contact API] Error handling contact submission:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while sending your message. Please try again.',
      },
      { status: 500 }
    );
  }
}
