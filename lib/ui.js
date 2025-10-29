// lib/ui.js
// UI helpers: DOM utilities and small UI components

export const byId = id => document.getElementById(id);

export function createTPCard(i, html){
  const card = document.createElement('div');
  card.className = 'tpCard mini';
  card.id = `tpcard_${i}`;
  card.innerHTML = html;
  return card;
}

// More helpers can be added during refactor
