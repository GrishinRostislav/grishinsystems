document.addEventListener('DOMContentLoaded', () => {
  // Sticky header
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));

  // Mobile nav
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-nav-close');
  hamburger?.addEventListener('click', () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
  document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Active nav
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
  });

  // Scroll animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Terminal typing effect
  const terminalObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const lines = document.querySelectorAll('.terminal-line');
      lines.forEach((line, i) => {
        setTimeout(() => {
          line.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          line.style.opacity = '1';
          line.style.transform = 'translateX(0)';
        }, 300 + i * 200);
      });
      terminalObserver.disconnect(); // Run only once
    }
  }, { threshold: 0.3 });

  const terminal = document.querySelector('.hero-terminal');
  if (terminal) {
    document.querySelectorAll('.terminal-line').forEach(line => {
      line.style.opacity = '0';
      line.style.transform = 'translateX(-10px)';
    });
    terminalObserver.observe(terminal);
  }

  // Contact form
  // Contact form animation removed so Web3Forms can handle the native submit
});
