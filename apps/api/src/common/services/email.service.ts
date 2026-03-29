import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  variables: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
    await this.loadTemplates();
  }

  /**
   * Initialize Nodemailer transporter
   */
  private async initializeTransporter() {
    const smtpHost = this.configService.get<string>('email.host', 'smtp.sendgrid.net');
    const smtpPort = this.configService.get<number>('email.port', 587);
    const smtpUser = this.configService.get<string>('email.user', 'apikey');
    const smtpPass = this.configService.get<string>('email.pass');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      tls: { ciphers: 'SSLv3' },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    try {
      await this.transporter.verify();
      this.logger.log('Email transporter initialized successfully');
    } catch {
      this.logger.warn('Email transporter not verified - emails will be logged only');
    }
  }

  /**
   * Load all email templates
   */
  private async loadTemplates() {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Handlebars.SafeString(
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0)
      );
    });

    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      return new Handlebars.SafeString(
        new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
      );
    });

    // Load templates
    const templateMap: Record<string, string> = {
      'welcome': this.getWelcomeTemplate(),
      'email-verify': this.getEmailVerifyTemplate(),
      'password-reset': this.getPasswordResetTemplate(),
      'password-changed': this.getPasswordChangedTemplate(),
      'order-confirmed': this.getOrderTemplate('confirmed'),
      'order-shipped': this.getOrderTemplate('shipped'),
      'order-delivered': this.getOrderTemplate('delivered'),
      'order-cancelled': this.getOrderTemplate('cancelled'),
      'subscription-renewed': this.getSubscriptionTemplate('renewed'),
      'subscription-expiring-7d': this.getSubscriptionTemplate('expiring'),
      'subscription-expiring-1d': this.getSubscriptionTemplate('expiring'),
      'payment-failed': this.getPaymentFailedTemplate(),
      'kyc-approved': this.getKycTemplate('approved'),
      'kyc-rejected': this.getKycTemplate('rejected'),
      'milestone-earned': this.getMilestoneTemplate(),
      'withdrawal-processed': this.getWithdrawalTemplate(),
      'new-order-vendor': this.getNewOrderVendorTemplate(),
      'delivery-assigned': this.getDeliveryAssignedTemplate(),
      'low-stock': this.getLowStockTemplate(),
      'flash-deal': this.getFlashDealTemplate(),
      'referral-bonus': this.getReferralBonusTemplate(),
    };

    for (const [name, content] of Object.entries(templateMap)) {
      this.templates.set(name, Handlebars.compile(content));
    }

    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  /**
   * Send an email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    template: string,
    variables: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    const templateFn = this.templates.get(template);
    if (!templateFn) {
      this.logger.warn(`Template not found: ${template}, using default`);
    }

    const templateData = {
      appName: 'KWIKSELLER',
      appUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
      supportEmail: 'support@kwikseller.com',
      year: new Date().getFullYear(),
      ...variables,
    };

    const html = templateFn ? templateFn(templateData) : this.getDefaultTemplate(subject, templateData);
    const text = this.htmlToText(html);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"KWIKSELLER" <${this.configService.get('email.from', 'noreply@kwikseller.com')}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${errorMessage}`);
      // In development, log the email content instead
      this.logger.debug(`Email content:\n${text}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  private getStyles(): string {
    return `
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #1A56DB; }
        .title { color: #111827; font-size: 24px; font-weight: 600; margin: 20px 0; }
        .content { color: #4B5563; margin-bottom: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #1A56DB; color: #fff; text-decoration: none; border-radius: 8px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
        .highlight { background: #EFF6FF; padding: 16px; border-radius: 8px; margin: 20px 0; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; }
        .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; }
      </style>
    `;
  }

  private getDefaultTemplate(subject: string, data: any): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container"><h1>${subject}</h1><div class="content">${JSON.stringify(data, null, 2)}</div><div class="footer">© ${new Date().getFullYear()} KWIKSELLER</div></div></body></html>`;
  }

  // ==================== EMAIL TEMPLATES ==================

  private getWelcomeTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Welcome to KWIKSELLER!</h1>
      <div class="content">
        <p>Hello {{firstName}},</p>
        <p>Thank you for joining KWIKSELLER - Africa's most powerful commerce operating system!</p>
        <p>We're excited to have you on board.</p>
      </div>
      <div class="highlight" style="text-align:center;">
        <p><strong>Verify your email address</strong> to unlock all features.</p>
        <a href="{{verificationUrl}}" class="button">Verify Email</a>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getEmailVerifyTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Verify Your Email Address</h1>
      <div class="content">
        <p>Hello {{name}},</p>
        <p>Thank you for registering with KWIKSELLER. Please verify your email address to activate your account.</p>
      </div>
      <div class="highlight" style="text-align:center;">
        <p>Click the button below to verify your email:</p>
        <a href="{{verificationUrl}}" class="button">Verify Email</a>
        <p style="margin-top:20px;color:#6B7280;font-size:14px;">This link expires in 24 hours.</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getPasswordResetTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Reset Your Password</h1>
      <div class="content">
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your KWIKSELLER account.</p>
      </div>
      <div class="highlight" style="text-align:center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
        <p style="margin-top:20px;color:#6B7280;font-size:14px;">This link expires in 1 hour.</p>
      </div>
      <div class="warning"><p><strong>Security Note:</strong> If you didn't request this, please ignore this email.</p></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getPasswordChangedTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Password Changed Successfully</h1>
      <div class="content"><p>Hello {{name}},</p><p>Your password has been successfully changed.</p></div>
      <div class="success"><p>✅ Your account password was updated.</p></div>
      <div class="warning"><p>If you didn't make this change, please contact support immediately.</p></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getOrderTemplate(status: string): string {
    const statusEmoji = { confirmed: '🎉', shipped: '🚚', delivered: '✅', cancelled: '❌' };
    const statusTitle = { confirmed: 'Order Confirmed!', shipped: 'Order Shipped!', delivered: 'Order Delivered!', cancelled: 'Order Cancelled' };
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">${statusEmoji[status]} ${statusTitle[status]}</h1>
      <div class="content">
        <p>Hello {{name}},</p>
        <p>Your order #{{orderNumber}} has been ${status}.</p>
      </div>
      <div class="highlight">
        <p><strong>Order #:</strong> {{orderNumber}}</p>
        <p><strong>Total:</strong> {{formatCurrency total}}</p>
      </div>
      <div style="text-align:center;margin:30px 0;"><a href="{{orderUrl}}" class="button">View Order</a></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getSubscriptionTemplate(type: string): string {
    const title = type === 'renewed' ? 'Subscription Renewed 🔄' : 'Subscription Expiring Soon ⚠️';
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">${title}</h1>
      <div class="content"><p>Hello {{name}},</p></div>
      <div class="${type === 'renewed' ? 'success' : 'warning'}">
        <p><strong>Plan:</strong> {{planName}}</p>
        <p><strong>Amount:</strong> {{formatCurrency amount}}</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getPaymentFailedTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Payment Failed ❌</h1>
      <div class="content"><p>Hello {{name}},</p><p>We were unable to process your payment.</p></div>
      <div class="warning"><p><strong>Reason:</strong> {{failureReason}}</p><p><strong>Amount:</strong> {{formatCurrency amount}}</p></div>
      <div style="text-align:center;margin:30px 0;"><a href="{{paymentUrl}}" class="button">Update Payment</a></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getKycTemplate(status: string): string {
    const approved = status === 'approved';
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">KYC Verification ${approved ? 'Approved ✅' : 'Update Required'}</h1>
      <div class="content"><p>Hello {{name}},</p></div>
      <div class="${approved ? 'success' : 'warning'}">
        <p>${approved ? 'Your identity verification has been approved!' : `<strong>Reason:</strong> {{rejectionReason}}`}</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getMilestoneTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Milestone Achieved! 🎉</h1>
      <div class="content"><p>Hello {{name}},</p><p>Congratulations! You've achieved a milestone!</p></div>
      <div class="success" style="text-align:center;">
        <h2 style="color:#10B981;margin:0;">🪙 +{{coinsAwarded}} KwikCoins</h2>
        <p style="margin-top:10px;"><strong>{{milestoneName}}</strong></p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getWithdrawalTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">Withdrawal Processed 💰</h1>
      <div class="content"><p>Hello {{name}},</p><p>Your withdrawal has been processed.</p></div>
      <div class="success">
        <p><strong>Amount:</strong> {{formatCurrency amount}}</p>
        <p><strong>Bank:</strong> {{bankName}}</p>
        <p><strong>Reference:</strong> {{reference}}</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getNewOrderVendorTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">🎉 New Order Received!</h1>
      <div class="content"><p>Hello {{vendorName}},</p><p>You have a new order from {{buyerName}}!</p></div>
      <div class="highlight">
        <p><strong>Order #:</strong> {{orderNumber}}</p>
        <p><strong>Total:</strong> {{formatCurrency total}}</p>
      </div>
      <div style="text-align:center;margin:30px 0;"><a href="{{orderUrl}}" class="button">View Order</a></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getDeliveryAssignedTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">New Delivery Assigned 🚚</h1>
      <div class="content"><p>Hello {{riderName}},</p><p>A new delivery has been assigned to you!</p></div>
      <div class="highlight">
        <p><strong>Order #:</strong> {{orderNumber}}</p>
        <p><strong>Earnings:</strong> {{formatCurrency earnings}}</p>
        <p><strong>Pickup:</strong> {{pickupAddress}}</p>
        <p><strong>Delivery:</strong> {{deliveryAddress}}</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getLowStockTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">⚠️ Low Stock Alert</h1>
      <div class="content"><p>Hello {{vendorName}},</p><p>Some products are running low on stock.</p></div>
      <div class="warning"><p>Products with low stock: {{productCount}}</p></div>
      <div style="text-align:center;margin:30px 0;"><a href="{{inventoryUrl}}" class="button">Manage Inventory</a></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getFlashDealTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">🔥 Flash Deal Alert!</h1>
      <div class="content"><p>Hello {{name}},</p><p>Don't miss out on this limited-time offer!</p></div>
      <div class="highlight" style="text-align:center;background:linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%);">
        <h2 style="margin:0 0 10px;">{{productName}}</h2>
        <p style="font-size:24px;font-weight:bold;color:#EF4444;margin:0;">{{discount}}% OFF</p>
        <p><span style="text-decoration:line-through;color:#9CA3AF;">{{formatCurrency originalPrice}}</span> <span style="font-size:24px;font-weight:bold;margin-left:10px;">{{formatCurrency salePrice}}</span></p>
      </div>
      <div style="text-align:center;margin:30px 0;"><a href="{{productUrl}}" class="button">Shop Now</a></div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }

  private getReferralBonusTemplate(): string {
    return `<!DOCTYPE html><html><head>${this.getStyles()}</head><body><div class="container">
      <div class="header"><div class="logo">🛒 KWIKSELLER</div></div>
      <h1 class="title">🎁 Referral Bonus Earned!</h1>
      <div class="content"><p>Hello {{name}},</p><p>Your referral just signed up and you earned a bonus!</p></div>
      <div class="success" style="text-align:center;">
        <h2 style="color:#10B981;margin:0;">🪙 +{{coinsAwarded}} KwikCoins</h2>
        <p style="margin-top:10px;"><strong>{{referredName}}</strong> just joined KWIKSELLER!</p>
      </div>
      <div class="footer"><p>© {{year}} KWIKSELLER. All rights reserved.</p></div>
    </div></body></html>`;
  }
}
