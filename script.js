document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------
     1) MENÚ HAMBURGUESA
  ----------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primary-nav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Abrir menú de navegación' : 'Cerrar menú de navegación');
      primaryNav.classList.toggle('is-open', !isOpen);
    });

    // Cerrar el menú al elegir un link (mejora UX en mobile)
    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        primaryNav.classList.remove('is-open');
      });
    });
  }

/* -----------------------------------------------------
   2) CARRIL HORIZONTAL — "Elegí cómo entrar. El objetivo es el mismo"
   Mientras el mouse está sobre el carril y no se llegó al
   principio/final, el scroll vertical (wheel) mueve las cards
   en horizontal. Al llegar a un extremo, se libera el scroll
   normal de la página. Los dots reflejan y permiten saltar
   a la card activa. El touch ya desliza horizontal de forma nativa.
----------------------------------------------------- */
const formatScroll = document.getElementById('formatScroll');
const formatDots = formatScroll ? Array.from(document.querySelectorAll('.format-dot')) : [];

if (formatScroll) {
  const panels = Array.from(formatScroll.querySelectorAll('.format-panel'));
  let snapTimer = null;

  const goToIndex = (index) => {
    if (!panels[index]) return;

    formatScroll.scrollTo({
      left: panels[index].offsetLeft,
      behavior: 'smooth'
    });
  };

  const getClosestIndex = () => {
    let closest = 0;
    let minDistance = Infinity;

    panels.forEach((panel, i) => {
      const distance = Math.abs(panel.offsetLeft - formatScroll.scrollLeft);

      if (distance < minDistance) {
        minDistance = distance;
        closest = i;
      }
    });

    return closest;
  };

  const syncDots = () => {
    const index = getClosestIndex();

    formatDots.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  // Snap manual al panel más cercano
  const scheduleSnap = () => {
    clearTimeout(snapTimer);
 
    snapTimer = setTimeout(() => {
      goToIndex(getClosestIndex());
    }, 500);
  };

  formatScroll.addEventListener(
    'wheel',
    (event) => {
      const maxScroll = formatScroll.scrollWidth - formatScroll.clientWidth;
      const goingForward = event.deltaY > 0;
      const atStart = formatScroll.scrollLeft <= 0;
      const atEnd = formatScroll.scrollLeft >= maxScroll - 1;

      // En los extremos dejamos que la página haga scroll vertical
      if ((goingForward && atEnd) || (!goingForward && atStart)) return;

      event.preventDefault();
      formatScroll.scrollLeft += event.deltaY;
      scheduleSnap();
    },
    { passive: false }
  );

  formatScroll.addEventListener('scroll', syncDots, { passive: true });

  formatDots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToIndex(index));
  });

  syncDots();
}

  /* -----------------------------------------------------
     3) CARRUSEL DE TESTIMONIOS
     1 sola card visible + flechas + autoplay cada 6s.
     Las flechas se desactivan en los extremos (no hacen loop).
     El autoplay sí da la vuelta al llegar al final, para que
     el carrusel siga moviéndose solo todo el tiempo.
     Pensado para escalar: para sumar una reseña nueva alcanza
     con agregar un <blockquote class="testimonial"> en el HTML.
     No hace falta tocar este archivo.
  ----------------------------------------------------- */
  const carousel = document.getElementById('testimonialCarousel');

  if (carousel) {
    const track = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    let autoplayTimer = null;

    const getCardDistance = () => {
      const card = track.querySelector('.testimonial');
      if (!card) return 0;

      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const getMaxScroll = () => track.scrollWidth - track.clientWidth;

    // Prende/apaga las flechas según en qué extremo estemos
    const updateArrowState = () => {
      const maxScroll = getMaxScroll();
      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft >= maxScroll - 1;

      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;
    };

    // Mueve una card. Usado por las flechas: no da la vuelta,
    // se frena en los extremos (por eso se desactivan ahí).
    const scrollByCard = (direction) => {
      const distance = getCardDistance();
      if (!distance) return;

      track.scrollBy({ left: direction * distance, behavior: 'smooth' });
    };

    // Usado por el autoplay: si ya está en la última card,
    // vuelve a la primera en vez de quedarse trabado.
    const autoplayAdvance = () => {
      const maxScroll = getMaxScroll();
      const atEnd = track.scrollLeft >= maxScroll - 1;

      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByCard(1);
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimer = setInterval(autoplayAdvance, 6000);
    };

    const stopAutoplay = () => {
      clearInterval(autoplayTimer);
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        scrollByCard(-1);
        startAutoplay(); // reinicia la cuenta de 6s tras un click manual
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        scrollByCard(1);
        startAutoplay();
      });
    }

    track.addEventListener('scroll', updateArrowState, { passive: true });
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    updateArrowState();
    startAutoplay();
  }
  
  /* -----------------------------------------------------
     4) FORM DE NEWSLETTER — validación básica en cliente
  ----------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterFeedback = document.getElementById('newsletterFeedback');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        newsletterFeedback.textContent = 'Ingresá un email válido para suscribirte.';
        newsletterFeedback.classList.remove('is-success');
        newsletterFeedback.classList.add('is-error');
        emailInput.focus();
        return;
      }

      // Acá Sol debería conectar el envío real (Mailchimp, backend propio, etc.)
      newsletterFeedback.textContent = `Listo. Te vamos a escribir a ${email}.`;
      newsletterFeedback.classList.remove('is-error');
      newsletterFeedback.classList.add('is-success');
      newsletterForm.reset();
    });
  }

/* -----------------------------------------------------
     5) VIDEO AUTOPLAY AL LLEGAR CON SCROLL — sección "La diferencia"
     Aparece con fade-up (data-aos) y arranca solo al entrar
     en pantalla. Se pausa si el usuario se va de la sección.
  ----------------------------------------------------- */
  const diffMedia = document.querySelector('.diff-media');
  const diffVideo = diffMedia ? diffMedia.querySelector('.diff-video') : null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (diffMedia && diffVideo) {
    const diffObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!prefersReducedMotion) {
            diffVideo.play().catch(() => {});
          }
        } else {
          diffVideo.pause();
        }
      });
    }, { threshold: 0.4 });

    diffObserver.observe(diffMedia);
  }

  /* -----------------------------------------------------
     5b) REVEAL GENÉRICO — fade-up al entrar en scroll
     Se aplica a cualquier elemento con data-aos="fade-up"
  ----------------------------------------------------- */
  const fadeUpEls = Array.from(document.querySelectorAll('[data-aos="fade-up"]'));
  if (fadeUpEls.length) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    fadeUpEls.forEach((el) => fadeObserver.observe(el));
  }

  /* -----------------------------------------------------
     6) EQUAL GRID — reveal de stats en mobile
     Las cards del carrusel muestran la foto. El hover/foco ya
     hace aparecer el dato (número + texto) solo con CSS; esto
     es el fallback para tocar en pantallas táctiles, donde no
     existe :hover real.
  ----------------------------------------------------- */
  const statReveals = Array.from(document.querySelectorAll('.stat-reveal'));

  statReveals.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('is-revealed');
    });
  });
  

