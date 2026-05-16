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
    navLinks.forEach(l => {
      const href = l.getAttribute('href');
      l.classList.toggle('active', href === `#${current}` || href === `/#${current}`);
    });
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

  // Counter animation for hero stats
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.num[data-count]');
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-count'));
          const duration = 2000;
          const start = performance.now();
          
          const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            counter.textContent = current + (target >= 16 ? '+' : '');
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              counter.textContent = target + '+';
            }
          };
          
          requestAnimationFrame(animate);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) counterObserver.observe(heroStats);

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

  // Contact form animation removed so Web3Forms can handle the native submit
});
