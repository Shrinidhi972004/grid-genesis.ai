/**
 * Navigation.js — Floating glass-morphism nav
 * 
 * - Transparent → visible on scroll
 * - Magnetic hover effect on links
 * - Mobile hamburger toggle
 * - Active section tracking
 */

export class Navigation {
  constructor() {
    this.nav = document.getElementById('main-nav');
    this.links = this.nav.querySelectorAll('.nav__link');
    this.cta = this.nav.querySelector('.nav__cta');
    this.toggle = document.querySelector('.nav__mobile-toggle');
    this.mobileNav = document.getElementById('mobile-nav');
    this.isScrolled = false;
    this.activeSection = null;

    this._bindEvents();
    this._observeSections();
  }

  _bindEvents() {
    // Mobile toggle
    if (this.toggle && this.mobileNav) {
      this.toggle.addEventListener('click', () => {
        const expanded = this.toggle.getAttribute('aria-expanded') === 'true';
        this.toggle.setAttribute('aria-expanded', String(!expanded));
        this.mobileNav.classList.toggle('active');
        document.body.style.overflow = expanded ? '' : 'hidden';
      });

      // Close mobile nav on link click
      this.mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
        link.addEventListener('click', () => {
          this.mobileNav.classList.remove('active');
          this.toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }

    // Magnetic hover on desktop links
    this.links.forEach(link => {
      link.addEventListener('mousemove', (e) => {
        const rect = link.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        link.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      link.addEventListener('mouseleave', () => {
        link.style.transform = '';
      });
    });

    // CTA magnetic
    if (this.cta) {
      this.cta.addEventListener('mousemove', (e) => {
        const rect = this.cta.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        this.cta.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      });
      this.cta.addEventListener('mouseleave', () => {
        this.cta.style.transform = '';
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  _observeSections() {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this._setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(section => observer.observe(section));
  }

  _setActiveSection(id) {
    this.activeSection = id;
    this.links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${id}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  onScroll(scrollY) {
    if (scrollY > 50 && !this.isScrolled) {
      this.isScrolled = true;
      this.nav.classList.add('scrolled');
    } else if (scrollY <= 50 && this.isScrolled) {
      this.isScrolled = false;
      this.nav.classList.remove('scrolled');
    }
  }
}