/* -----------------------------------------------------
   GHOST PILOTS — progressive statement reveal
----------------------------------------------------- */

const ghostSection = document.querySelector(".statement");
const statementLines = document.querySelectorAll(".statement-line");

if (ghostSection && statementLines.length) {
  const updateStatement = () => {
    const rect = ghostSection.getBoundingClientRect();
    const viewportH = window.innerHeight;

    const progress = Math.max(
      0,
      Math.min(
        1,
        (viewportH - rect.top + 180) /
        (viewportH + rect.height * 0.25)
      )
    );

    const visibleLines = Math.ceil(
      progress * statementLines.length
    );

    statementLines.forEach((line, index) => {
      line.classList.toggle(
        "is-active",
        index < visibleLines
      );
    });
  };

  updateStatement();

  window.addEventListener("scroll", updateStatement, {
    passive: true
  });

  window.addEventListener("resize", updateStatement);
}
  
/* -----------------------------------------------------
   TECNOLOGÍA — flip cards al click (no hover)
----------------------------------------------------- */
const flipTriggers = Array.from(document.querySelectorAll('.flip-card-trigger'));

flipTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const isFlipped = trigger.classList.toggle('is-flipped');
    trigger.setAttribute('aria-pressed', String(isFlipped));
  });
});
  
/*----------------------------------------------------
 EQUAL GRID - Carrusel de Objetivos
 -----------------------------------------------------*/
const objectivesCarousel = document.getElementById("objectivesCarousel");

