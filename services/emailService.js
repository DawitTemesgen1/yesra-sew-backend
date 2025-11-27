const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Load and render HTML template with variables
 * @param {string} templateName - Name of the template file (without .html)
 * @param {object} variables - Variables to replace in template
 * @returns {string} Rendered HTML
 */
const renderTemplate = async (templateName, variables) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        let html = await fs.readFile(templatePath, 'utf-8');

        // Replace all {{variable}} placeholders
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
        }

        return html;
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        // Fallback to plain text if template fails
        return null;
    }
};

/**
 * Send OTP email using HTML template
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} name - Recipient name
 */
const sendOtpEmail = async (email, otp, name = 'User') => {
    try {
        // Log OTP for development/testing since email might fail with placeholder creds
        console.log('=================================================');
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        console.log('=================================================');

        const html = await renderTemplate('otp_email', { name, otp });
        const plainText = `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nYesraSew Team`;

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"YesraSew Support" <no-reply@yesrasew.com>',
            to: email,
            subject: 'Your Verification Code - YesraSew',
            text: plainText,
            html: html || plainText,
        });

        console.log('OTP email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // In development, we might want to suppress this error if we just want to test the flow
        // But for now, let's rethrow it so the controller knows, 
        // BUT the controller catches it and continues anyway.
        throw error;
    }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (email, name = 'User') => {
    try {
        const html = await renderTemplate('welcome_email', { name });
        const plainText = `Hello ${name}!\n\nWelcome to YesraSew! Your account has been successfully verified.\n\nYou can now start exploring thousands of opportunities in Ethiopia.\n\nVisit us at: https://yesrasew.com\n\nBest regards,\nYesraSew Team`;

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"YesraSew Support" <no-reply@yesrasew.com>',
            to: email,
            subject: 'Welcome to YesraSew! 🎉',
            text: plainText,
            html: html || plainText,
        });

        console.log('Welcome email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw - welcome email is not critical
    }
};

/**
 * Send an email (generic function - backward compatible)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body (text)
 * @param {string} html - Email body (html) - optional
 */
const sendEmail = async (to, subject, text, html = null) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"YesraSew Support" <no-reply@yesrasew.com>',
            to,
            subject,
            text,
            html: html || text,
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendOtpEmail,
    sendWelcomeEmail,
};
