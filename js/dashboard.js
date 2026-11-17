/* Overview page: reminders and upcoming ceremonies.
   The "Coming up next" task list is filled by tasks.js. */
(() => {
  const app = window.WedPlan;
  if (!app?.profile) return;
  const { escape, list, dateLabel, daysUntil } = app;
  const storage = window.WedPlanStorage;

  /* "Start here": three first steps for a new plan, so an empty Overview isn't a blank page.
     The next step is highlighted; it disappears once all three are done or it's hidden. */
  function renderGuide() {
    const node = document.querySelector('#start-guide');
    if (!node) return;
    const hasPerson = key => list(key).some(item => item.responsible);
    const steps = [
      { done: list('events').length > 0, title: 'Choose your ceremonies', text: 'Pick Tilak, Swayamvar, Bidaai and the others your families will celebrate. Their rituals come with them.', href: 'pages/events.html', cta: 'Choose ceremonies' },
      { done: list('guests').length > 0, title: 'Add your guests', text: 'Start with close family. You can add the rest little by little.', href: 'pages/guests.html', cta: 'Add guests' },
      { done: list('helpers').length > 0 || hasPerson('shopping') || hasPerson('bookings'), title: 'Share out the work', text: 'Ask family to help: someone for the gifts, someone for the pandit’s puja items, someone for the guests.', href: 'pages/helpers.html', cta: 'Hand out duties' }
    ];
    const doneCount = steps.filter(step => step.done).length;
    if (storage?.get('guideHidden', false) || doneCount === steps.length) { node.hidden = true; return; }
    const next = steps.findIndex(step => !step.done);
    node.hidden = false;
    node.innerHTML = `<div class="start-guide-head"><div><p class="eyebrow">START HERE</p><h2 id="start-guide-title">Three small steps to begin</h2><p>${doneCount ? `${doneCount} of ${steps.length} done. Lovely.` : 'Do them in any order. Each one takes a few minutes.'}</p></div></div>
      <ol class="start-steps">${steps.map((step, i) => `<li class="start-step${step.done ? ' is-done' : ''}${i === next ? ' is-next' : ''}">
        <span class="start-step-mark" aria-hidden="true">${step.done ? '✓' : i + 1}</span>
        <div class="start-step-copy"><strong>${step.title}${step.done ? '<span class="visually-hidden"> (done)</span>' : ''}</strong><p>${step.text}</p></div>
        ${step.done ? '' : i === next ? `<a class="primary-button" href="${step.href}">${step.cta}</a>` : `<a class="start-step-link" href="${step.href}">${step.cta} <span aria-hidden="true">→</span></a>`}
      </li>`).join('')}</ol>
      <div class="start-guide-foot"><button class="text-button" type="button" data-guide="hide">Hide this guide</button></div>`;
  }
  document.querySelector('#start-guide')?.addEventListener('click', event => {
    if (!event.target.closest('[data-guide="hide"]')) return;
    storage?.set('guideHidden', true);
    renderGuide();
    app.showToast('Guide hidden.', { label: 'Undo', run: () => { storage?.remove('guideHidden'); renderGuide(); } });
  });

  function renderEvents() {
    const upcoming = list('events')
      .filter(event => event.date && daysUntil(event.date) >= 0 && event.status !== 'done')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    const unscheduled = list('events').filter(event => !event.date).length;
    const node = document.querySelector('#upcoming-events');
    node.innerHTML = upcoming.length
      ? upcoming.map(event => `<a class="record-card mini" href="pages/events.html"><div class="record-card-main"><strong>${escape(event.name)}</strong><p>${escape(app.withBS(dateLabel(event.date), event.date))}${event.location ? ` · ${escape(event.location)}` : ''}</p></div><span class="days-badge">${daysUntil(event.date) === 0 ? 'Today' : `${daysUntil(event.date)} days`}</span></a>`).join('')
        + (unscheduled ? `<p class="panel-note">${unscheduled} more ${unscheduled === 1 ? 'ceremony needs' : 'ceremonies need'} a date.</p>` : '')
      : `<div class="dashboard-empty-task">${unscheduled ? `${unscheduled} ${unscheduled === 1 ? 'ceremony is' : 'ceremonies are'} waiting for a date.` : 'No ceremonies yet. Add Tilak, Swayamvar, Bidaai and more from Ceremonies.'}</div>`;
  }

  function renderAttention() {
    const items = app.reminders();
    const node = document.querySelector('#attention-list');
    node.innerHTML = items.length
      ? items.slice(0, 5).map(item => `<a class="record-card mini attention-${item.level}" href="${escape(item.href)}"><span class="attention-icon" aria-hidden="true">${item.level === 'warning' ? '!' : item.level === 'soon' ? '◷' : '✦'}</span><div class="record-card-main"><strong>${escape(item.text)}</strong><p>${escape(item.detail)}</p></div></a>`).join('')
      : '<div class="dashboard-empty-task">Nothing urgent. Enjoy this moment. ♥</div>';
  }

  /* Progress: how much is done across tasks, rituals, shopping, bookings and helpers */
  function renderProgress() {
    const node = document.querySelector('#progress-overview');
    if (!node) return;
    const mine = key => list(key).filter(item => (item.side || app.mySide) === app.mySide);
    const tasks = list('tasks');
    const tasksDone = tasks.filter(task => task.completed).length;
    const events = list('events');
    const rituals = events.flatMap(event => Array.isArray(event.rituals) ? event.rituals : []);
    const ritualsDone = rituals.filter(ritual => ritual.done).length;
    const guests = list('guests');
    const people = status => guests.filter(guest => !status || guest.status === status).reduce((sum, guest) => sum + (Number(guest.people) || 1), 0);
    const shopping = mine('shopping');
    const bookings = mine('bookings');
    const helpers = mine('helpers');
    const doneCount = shopping.filter(item => item.status === 'bought').length + bookings.filter(item => item.status === 'booked').length + helpers.filter(item => item.status === 'confirmed').length;

    const total = tasks.length + rituals.length + shopping.length + bookings.length + helpers.length;
    const done = tasksDone + ritualsDone + doneCount;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const cheer = !total ? 'Your journey starts here'
      : percent === 100 ? 'Everything is ready. ♥'
      : percent >= 75 ? 'Almost there'
      : percent >= 40 ? 'Lovely progress'
      : percent > 0 ? 'A wonderful start'
      : 'Every journey begins with one step';

    /* Pace check against the planning fallacy: everyone thinks there's more time than there is.
       Spreads what's left over the weeks before the wedding and says calmly whether that's fine. */
    const left = total - done;
    const daysLeft = app.profile?.weddingDate ? daysUntil(app.profile.weddingDate) : null;
    let pace = '';
    if (left > 0 && daysLeft != null && daysLeft >= 0) {
      const weeks = Math.max(daysLeft / 7, 1);
      const perWeek = Math.ceil(left / weeks);
      const things = `${left} ${left === 1 ? 'thing' : 'things'} left, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`;
      const level = perWeek <= 5 ? 'ok' : perWeek <= 12 ? 'busy' : 'tight';
      const advice = { ok: 'You’re on track.', busy: 'A busy pace, but doable.', tight: 'That’s tight. Share some out to family.' }[level];
      pace = `<p class="pace-line pace-${level}"><span class="pace-dot" aria-hidden="true"></span><span><strong>${advice}</strong> ${things}: about ${perWeek} a week.${level === 'tight' ? ' <a href="pages/helpers.html">Hand out duties →</a>' : ''}</span></p>`;
    }

    const budget = app.profile?.budget;
    const planned = app.costTotals().total;
    const budgetUse = budget ? Math.round((planned / budget) * 100) : null;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const card = (href, label, value, of, foot, share, extra = '') => `<a class="stat-card progress-card${extra}" href="${href}">
      <span class="stat-label">${label}</span>
      <p class="stat-value">${value}${of ? ` <small>${of}</small>` : ''}</p>
      <span class="journey-track" aria-hidden="true"><span style="width:${Math.min(share, 100)}%"></span></span>
      <p class="stat-foot">${foot}</p>
    </a>`;

    node.innerHTML = `<article class="panel progress-summary">
        <div class="progress-ring" style="background: conic-gradient(var(--brand) 0 ${percent}%, var(--surface-soft) ${percent}% 100%)" role="img" aria-label="${percent}% of planning done"><div class="ring-inner"><strong>${percent}%</strong><small>done</small></div></div>
        <div class="focus-copy"><strong>${cheer}</strong><p>${total ? `${done} of ${total} things are done across your tasks, rituals, shopping, bookings and helpers.` : 'Add ceremonies, tasks and lists, and your progress will show here.'}</p>${pace}</div>
      </article>
      <div class="stats-grid progress-grid">
        ${card('pages/tasks.html', 'Tasks done', tasksDone, `of ${tasks.length}`, tasks.length ? `${tasks.length - tasksDone} still to do` : 'No tasks yet', pct(tasksDone, tasks.length))}
        ${card('pages/events.html', 'Rituals ready', ritualsDone, `of ${rituals.length}`, `Across ${events.length} ${events.length === 1 ? 'ceremony' : 'ceremonies'}`, pct(ritualsDone, rituals.length))}
        ${card('pages/guests.html', 'Guests confirmed', people('confirmed'), `of ${people()}`, guests.length ? `${people('notSent')} not invited yet` : 'No guests yet', pct(people('confirmed'), people()))}
        ${card('pages/budget.html', 'Budget planned', budgetUse == null ? '—' : `${budgetUse}%`, '', budget ? `${escape(app.money(planned))} of ${escape(app.money(budget))}` : 'Set a budget in your profile', budgetUse || 0, budgetUse > 100 ? ' is-over' : '')}
      </div>`;
  }

  /* After the wedding: the countdown becomes "days married", and the moments written on each ceremony are collected here */
  function renderAfterWedding() {
    const date = app.profile?.weddingDate;
    const married = date && daysUntil(date) < 0;
    if (married) {
      const days = -daysUntil(date);
      const banner = document.querySelector('.wedding-banner');
      const countdown = document.querySelector('[data-countdown]');
      document.querySelector('[data-days-remaining]').textContent = days;
      countdown?.querySelector('span') && (countdown.querySelector('span').textContent = days === 1 ? 'day married' : 'days married');
      countdown?.setAttribute('aria-label', `Married for ${days} ${days === 1 ? 'day' : 'days'}`);
      banner?.setAttribute('aria-label', 'Married');
      if (banner) {
        banner.querySelector('.banner-kicker').textContent = 'Happily married ♥';
        banner.querySelector('h2').textContent = 'Your journey together has begun.';
        banner.querySelector('.banner-copy > p:not([class])').textContent = 'Thank you for letting WedPlan be part of it.';
      }
    }
    const section = document.querySelector('#memories-section');
    if (!section) return;
    const moments = list('events').filter(event => event.memory).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    section.hidden = !moments.length && !married;
    const ne = name => window.WedPlanNepali?.ceremonyName(name) || '';
    document.querySelector('#memories-list').innerHTML = moments.length
      ? moments.map(event => `<blockquote class="memory-quote"><span class="memory-mark" aria-hidden="true">♥</span><span><small>${escape(event.name)}${ne(event.name) ? ` · <span lang="ne">${escape(ne(event.name))}</span>` : ''}${event.date ? ` · ${escape(app.withBS(dateLabel(event.date), event.date))}` : ''}</small>${escape(event.memory)}</span></blockquote>`).join('')
      : '<div class="dashboard-empty-task">Write down a moment from each ceremony on the <a href="pages/events.html">Ceremonies</a> page, while it’s still fresh.</div>';
  }

  renderGuide();
  renderAfterWedding();
  renderProgress();
  renderEvents();
  renderAttention();
  // tasks.js updates the task list when a task is ticked; refresh reminders and progress too.
  document.querySelector('#task-list')?.addEventListener('change', () => window.setTimeout(() => { renderAttention(); renderProgress(); }, 0));
})();
