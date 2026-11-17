(() => {
  const prefix = 'wedplan:';
  const legacyPrefix = 'planparty:';
  try {
    const legacyKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(legacyPrefix)) legacyKeys.push(key);
    }
    legacyKeys.forEach(oldKey => {
      const newKey = prefix + oldKey.slice(legacyPrefix.length);
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, localStorage.getItem(oldKey));
      }
      localStorage.removeItem(oldKey);
    });
  } catch { /* Storage may be unavailable in private or restricted browser contexts. */ }

  window.WedPlanStorage = {
    get(key, fallback = []) {
      try { return JSON.parse(localStorage.getItem(`${prefix}${key}`)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`${prefix}${key}`, JSON.stringify(value)); return true; }
      catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(`${prefix}${key}`); return true; }
      catch { return false; }
    },
    /* Every key a backup carries. Add new keys here so backup, restore and "Start over" include them. */
    dataKeys: ['profile', 'tasks', 'events', 'guests', 'budgetItems', 'shopping', 'bookings', 'helpers', 'activity', 'activitySeen', 'me', 'guideHidden', 'gifts', 'vendors'],
    /* Read a backup file's text and save its lists. Returns true, or false if it isn't a WedPlan backup. */
    restore(text) {
      let backup;
      try { backup = JSON.parse(text); } catch { return false; }
      if (backup?.app !== 'WedPlan' || !backup.data?.profile) return false;
      return this.dataKeys.every(key => backup.data[key] == null || this.set(key, backup.data[key]));
    }
  };
})();
