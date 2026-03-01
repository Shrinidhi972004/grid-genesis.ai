/**
 * ContactForm.js — Contact form with EmailJS integration
 * 
 * Features:
 * - Floating label animations
 * - Client-side validation 
 * - EmailJS submission
 * - Success/error states with animation
 */

export class ContactForm {
  constructor(formElement) {
    this.form = formElement;
    if (!this.form) return;

    this.submitBtn = this.form.querySelector('.form-submit');
    this.statusEl = this.form.querySelector('.form-status') || this._createStatusEl();
    this.isSubmitting = false;

    this._initFloatingLabels();
    this._bindSubmit();
  }

  _createStatusEl() {
    const el = document.createElement('div');
    el.className = 'form-status';
    el.style.display = 'none';
    this.form.appendChild(el);
    return el;
  }

  _initFloatingLabels() {
    // Add 'has-value' class for CSS floating labels
    const inputs = this.form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.value) input.classList.add('has-value');

      input.addEventListener('focus', () => input.classList.add('focused'));
      input.addEventListener('blur', () => {
        input.classList.remove('focused');
        if (input.value) {
          input.classList.add('has-value');
        } else {
          input.classList.remove('has-value');
        }
      });
    });
  }

  _bindSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isSubmitting) return;

      if (!this._validate()) return;

      this.isSubmitting = true;
      this._setLoading(true);

      try {
        await this._sendEmail();
        this._showStatus('success', 'Message sent. We\'ll be in touch shortly.');
        this.form.reset();
        // Clear floating label states
        this.form.querySelectorAll('.has-value').forEach(el => el.classList.remove('has-value'));
      } catch (err) {
        console.error('EmailJS error:', err);
        this._showStatus('error', 'Something went wrong. Please try again or email us directly.');
      } finally {
        this.isSubmitting = false;
        this._setLoading(false);
      }
    });
  }

  _validate() {
    const name = this.form.querySelector('#form-name');
    const email = this.form.querySelector('#form-email');
    const message = this.form.querySelector('#form-context');

    let valid = true;
    [name, email, message].forEach(field => {
      if (field && !field.value.trim()) {
        field.classList.add('error');
        valid = false;
      } else if (field) {
        field.classList.remove('error');
      }
    });

    if (email && email.value && !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      email.classList.add('error');
      valid = false;
    }

    return valid;
  }

  async _sendEmail() {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!publicKey || !serviceId || !templateId) {
      // Fallback: just log the data if EmailJS isn't configured
      const formData = new FormData(this.form);
      console.log('Form submitted (EmailJS not configured):', Object.fromEntries(formData));
      return;
    }

    const { default: emailjs } = await import('@emailjs/browser');
    emailjs.init(publicKey);
    await emailjs.sendForm(serviceId, templateId, this.form);
  }

  _setLoading(loading) {
    if (this.submitBtn) {
      if (loading) {
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
      } else {
        this.submitBtn.classList.remove('loading');
        this.submitBtn.disabled = false;
      }
    }
  }

  _showStatus(type, message) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.className = `form-status ${type}`;
    this.statusEl.style.display = 'block';

    setTimeout(() => {
      this.statusEl.style.display = 'none';
    }, 5000);
  }
}
