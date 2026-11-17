/* Shared behaviour for every WedPlan page: navigation, toast messages,
   profile details, helper functions and reminders. */
(() => {
  const storage = window.WedPlanStorage;
  const root = document.body.dataset.root || './';

  /* ---------- Helpers used by the page scripts ---------- */
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const uid = prefix => window.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const toDate = value => new Date(`${value}T12:00:00`);
  const dateLabel = value => value
    ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(toDate(value))
    : 'No date yet';
  const longDate = value => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(value));
  const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const daysUntil = value => Math.round((toDate(value) - toDate(todayISO())) / 86400000);
  const profile = storage?.get('profile', null);
  const money = (amount, currency = profile?.currency || 'NPR') => amount == null || amount === '' || Number.isNaN(Number(amount))
    ? 'Not set'
    : `${currency} ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)}`;
  const sideNames = { bride: 'Bride’s side', groom: 'Groom’s side' };
  // The family being planned for. Bride and groom are separate families, so there is no "both".
  const mySide = profile?.planningSide === 'groom' ? 'groom' : 'bride';
  const list = key => { const saved = storage?.get(key, []); return Array.isArray(saved) ? saved : []; };
  const sumAmounts = items => items.filter(item => (item.side || mySide) === mySide).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  // Every planned cost: expenses plus the prices on the Shopping and Bookings pages
  const costTotals = () => {
    const expenses = sumAmounts(list('budgetItems'));
    const shopping = sumAmounts(list('shopping'));
    const bookings = sumAmounts(list('bookings'));
    return { expenses, shopping, bookings, total: expenses + shopping + bookings };
  };

  /* ---------- Toast ---------- */
  /* An optional action button (e.g. Undo) keeps the toast up longer so there's time to tap it. */
  const toast = document.querySelector('#toast');
  let toastTimer;
  function hideToast() { toast?.classList.remove('show', 'has-action'); }
  function showToast(message, action) {
    if (!toast) return;
    toast.textContent = '';
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(text);
    toast.classList.toggle('has-action', Boolean(action));
    if (action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toast-action';
      button.textContent = action.label;
      button.addEventListener('click', () => { hideToast(); action.run(); });
      toast.append(button);
    }
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, action ? 6000 : 2600);
  }
  // Don't close an Undo toast while someone is reaching for it
  toast?.addEventListener('pointerenter', () => { if (toast.classList.contains('has-action')) window.clearTimeout(toastTimer); });
  toast?.addEventListener('focusin', () => window.clearTimeout(toastTimer));
  toast?.addEventListener('pointerleave', () => { if (toast.classList.contains('has-action')) toastTimer = window.setTimeout(hideToast, 3000); });

  /* ---------- Celebrate a finished milestone: marigold and rose petals fall ----------
     Skipped for people who ask for reduced motion; they still get the message. */
  function celebrate(message, action) {
    if (message) showToast(message, action);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.querySelector('.petal-shower')) return;
    const shower = document.createElement('div');
    shower.className = 'petal-shower';
    shower.setAttribute('aria-hidden', 'true');
    const colours = ['#f0a020', '#f5c242', '#e2541b', '#b3141c', '#f08a8a'];
    shower.innerHTML = Array.from({ length: 28 }, (_, i) => {
      const style = `left:${Math.random() * 100}%;background:${colours[i % colours.length]};animation-delay:${(Math.random() * 0.7).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.2).toFixed(2)}s;--drift:${Math.round(Math.random() * 120 - 60)}px;--spin:${Math.round(Math.random() * 540 + 180)}deg`;
      return `<i class="petal" style="${style}"></i>`;
    }).join('');
    document.body.append(shower);
    window.setTimeout(() => shower.remove(), 3800);
  }

  /* Bikram Sambat date next to the AD date, e.g. "Sat, Feb 20 · 8 Falgun 2083 BS" */
  const bsLabel = (value, options) => window.WedPlanNepali?.bsLabel(value, options) || '';
  const withBS = (adText, value) => { const bs = bsLabel(value); return bs ? `${adText} · ${bs}` : adText; };

  /* ---------- Responsible person: is anyone working on it? ----------
     A Shopping or Bookings item with a responsible person "stalls" when its status
     hasn't moved for a while: 7 days, or 3 days once the wedding is under a month away. */
  const workLabels = { toBuy: 'To buy', ordered: 'Ordered', bought: 'Bought', toBook: 'To book', talking: 'In talks', booked: 'Booked' };
  const doneStatus = { shopping: 'bought', bookings: 'booked' };
  const DAY = 86400000;
  function progress(item, key) {
    if (!item.responsible || item.status === doneStatus[key]) return null;
    const since = item.progressAt || item.updatedAt;
    const idleDays = since ? Math.floor((Date.now() - new Date(since)) / DAY) : 0;
    const weddingIn = profile?.weddingDate ? daysUntil(profile.weddingDate) : null;
    const limit = weddingIn != null && weddingIn <= 30 ? 3 : 7;
    const nudges = (item.nudges || []).filter(nudge => !since || nudge.at > since);
    return { idleDays, limit, stalled: idleDays >= limit, nudged: nudges.length ? nudges[nudges.length - 1] : null, statusText: workLabels[item.status] || 'Not started' };
  }
  function reminderMessage(item, key) {
    const info = progress(item, key);
    const weddingIn = profile?.weddingDate ? daysUntil(profile.weddingDate) : null;
    const what = key === 'shopping' ? 'buying' : 'booking';
    return `Hi ${item.responsible}, a gentle reminder from the wedding planning: “${item.name}” is still ${info ? `“${info.statusText}”` : 'pending'}${info && info.idleDays ? ` (no update for ${info.idleDays} ${info.idleDays === 1 ? 'day' : 'days'})` : ''}. You’re looking after ${what} this.${weddingIn != null && weddingIn >= 0 ? ` The wedding is in ${weddingIn} ${weddingIn === 1 ? 'day' : 'days'}.` : ''} Please update when you can. Thank you!`;
  }

  /* ---------- Updates feed: bought, status, cost, person, added, removed ----------
     Saved under "activity" so anyone opening WedPlan here sees what changed. */
  const whoAmI = () => storage?.get('me', '') || '';
  function notify(entry) {
    if (!storage) return;
    const feed = list('activity');
    const item = { id: uid('activity'), at: new Date().toISOString(), by: whoAmI(), ...entry };
    storage.set('activity', [item, ...feed].slice(0, 100));
    window.dispatchEvent(new CustomEvent('wedplan:activity'));
  }

  /* ---------- Reminders: things that need attention soon ---------- */
  function reminders() {
    const items = [];
    list('tasks').filter(task => !task.completed && task.dueDate).forEach(task => {
      const days = daysUntil(task.dueDate);
      if (days < 0) items.push({ level: 'warning', text: `“${task.title}” is overdue`, detail: `Was due ${dateLabel(task.dueDate)}`, href: 'pages/tasks.html' });
      else if (days <= 3) items.push({ level: 'soon', text: `“${task.title}” is due ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`, detail: task.assignee ? `With ${task.assignee}` : 'Task', href: 'pages/tasks.html' });
    });
    list('events').filter(event => event.date && event.status !== 'done').forEach(event => {
      const days = daysUntil(event.date);
      const ritualsLeft = (event.rituals || []).filter(ritual => !ritual.done).length;
      const detail = [event.location || 'Ceremony', ritualsLeft && `${ritualsLeft} ${ritualsLeft === 1 ? 'ritual' : 'rituals'} still to prepare`].filter(Boolean).join(' · ');
      if (days >= 0 && days <= 14) items.push({ level: 'soon', text: `${event.name} is ${days === 0 ? 'today' : `in ${days} ${days === 1 ? 'day' : 'days'}`}`, detail, href: 'pages/events.html' });
    });
    list('budgetItems').filter(item => item.status === 'due' && (item.side || mySide) === mySide).forEach(item => {
      items.push({ level: 'warning', text: `Payment due: ${item.name}`, detail: money(item.amount), href: 'pages/budget.html' });
    });
    if (profile?.budget) {
      const planned = costTotals().total;
      if (planned > profile.budget) items.push({ level: 'warning', text: 'Planned costs are over your budget', detail: `${money(planned - profile.budget)} over`, href: 'pages/budget.html' });
    }
    // Responsible people: reminders sent by family, and items with no progress
    [['shopping', 'Shopping'], ['bookings', 'Bookings']].forEach(([key, label]) => {
      list(key).filter(item => (item.side || mySide) === mySide).forEach(item => {
        const info = progress(item, key);
        if (!info) return;
        const href = `pages/${key}.html`;
        if (info.nudged) items.push({ level: 'soon', text: `Reminder for ${item.responsible}: “${item.name}”`, detail: `${label} · still ${info.statusText}`, href });
        else if (info.stalled) items.push({ level: 'warning', text: `${item.responsible} hasn’t updated “${item.name}”`, detail: `${label} · ${info.statusText} for ${info.idleDays} days`, href });
      });
    });
    const pendingGuests = list('guests').filter(guest => guest.status === 'notSent').length;
    if (pendingGuests) items.push({ level: 'info', text: `${pendingGuests} ${pendingGuests === 1 ? 'invitation' : 'invitations'} not sent yet`, detail: 'Guests', href: 'pages/guests.html' });
    return items;
  }

  /* ---------- One-time moves so older saved data fits the current pages ----------
     Vendors -> Bookings, Gifts -> Shopping, and "to book" items in Shopping -> Bookings. */
  (function moveOldLists() {
    if (!storage) return;
    const now = new Date().toISOString();
    const bookingStatus = { bought: 'booked', booked: 'booked', ordered: 'talking', contacted: 'talking' };
    const toBooking = (item, extra = {}) => ({ id: item.id || uid('bookings'), name: item.name, occasion: item.occasion || 'general', contact: item.contact || '', side: item.side || mySide, amount: item.amount ?? null, status: bookingStatus[item.status] || 'toBook', notes: item.notes || '', updatedAt: now, ...extra });
    const vendors = list('vendors');
    const gifts = list('gifts');
    const shopping = list('shopping');
    const bookItems = shopping.filter(item => item.type === 'book');
    if (!vendors.length && !gifts.length && !bookItems.length && !shopping.some(item => 'type' in item)) return;

    const bookings = [
      ...list('bookings'),
      ...bookItems.map(item => toBooking(item)),
      ...vendors.map(item => toBooking(item, { notes: [item.category, item.notes].filter(Boolean).join(' · ') }))
    ];
    const keptShopping = [
      ...shopping.filter(item => item.type !== 'book').map(({ type, ...item }) => item),
      ...gifts.map(item => ({ id: item.id || uid('shopping'), name: item.name, occasion: 'general', quantity: null, side: item.side || mySide, amount: item.amount ?? null, status: item.status === 'planned' ? 'toBuy' : 'bought', notes: [item.recipient && `Gift for ${item.recipient}`, item.notes].filter(Boolean).join(' · '), updatedAt: now }))
    ];
    if (storage.set('bookings', bookings) && storage.set('shopping', keptShopping)) {
      storage.remove('vendors');
      storage.remove('gifts');
    }
  })();

  /* One-time cleanup: married / unmarried status is no longer collected */
  (function dropMaritalStatus() {
    if (!storage || !profile?.familyMembers?.some(member => 'maritalStatus' in member)) return;
    profile.familyMembers = profile.familyMembers.map(({ maritalStatus, ...member }) => member);
    storage.set('profile', profile);
  })();

  /* One-time move: records saved as "Both families" now belong to the planning side */
  (function dropBothSide() {
    if (!storage || !profile || (profile.planningSide !== 'bride' && profile.planningSide !== 'groom')) return;
    ['events', 'budgetItems', 'shopping', 'bookings'].forEach(key => {
      const items = list(key);
      if (!items.some(item => item.side === 'both')) return;
      storage.set(key, items.map(item => item.side === 'both' ? { ...item, side: mySide } : item));
    });
  })();

  window.WedPlan = { showToast, celebrate, bsLabel, withBS, escape, uid, dateLabel, longDate, daysUntil, money, sideNames, mySide, progress, reminderMessage, notify, list, costTotals, reminders, root, profile };

  /* ---------- Mobile navigation ---------- */
  const sidebar = document.querySelector('#sidebar');
  const menuButton = document.querySelector('#menu-button');
  const scrim = document.querySelector('#scrim');
  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    scrim.classList.toggle('visible', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  if (menuButton && sidebar && scrim) {
    menuButton.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
    scrim.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  }

  /* ---------- Phones and tablets: tab bar along the bottom, in thumb reach ----------
     Built from the sidebar links so icons and counts stay in one place.
     The four most-used pages get a tab; "More" opens the full sidebar. */
  (function bottomTabs() {
    if (!sidebar || !scrim) return;
    const tabPages = ['index.html', 'events.html', 'tasks.html', 'guests.html'];
    const shortNames = { Overview: 'Home' };
    const links = tabPages.map(page => sidebar.querySelector(`.sidebar-nav a[href$="${page}"]`)).filter(Boolean);
    if (!links.length) return;
    const onTab = links.some(link => link.classList.contains('active'));
    const tabHtml = link => {
      const label = link.querySelector('span')?.textContent.trim() || '';
      const count = link.querySelector('[data-nav-count]')?.dataset.navCount;
      return `<a class="tab-link${link.classList.contains('active') ? ' active' : ''}" href="${link.getAttribute('href')}"${link.classList.contains('active') ? ' aria-current="page"' : ''}>
        <span class="tab-icon">${link.querySelector('svg')?.outerHTML || ''}${count ? `<i class="tab-count" data-nav-count="${count}" hidden></i>` : ''}</span><span class="tab-label">${shortNames[label] || label}</span></a>`;
    };
    const bar = document.createElement('nav');
    bar.className = 'tab-bar';
    bar.setAttribute('aria-label', 'Quick navigation');
    bar.innerHTML = links.map(tabHtml).join('') + `<button class="tab-link${onTab ? '' : ' active'}" type="button" data-tab-more aria-expanded="false" aria-controls="sidebar">
        <span class="tab-icon"><svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></span><span class="tab-label">More</span></button>`;
    document.body.append(bar);
    document.body.classList.add('has-tab-bar');
    const more = bar.querySelector('[data-tab-more]');
    more.addEventListener('click', () => {
      const open = !sidebar.classList.contains('open');
      setMenu(open);
      more.setAttribute('aria-expanded', String(open));
    });
    scrim.addEventListener('click', () => more.setAttribute('aria-expanded', 'false'));
  })();

  /* ---------- First visit: send people to set up their wedding ---------- */
  const isSetupPage = location.pathname.endsWith('/setup.html');
  // Also ask again if an older profile was saved as "Both families", so a side gets chosen
  const sideChosen = profile?.planningSide === 'bride' || profile?.planningSide === 'groom';
  if ((!profile || !sideChosen) && !isSetupPage) {
    location.replace(`${root}pages/setup.html`);
    return;
  }

  /* ---------- Fill in the couple's details ---------- */
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  // The BS part stays on one line, so a narrow screen wraps it as a whole
  const todayBS = bsLabel(new Date());
  document.querySelectorAll('[data-current-date]').forEach(node => { node.innerHTML = `${escape(today)}${todayBS ? ` <span class="bs-inline">· ${escape(todayBS)}</span>` : ''}`; });
  if (!profile) return;

  const couple = `${profile.brideName} & ${profile.groomName}`;
  const initial = profile.brideName?.trim().charAt(0).toUpperCase() || 'W';
  document.querySelectorAll('[data-couple-names]').forEach(node => { node.textContent = couple; });
  document.querySelectorAll('[data-profile-avatar]').forEach(node => { node.textContent = initial; });
  const firstName = name => (name || '').trim().split(/\s+/)[0];
  document.querySelectorAll('[data-couple-first]').forEach(node => { node.textContent = `${firstName(profile.brideName)} & ${firstName(profile.groomName)}`; });
  document.querySelectorAll('[data-wedding-date-short]').forEach(node => {
    if (profile.weddingDate) node.textContent = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(toDate(profile.weddingDate));
  });

  /* Sidebar counts: how many things are still open */
  const openCounts = {
    tasks: list('tasks').filter(task => !task.completed).length,
    shopping: list('shopping').filter(item => item.status !== 'bought').length,
    bookings: list('bookings').filter(item => item.status !== 'booked').length,
    helpers: list('helpers').filter(item => (item.side || mySide) === mySide && item.status !== 'confirmed').length
  };
  document.querySelectorAll('[data-nav-count]').forEach(node => {
    const value = openCounts[node.dataset.navCount];
    node.hidden = !value;
    node.textContent = value || '';
    node.setAttribute('aria-label', `${value} open`);
  });
  document.querySelectorAll('[data-wedding-location]').forEach(node => { node.textContent = profile.location || 'Location'; });
  document.querySelectorAll('[data-wedding-date]').forEach(node => { if (profile.weddingDate) node.textContent = withBS(longDate(profile.weddingDate), profile.weddingDate); });

  const daysNode = document.querySelector('[data-days-remaining]');
  if (daysNode && profile.weddingDate) {
    const days = Math.max(0, daysUntil(profile.weddingDate));
    daysNode.textContent = days;
    document.querySelector('[data-countdown]')?.setAttribute('aria-label', `${days} days until the wedding`);
  }

  /* ---------- Notifications: the bell opens reminders + recent updates ---------- */
  const reminderButton = document.querySelector('#reminder-button');
  const ago = iso => {
    const mins = Math.round((Date.now() - new Date(iso)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'yesterday' : days < 7 ? `${days} days ago` : dateLabel(iso.slice(0, 10));
  };
  const kindIcon = { thanks: '🙏', done: '✓', status: '↻', cost: '₨', person: '👤', added: '＋', removed: '−', reminder: '🔔', edit: '✎' };
  const unreadCount = () => { const seen = storage?.get('activitySeen', '') || ''; return list('activity').filter(item => item.at > seen).length; };
  function people() {
    const couple = mySide === 'groom' ? profile?.groomName : profile?.brideName;
    return [...new Set([couple, ...(profile?.familyMembers || []).filter(member => member.side === mySide).map(member => member.name)].filter(Boolean))];
  }
  function updateBell() {
    if (!reminderButton) return;
    const attention = reminders().length;
    const unread = unreadCount();
    reminderButton.querySelector('i').hidden = attention + unread === 0;
    const parts = [unread && `${unread} new ${unread === 1 ? 'update' : 'updates'}`, attention && `${attention} ${attention === 1 ? 'reminder' : 'reminders'}`].filter(Boolean);
    reminderButton.setAttribute('aria-label', parts.length ? `Notifications: ${parts.join(', ')}` : 'Notifications');
    reminderButton.title = parts.length ? parts.join(' · ') : 'All caught up';
  }
  let panel = null;
  function panelHtml() {
    const seen = storage?.get('activitySeen', '') || '';
    const attention = reminders();
    const feed = list('activity').slice(0, 30);
    const me = whoAmI();
    const names = people();
    return `<div class="notify-head"><h2>Notifications</h2><button type="button" class="close-form" data-notify="close" aria-label="Close notifications">×</button></div>
      ${attention.length ? `<p class="notify-subhead">Needs attention</p><ul class="notify-list">${attention.slice(0, 5).map(item => `<li><a class="notify-item attention-${item.level}" href="${escape(root + item.href)}"><span class="notify-icon" aria-hidden="true">${item.level === 'warning' ? '!' : '◷'}</span><span><strong>${escape(item.text)}</strong><small>${escape(item.detail)}</small></span></a></li>`).join('')}</ul>` : ''}
      <p class="notify-subhead">Recent updates</p>
      ${feed.length ? `<ul class="notify-list">${feed.map(item => `<li><a class="notify-item${item.at > seen ? ' unread' : ''}" href="${escape(root + item.href)}"><span class="notify-icon kind-${escape(item.kind)}" aria-hidden="true">${kindIcon[item.kind] || '•'}</span><span><strong>${escape(item.title)}</strong> ${escape(item.text)}<small>${escape(item.section)} · ${escape(ago(item.at))}${item.by ? ` · by ${escape(item.by)}` : ''}</small></span></a></li>`).join('')}</ul>` : '<p class="notify-empty">No updates yet. When something is bought, booked, priced or changed, it shows up here.</p>'}
      <label class="notify-me">Updates from this device are by<select data-notify="me"><option value="">Not set</option>${names.map(name => `<option${name === me ? ' selected' : ''}>${escape(name)}</option>`).join('')}${me && !names.includes(me) ? `<option selected>${escape(me)}</option>` : ''}</select></label>`;
  }
  function openPanel() {
    panel = document.createElement('section');
    panel.className = 'notify-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Notifications');
    panel.innerHTML = panelHtml();
    document.body.appendChild(panel);
    reminderButton.setAttribute('aria-expanded', 'true');
    // Opening the panel marks every update as seen
    storage?.set('activitySeen', new Date().toISOString());
    updateBell();
    panel.querySelector('[data-notify="close"]').focus();
    panel.addEventListener('click', event => { if (event.target.closest('[data-notify="close"]')) closePanel(); });
    panel.addEventListener('change', event => {
      if (event.target.dataset.notify === 'me') { storage?.set('me', event.target.value); showToast(event.target.value ? `Your updates will show “by ${event.target.value}”.` : 'Name cleared.'); }
    });
  }
  function closePanel() {
    panel?.remove();
    panel = null;
    reminderButton?.setAttribute('aria-expanded', 'false');
  }
  if (reminderButton) {
    reminderButton.setAttribute('aria-haspopup', 'dialog');
    reminderButton.setAttribute('aria-expanded', 'false');
    reminderButton.addEventListener('click', event => { event.preventDefault(); panel ? closePanel() : openPanel(); });
    document.addEventListener('click', event => { if (panel && !panel.contains(event.target) && !reminderButton.contains(event.target)) closePanel(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel) { closePanel(); reminderButton.focus(); } });
    window.addEventListener('wedplan:activity', () => { updateBell(); if (panel) panel.innerHTML = panelHtml(); });
    // Another tab on this device changed something
    window.addEventListener('storage', event => { if (event.key && event.key.startsWith('wedplan:')) updateBell(); });
    updateBell();
  }
})();
