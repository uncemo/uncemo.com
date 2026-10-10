// Small, dependency-free behaviour: theme toggle, mobile nav, scroll reveal, and the hero chat loop.
(function () {
  const root = document.documentElement;

  // ---- theme ------------------------------------------------------------
  const themeBtn = document.getElementById("theme");
  const stored = safeGet("theme");
  if (stored === "light" || stored === "dark") root.dataset.theme = stored;
  themeBtn?.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    safeSet("theme", root.dataset.theme);
  });

  // ---- mobile nav -------------------------------------------------------
  const menuBtn = document.getElementById("menu");
  const mobile = document.getElementById("mobile-nav");
  menuBtn?.addEventListener("click", () => {
    const open = mobile.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  mobile?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobile.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }),
  );

  // ---- header shadow on scroll -----------------------------------------
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  // ---- reveal on scroll -------------------------------------------------
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
  }

  // ---- hero chat: replay the conversation so the phone feels alive -----
  const chat = document.getElementById("demo-chat");
  if (chat && !reduce) {
    const nodes = Array.from(chat.children).filter((n) => !n.classList.contains("day"));
    const typing = nodes.find((n) => n.classList.contains("typing"));
    const lines = nodes.filter((n) => n !== typing);
    let i = 0;
    const show = (n) => n.classList.add("show");
    const hideAll = () => {
      lines.forEach((n) => n.classList.remove("show"));
      typing.classList.remove("show");
    };
    const step = () => {
      if (i >= lines.length) {
        setTimeout(() => {
          hideAll();
          i = 0;
          step();
        }, 5000);
        return;
      }
      const n = lines[i];
      const mine = n.classList.contains("me");
      if (mine) {
        typing.classList.remove("show");
        show(n);
        i++;
        setTimeout(() => {
          typing.classList.add("show");
          chat.scrollTop = chat.scrollHeight;
          setTimeout(step, 900 + Math.random() * 500);
        }, 350);
      } else {
        typing.classList.remove("show");
        show(n);
        i++;
        setTimeout(step, 1300 + Math.min(1400, n.textContent.length * 12));
      }
      chat.scrollTop = chat.scrollHeight;
    };
    hideAll();
    setTimeout(step, 600);
  } else if (chat) {
    chat.querySelectorAll(".msg, .card").forEach((n) => n.classList.add("show"));
  }

  function safeGet(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }
  function safeSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  }
})();
