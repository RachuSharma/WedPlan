(() => {
  const storage = window.WedPlanStorage;
  const form = document.querySelector('#profile-form');
  const familyList = document.querySelector('#family-list');
  const familySummary = document.querySelector('#family-summary');
  const error = document.querySelector('#setup-error');
  if (!storage || !form || !familyList) return;

  const profile = storage.get('profile', null);
  const labels = { mother: 'Mother', father: 'Father', brother: 'Brother', sister: 'Sister', brotherInLaw: 'Brother-in-law', sisterInLaw: 'Sister-in-law', uncle: 'Uncle', aunt: 'Aunt', grandparent: 'Grandparent', cousin: 'Cousin', other: 'Other' };
  let family = Array.isArray(profile?.familyMembers) ? profile.familyMembers : [];

  if (profile) {
    document.querySelector('#bride-name').value = profile.brideName || '';
    document.querySelector('#groom-name').value = profile.groomName || '';
    document.querySelector('#wedding-date').value = profile.weddingDate || '';
    document.querySelector('#wedding-location').value = profile.location || '';
    document.querySelector('#wedding-budget').value = profile.budget || '';
    document.querySelector('#budget-currency').value = profile.currency || 'NPR';
    const side = form.querySelector(`[name="planningSide"][value="${profile.planningSide}"]`);
    if (side) side.checked = true;
  }

  /* First visit only: load a backup (from another device or from family) and go straight to the Overview */
  (function restoreFromBackup() {
    const card = document.querySelector('#setup-restore');
    const input = document.querySelector('#restore-file');
    const message = document.querySelector('#restore-error');
    if (!card || !input) return;
    if (profile) { card.hidden = true; document.querySelector('#setup-or').hidden = true; return; }
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const text = await file.text().catch(() => '');
      if (storage.restore(text)) { location.href = '../index.html'; return; }
      message.textContent = 'That file isn’t a WedPlan backup. Choose the .json file downloaded from My details.';
      message.hidden = false;
    });
  })();

  /* Show the wedding date in Bikram Sambat too, since families usually fix the saait in BS */
  (function bsHint() {
    const input = document.querySelector('#wedding-date');
    if (!input || !window.WedPlanNepali) return;
    const hint = document.createElement('small');
    hint.className = 'bs-hint';
    hint.setAttribute('aria-live', 'polite');
    input.insertAdjacentElement('afterend', hint);
    const update = () => { const bs = window.WedPlanNepali.bsLabel(input.value); hint.textContent = bs ? `In Bikram Sambat: ${bs}` : ''; };
    input.addEventListener('input', update);
    update();
  })();

  function sideGuidance(side) {
    const family = side === 'groom' ? 'groom’s' : 'bride’s';
    return `You’re planning for the ${family} family. Shopping, bookings, expenses and ceremonies will be set to this side.`;
  }
  function planningSide() { return form.querySelector('[name="planningSide"]:checked')?.value || 'bride'; }
  function addFamilyRow(member = {}) {
    const row = document.createElement('div');
    row.className = 'family-member-row';
    row.innerHTML = `<label class="setup-field">Family side<select name="familySide"><option value="bride">Bride’s side</option><option value="groom">Groom’s side</option></select></label>
      <label class="setup-field">Relationship<select name="relationship" required><option value="">Choose relation</option><option value="mother">Mother</option><option value="father">Father</option><option value="brother">Brother</option><option value="sister">Sister</option><option value="brotherInLaw">Brother-in-law</option><option value="sisterInLaw">Sister-in-law</option><option value="uncle">Uncle</option><option value="aunt">Aunt</option><option value="grandparent">Grandparent</option><option value="cousin">Cousin</option><option value="other">Other</option></select></label>
      <label class="setup-field">Name<input name="name" required maxlength="80" placeholder="Family member’s name"></label>
      <label class="setup-field other-relation" hidden>Relationship detail<input name="relationDetail" maxlength="50" placeholder="e.g. Niece, cousin"></label>
      <button class="remove-family-button" type="button" aria-label="Remove family member">Remove</button>`;
    row.querySelector('[name="familySide"]').value = member.side || (planningSide() === 'groom' ? 'groom' : 'bride');
    row.querySelector('[name="relationship"]').value = member.relationship || '';
    row.querySelector('[name="name"]').value = member.name || '';
    row.querySelector('[name="relationDetail"]' ).value = member.relationDetail || '';
    row.querySelector('[name="relationship"]').addEventListener('change', () => {
      const other = row.querySelector('.other-relation');
      other.hidden = row.querySelector('[name="relationship"]').value !== 'other';
      row.querySelector('[name="relationDetail"]').required = !other.hidden;
      updateSummary();
    });
    row.querySelectorAll('input,select').forEach(field => field.addEventListener('input', updateSummary));
    row.querySelector('.remove-family-button').addEventListener('click', () => {
      const name = row.querySelector('[name="name"]').value.trim();
      if (name && !window.confirm(`Remove ${name} from your family list?`)) return;
      row.remove(); updateSummary();
    });
    familyList.append(row);
    const other = row.querySelector('.other-relation');
    other.hidden = row.querySelector('[name="relationship"]').value !== 'other';
    row.querySelector('[name="relationDetail"]').required = !other.hidden;
    updateSummary();
  }

  function readFamilyRows() {
    return [...familyList.querySelectorAll('.family-member-row')].map(row => ({
      side: row.querySelector('[name="familySide"]').value,
      relationship: row.querySelector('[name="relationship"]').value,
      relationDetail: row.querySelector('[name="relationDetail"]').value.trim(),
      name: row.querySelector('[name="name"]').value.trim()
    })).filter(member => member.name || member.relationship);
  }
  function updateSummary() {
    const members = readFamilyRows();
    const counts = { bride: {}, groom: {} };
    members.forEach(member => {
      const relation = member.relationship === 'other' ? (member.relationDetail || 'Other') : labels[member.relationship];
      if (!relation) return;
      counts[member.side][relation] = (counts[member.side][relation] || 0) + 1;
    });
    const sideText = side => {
      const entries = Object.entries(counts[side]);
      return `${side === 'bride' ? 'Bride’s side' : 'Groom’s side'}: ${entries.length ? entries.map(([name,count]) => `${count} × ${name.toLowerCase()}`).join(' · ') : 'no one added yet'}`;
    };
    familySummary.textContent = `${members.length} ${members.length===1?'family member':'family members'} · ${sideText('bride')} · ${sideText('groom')}`;
  }

  document.querySelector('#add-family-member').addEventListener('click', () => addFamilyRow());
  form.querySelectorAll('[name="planningSide"]').forEach(input => input.addEventListener('change', () => {
    document.querySelector('#side-guidance').textContent = sideGuidance(input.value);
    familyList.querySelectorAll('.family-member-row').forEach(row => {
      const name = row.querySelector('[name="name"]').value.trim();
      const relation = row.querySelector('[name="relationship"]').value;
      if (!name && !relation) row.querySelector('[name="familySide"]').value = input.value === 'groom' ? 'groom' : 'bride';
    });
    updateSummary();
  }));
  if (profile?.planningSide === 'bride' || profile?.planningSide === 'groom') document.querySelector('#side-guidance').textContent = sideGuidance(profile.planningSide);
  /* Family members are optional: only show an empty row once the section is opened. */
  const familyCard = document.querySelector('#family');
  if (family.length) family.forEach(addFamilyRow);
  familyCard?.addEventListener('toggle', () => {
    if (familyCard.open && !familyList.querySelector('.family-member-row')) addFamilyRow();
  });
  if (familyCard && (family.length || location.hash === '#family')) familyCard.open = true;
  updateSummary();

  /* Before the browser checks required fields, drop rows the person left completely empty. */
  form.querySelector('[type="submit"]')?.addEventListener('click', () => {
    familyList.querySelectorAll('.family-member-row').forEach(row => {
      const name = row.querySelector('[name="name"]').value.trim();
      const relation = row.querySelector('[name="relationship"]').value;
      if (!name && !relation) row.remove();
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    error.hidden = true;
    const members = readFamilyRows();
    if (members.some(member => !member.name || !member.relationship || (member.relationship === 'other' && !member.relationDetail))) {
      error.textContent = 'Complete each family member’s name and relationship, or remove that row.';
      error.hidden = false;
      return;
    }
    const data = {
      brideName: document.querySelector('#bride-name').value.trim(),
      groomName: document.querySelector('#groom-name').value.trim(),
      weddingDate: document.querySelector('#wedding-date').value,
      location: document.querySelector('#wedding-location').value.trim(),
      budget: document.querySelector('#wedding-budget').value ? Number(document.querySelector('#wedding-budget').value) : null,
      currency: document.querySelector('#budget-currency').value,
      planningSide: planningSide(),
      familyMembers: members,
      updatedAt: new Date().toISOString()
    };
    if (!storage.set('profile', data)) {
      error.textContent = 'WedPlan could not save in this browser. Check your browser storage settings and try again.';
      error.hidden = false;
      return;
    }
    window.location.href = '../index.html';
  });
})();
