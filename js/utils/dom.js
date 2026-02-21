export const qs = (sel, root = document) => root.querySelector(sel);

export const setText = (id, val) => { 
  const el = document.getElementById(id); 
  if (el) el.textContent = val; 
};

export const setHTML = (id, val) => { 
  const el = document.getElementById(id); 
  if (el) el.innerHTML  = val; 
};

export const switchScreen = (toId) => {
  const current = document.querySelector('.screen.active');
  const next    = document.getElementById(toId);
  if (!next || next === current) return;

  if (current) {
    current.classList.add('exit');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('exit'), 500);
  }
  next.classList.add('active');
  next.scrollTop = 0;
};
