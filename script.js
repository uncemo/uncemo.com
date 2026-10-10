// Product name: change it here and the whole page updates (title, headings, footer).
const NAME = "Assistant";

// Small, dependency-free behaviour: name fill, theme toggle, mobile nav, scroll reveal, waitlist
// forms, and the hero chat loop.
(function () {
  const root = document.documentElement;

  // ---- product name ----------------------------------------------------
  document.querySelectorAll("[data-name]").forEach((el) => (el.textContent = NAME));
  document.title = document.title.replace(/\{name\}/g, NAME);
  const og = document.querySelector('meta[property="og:title"]');
  if (og) og.content = og.content.replace(/\{name\}/g, NAME);

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

  // ---- waitlist forms ---------------------------------------------------
  const api = (root.dataset.api || "").replace(/\/+$/, "");
  document.querySelectorAll("form.join").forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const note = form.parentElement.querySelector(".join-note");
    const btn = form.querySelector("button");
    const say = (text, cls) => {
      note.textContent = text;
      note.className = "join-note" + (cls ? " " + cls : "");
    };
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
        say("That doesn't look like an email address.", "err");
        input.focus();
        return;
      }
      if (!api) {
        say("Thanks! You're on the list.", "ok"); // no server configured: demo mode
        form.reset();
        return;
      }
      btn.disabled = true;
      say("Adding you…");
      try {
        const r = await fetch(api + "/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: location.hostname || "site", website: form.querySelector(".hp")?.value || "" }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          say(d.already ? "You're already on the list. We'll be in touch." : "You're in. We'll email you when it's your turn.", "ok");
          form.reset();
        } else {
          say(d.error || "Something went wrong. Try again in a minute.", "err");
        }
      } catch {
        say("Couldn't reach the server. Try again in a minute.", "err");
      } finally {
        btn.disabled = false;
      }
    });
  });

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
