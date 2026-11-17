/* Settings page: wedding profile summary, family circle, and saved data. */
(() => {
  const storage = window.WedPlanStorage;
  const app = window.WedPlan;
  const mount = document.querySelector('#settings');
  if (!storage || !app?.profile || !mount) return;
  const { escape, money, longDate, sideNames } = app;

  const relations = { mother: 'Mother', father: 'Father', brother: 'Brother', sister: 'Sister', brotherInLaw: 'Brother-in-law', sisterInLaw: 'Sister-in-law', uncle: 'Uncle', aunt: 'Aunt', grandparent: 'Grandparent', cousin: 'Cousin', other: 'Other' };
  const { dataKeys } = storage;
  let profile = app.profile;

  function render() {
    const family = profile.familyMembers || [];
    const familyRow = (side) => {
      const members = family.filter(member => member.side === side);
      return `<div class="family-column"><h3>${sideNames[side]} <small>${members.length}</small></h3>${members.length ? members.map(member => `<p><strong>${escape(member.name)}</strong> · ${escape(member.relationship === 'other' ? member.relationDetail : relations[member.relationship] || 'Family')}</p>`).join('') : '<p class="muted">No one added yet.</p>'}</div>`;
    };
    mount.innerHTML = `
      <section class="section-placeholder profile-card">
        <span class="placeholder-mark" aria-hidden="true">♥</span>
        <p class="eyebrow">WEDDING PROFILE</p>
        <h2>${escape(profile.brideName)} &amp; ${escape(profile.groomName)}</h2>
        <p>${escape(profile.location)} · ${profile.weddingDate ? escape(longDate(profile.weddingDate)) : 'Date not set'}</p>
        <p class="placeholder-note">${escape(sideNames[profile.planningSide] || 'Side not chosen')} planning · Budget ${escape(money(profile.budget))}</p>
      </section>
      <section class="family-manager">
        <div class="collection-heading"><div><p class="eyebrow">FAMILY CIRCLE</p><h2>${family.length} family ${family.length === 1 ? 'member' : 'members'}</h2><p>Optional: add the relatives you’re planning with.</p></div><a class="secondary-button" href="setup.html#family">${family.length ? 'Edit family' : 'Add family'}</a></div>
        <div class="family-columns">${familyRow('bride')}${familyRow('groom')}</div>
      </section>
      <section class="family-manager">
        <div class="collection-heading"><div><p class="eyebrow">YOUR SAVED DATA</p><h2>Back up or share your plan</h2><p>WedPlan saves everything in this browser. Download a backup to keep it safe, or send it to family so they can load the same plan on their device.</p></div></div>
        <div class="form-actions data-actions">
          <button class="primary-button" type="button" id="export-data"><span aria-hidden="true">↓</span> Download backup</button>
          <label class="secondary-button file-button">Load a backup<input type="file" id="import-data" accept="application/json,.json" hidden></label>
          <button class="secondary-button delete-action" type="button" id="reset-data">Start over</button>
        </div>
      </section>`;
  }

  mount.addEventListener('click', event => {
    if (event.target.closest('#export-data')) {
      const backup = { app: 'WedPlan', version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(dataKeys.map(key => [key, storage.get(key, null)])) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: `wedplan-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
      app.showToast('Backup downloaded.');
    }
    if (event.target.closest('#reset-data')) {
      if (!window.confirm('This removes your wedding profile and every list saved in this browser. Download a backup first if you want to keep it. Continue?')) return;
      dataKeys.forEach(key => storage.remove(key));
      location.href = 'setup.html';
    }
  });

  mount.addEventListener('change', async event => {
    if (event.target.id !== 'import-data') return;
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text().catch(() => '');
    event.target.value = '';
    if (!window.confirm('Loading this backup replaces the plan saved in this browser. Continue?')) return;
    if (storage.restore(text)) location.reload();
    else app.showToast('That file isn’t a WedPlan backup.');
  });

  render();
})();
