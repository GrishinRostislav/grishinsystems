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
      const lines = Array.from(document.querySelectorAll('.terminal-line'));
      
      const typeNextLine = (index) => {
        if (index >= lines.length) return;
        
        const line = lines[index];
        line.style.display = 'block'; // Show the line
        
        const cmdSpan = line.querySelector('.cmd');
        if (cmdSpan) {
          // This is a command line: simulate typing
          const text = cmdSpan.getAttribute('data-text') || cmdSpan.textContent;
          if (!cmdSpan.getAttribute('data-text')) cmdSpan.setAttribute('data-text', text);
          cmdSpan.textContent = '';
          
          let charIndex = 0;
          const typeChar = () => {
            if (charIndex < text.length) {
              cmdSpan.textContent += text.charAt(charIndex);
              charIndex++;
              setTimeout(typeChar, Math.random() * 20 + 20); // 20-40ms per character (smoother & faster)
            } else {
              // Finished typing command, simulate hitting Enter
              setTimeout(() => typeNextLine(index + 1), 200);
            }
          };
          typeChar();
        } else {
          // This is an output line or the final prompt: show instantly
          setTimeout(() => typeNextLine(index + 1), 100);
        }
      };

      typeNextLine(0); // Start the sequence
      terminalObserver.disconnect(); // Run only once
    }
  }, { threshold: 0.3 });

  const terminal = document.querySelector('.hero-terminal');
  if (terminal) {
    document.querySelectorAll('.terminal-line').forEach(line => {
      line.style.display = 'none'; // Hide all lines initially
      line.style.opacity = '1';
      line.style.transform = 'none';
      line.style.transition = 'none';
    });
    terminalObserver.observe(terminal);
  }

  // Contact form
  // Contact form animation removed so Web3Forms can handle the native submit
});