if (objectivesCarousel) {
    const track = document.getElementById("objectivesTrack");
    const prev = document.getElementById("objectivesPrev");
    const next = document.getElementById("objectivesNext");

    const getCardDistance = () => {
        const card = track.querySelector('.objective-card');
        if (!card) return track.clientWidth;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const cardsPerMove = window.matchMedia('(max-width: 640px)').matches ? 1 : 3;
        return (card.getBoundingClientRect().width + gap) * cardsPerMove;
    };

    const maxScroll = () =>
        track.scrollWidth - track.clientWidth;

    const updateButtons = () => {
        prev.disabled = track.scrollLeft <= 1;
        next.disabled = track.scrollLeft >= maxScroll() - 1;
    };

    const scrollByCard = (direction) => {
        const distance = getCardDistance();
        const max = maxScroll();
        const target = Math.min(max, Math.max(0, track.scrollLeft + direction * distance));
        track.scrollTo({ left: target, behavior: "smooth" });
    };

    prev.addEventListener("click", () => scrollByCard(-1));
    next.addEventListener("click", () => scrollByCard(1));

    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
}
  
/* ----------------------------------------------------
   EQUAL GRID ACADEMY — Control de Pestañas (Tabs)
------------------------------------------------------- */
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

if (tabButtons.length && tabPanels.length) {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover estado activo de botones
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      
      // Ocultar todos los paneles
      tabPanels.forEach(panel => {
        panel.setAttribute('hidden', 'true');
        panel.classList.remove('active');
      });

      // Activar pestaña actual
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Mostrar panel vinculado
      const targetPanelId = button.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.removeAttribute('hidden');
        targetPanel.classList.add('active');
      }
    });
  });
}
  
/* ----------------------------------------------------
   EQUAL GRID ACADEMY — Animación por Scroll de la Misión
------------------------------------------------------- */
const missionSection = document.querySelector(".mission-section-bg .statement");
const missionLines = document.querySelectorAll(".mission-section-bg .statement-line");

if (missionSection && missionLines.length) {
  const updateMissionStatement = () => {
    const rect = missionSection.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Mantiene el mismo cálculo matemático exacto de progresión que me pasaste
    const progress = Math.max(
      0,
      Math.min(
        1,
        (viewportH - rect.top + 180) /
        (viewportH + rect.height * 0.25)
      )
    );

    const visibleLines = Math.ceil(
      progress * missionLines.length
    );

    missionLines.forEach((line, index) => {
      line.classList.toggle(
        "is-active",
        index < visibleLines
      );
    });
  };

  // Ejecución inicial para chequear la posición apenas carga la página
  updateMissionStatement();

  // Listeners globales optimizados
  window.addEventListener("scroll", updateMissionStatement, {
    passive: true
  });

  window.addEventListener("resize", updateMissionStatement);
}
  
/* ----------------------------------------------------
   EQUAL GRID ACADEMY — Control de Acordeones (FAQ)
------------------------------------------------------- */
const faqTriggers = document.querySelectorAll('.faq-trigger');

if (faqTriggers.length) {
  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      // Actualizar estado del disparador
      trigger.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
      
      // Control dinámico de apertura con transición de CSS
      if (!isExpanded) {
        panel.removeAttribute('hidden');
        panel.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + "px";
      } else {
        panel.style.maxHeight = null;
        panel.classList.remove('is-open');
        // Pequeño delay para ocultarlo del árbol de accesibilidad tras la transición
        setTimeout(() => {
          if (!trigger.ariaExpanded) panel.setAttribute('hidden', 'true');
        }, 350);
      }
    });
  });
}

/* ----------------------------------------------------
   EQUAL GRID ACADEMY — Validación de Formulario Detalle
------------------------------------------------------- */
const detailForm = document.getElementById('detailContactForm');
if (detailForm) {
  detailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (detailForm.checkValidity()) {
      alert('¡Postulación enviada con éxito! Nos comunicaremos con vos en las próximas 48 horas.');
      detailForm.reset();
    } else {
      detailForm.classList.add('was-validated');
    }
  });
}

/* ----------------------------------------------------
   EQUAL GRID ACADEMY — Contador de Caracteres Reactivo
------------------------------------------------------- */
const reasonTextarea = document.getElementById('contact-reason');
const charCounter = document.getElementById('char-counter');

if (reasonTextarea && charCounter) {
  reasonTextarea.addEventListener('input', () => {
    const currentLength = reasonTextarea.value.length;
    charCounter.textContent = `${currentLength} / 300`;
    
    // Alerta visual de límite alcanzado cambiando el color del contador
    if (currentLength >= 300) {
      charCounter.style.color = 'var(--c-accent)';
    } else {
      charCounter.style.color = 'var(--c-text-muted-on-dark)';
    }
  });
}

});