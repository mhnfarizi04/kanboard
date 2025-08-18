const toast = (msg = "Aksi diblokir.", ms = 1400) => {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hidden"), ms);
};

document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    toast("Klik kanan dinonaktifkan.");
}, { passive: false });

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    if (e.key === "F12") {
    e.preventDefault();
    toast("DevTools diblokir.");
    return;
    }

    if (ctrlOrMeta && ["s","u","p","c","j","i"].includes(key)) {
    e.preventDefault();
    toast("Shortcut diblokir.");
    return;
    }

    if ((ctrlOrMeta && e.shiftKey && (key === "i" || key === "j"))) {
    e.preventDefault();
    toast("DevTools diblokir.");
    return;
    }
}, { passive: false });

const STRICT_DEVTOOLS_REDIRECT = false;    
const REDIRECT_URL = "https://example.com";

(function devtoolsGuard(){
    let open = false;
    const threshold = 160;
    const check = () => {
        const widthDiff  = window.outerWidth  - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        const suspected = (widthDiff > threshold) || (heightDiff > threshold);
        const start = performance.now();
        debugger;
        const lag = performance.now() - start;

        open = suspected || lag > 100;
        if (open && STRICT_DEVTOOLS_REDIRECT) {
            window.location.href = REDIRECT_URL;
        }
    };
    setInterval(check, 1200);
    window.addEventListener("resize", check);
})();

document.addEventListener("dragstart", (e) => e.preventDefault(), { passive: false });
document.addEventListener("drop",      (e) => e.preventDefault(), { passive: false });

const wm = document.getElementById("wm");
const pulse = () => {
    wm.style.opacity = (Math.sin(Date.now()/800)+2.2)/10; // 0.12–0.32
    requestAnimationFrame(pulse);
};
pulse();

document.addEventListener("copy", (e) => {
    e.preventDefault();
    toast("Menyalin dinonaktifkan.");
});