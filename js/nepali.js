/* Nepali touches: Bikram Sambat (BS) dates and ceremony names in Devanagari.
   Loaded on every page before app.js (and before setup.js on the setup page). */
(() => {
  /* Days in each BS month (Baisakh … Chaitra), from the medic/bikram-sambat
     project data (github.com/medic/bikram-sambat, test-data/daysInMonth.json).
     BS 2078 Baisakh 1 = 14 April 2021. Dates outside this table get no BS label. */
  const firstYear = 2078;
  const startUTC = Date.UTC(2021, 3, 14);
  const monthDays = [
    [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2078
    [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2079
    [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2080
    [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2081
    [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2082
    [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2083
    [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2084
    [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2085
    [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2086
    [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30], // 2087
    [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30], // 2088
    [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2089
    [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]  // 2090
  ];
  const months = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Asoj', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  const monthsNe = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'];

  /* "2027-02-20" or a Date → { year, month (0–11), day } in BS, or null if out of range */
  function toBS(value) {
    let y, m, d;
    if (value instanceof Date) { y = value.getFullYear(); m = value.getMonth(); d = value.getDate(); }
    else {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
      if (!match) return null;
      [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
    }
    let days = Math.round((Date.UTC(y, m, d) - startUTC) / 86400000);
    if (days < 0) return null;
    for (let i = 0; i < monthDays.length; i++) {
      for (let month = 0; month < 12; month++) {
        if (days < monthDays[i][month]) return { year: firstYear + i, month, day: days + 1 };
        days -= monthDays[i][month];
      }
    }
    return null;
  }
  /* "8 Falgun 2083 BS", or '' when the date is outside the table */
  function bsLabel(value, { year = true } = {}) {
    const bs = toBS(value);
    return bs ? `${bs.day} ${months[bs.month]}${year ? ` ${bs.year}` : ''} BS` : '';
  }

  /* Traditional ceremony names in Devanagari, shown under the English name */
  const ceremonyNames = {
    'engagement & tika talo': 'सगाई र टीका टालो', 'engagement (sagai)': 'सगाई', 'engagement': 'सगाई', 'sagai': 'सगाई',
    'haldi & mehendi': 'हल्दी र मेहेन्दी', 'mehendi': 'मेहेन्दी', 'haldi': 'हल्दी', 'tika talo': 'टीका टालो', 'tilak': 'टीका टालो',
    'janti prasthan': 'जन्ती प्रस्थान', 'swagat': 'स्वागत', 'swayamvar': 'स्वयम्बर',
    'kanyadaan': 'कन्यादान', 'sindoor halne & pote': 'सिन्दूर हाल्ने र पोते', 'saptapadi': 'सप्तपदी',
    'bidaai': 'बिदाइ', 'ghar bhitryaune': 'घर भित्र्याउने', 'mukh herne': 'मुख हेर्ने',
    'reception (bhoj)': 'भोज', 'reception': 'भोज', 'bhoj': 'भोज',
    'saipata (sagun)': 'साइपाटा', 'saipata': 'साइपाटा', 'purbanga (nandi puja)': 'पूर्वाङ्ग (नान्दी पूजा)', 'purbanga': 'पूर्वाङ्ग',
    'ratyauli': 'रत्यौली', 'dhoka chhekne': 'ढोका छेक्ने', 'duran (dwiragaman)': 'दुरन (द्विरागमन)', 'duran': 'दुरन'
  };
  const ceremonyName = name => ceremonyNames[String(name || '').trim().toLowerCase()] || '';

  window.WedPlanNepali = { toBS, bsLabel, ceremonyName, months, monthsNe };
})();
