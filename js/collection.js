/* Add, edit, filter and remove records for the list pages:
   Events & Rituals, Guests, Budget, Shopping, Gifts & Exchange and Vendors.
   Each page has <div id="collection" data-collection="..."> and this script fills it. */
(() => {
  const storage = window.WedPlanStorage;
  const app = window.WedPlan;
  const mount = document.querySelector('#collection');
  if (!storage || !app || !mount) return;
  const { escape, uid, dateLabel, money, sideNames } = app;

  /* Bride and groom are separate families, so every record belongs to one side.
     Presets marked 'both' below are shared items: they go to the side you're planning for. */
  const familySides = [['bride', 'Bride’s side'], ['groom', 'Groom’s side']];
  const sides = familySides;
  const mySide = app.mySide;
  const ownSide = side => side === 'bride' || side === 'groom' ? side : mySide;
  // Records with no side saved yet count as yours
  const isMine = item => (item.side || mySide) === mySide;

  /* ---------- Suggestion lists ---------- */

  /* Traditional Nepali wedding ceremonies: [name, hosted by, about] */
  const ceremonies = [
    ['Engagement (Sagai)', 'both', 'The couple exchange rings in front of both families.'],
    ['Mehendi', 'bride', 'Henna for the bride, with songs and dancing among family.'],
    ['Haldi', 'both', 'Turmeric paste blessing for the bride and groom.'],
    ['Tilak', 'bride', 'Bride’s family visits the groom’s home with tilak, gifts and blessings.'],
    ['Janti Prasthan', 'groom', 'The groom’s procession leaves with Naumati Baja music.'],
    ['Swagat', 'bride', 'Bride’s family welcomes the Janti at the wedding venue.'],
    ['Swayamvar', 'both', 'Bride and groom exchange garlands.'],
    ['Kanyadaan', 'bride', 'The bride’s parents give their daughter’s hand in marriage.'],
    ['Sindoor Halne & Pote', 'both', 'The groom applies sindoor and ties the pote.'],
    ['Saptapadi', 'both', 'Seven steps and vows around the sacred fire.'],
    ['Bidaai', 'bride', 'An emotional farewell as the bride leaves her parents’ home.'],
    ['Ghar Bhitryaune', 'groom', 'Welcoming the bride into the groom’s home.'],
    ['Mukh Herne', 'groom', 'Family members see the bride’s face and give gifts.'],
    ['Reception (Bhoj)', 'both', 'Wedding feast and celebration with guests.']
  ];

  /* The rituals inside each ceremony, ticked off one by one on the Ceremonies page */
  const ceremonyRituals = {
    'Engagement (Sagai)': ['Ganesh puja with the pandit', 'Sagun offered to the couple', 'Exchange of rings', 'Tika and blessings from elders'],
    'Mehendi': ['Mehendi for the bride’s hands and feet', 'Mehendi for the women of the family', 'Songs and dancing'],
    'Haldi': ['Haldi paste applied by family', 'Blessings from elders', 'Bath after the haldi'],
    'Tilak': ['Tilak and tika for the groom', 'Gifts and sagun for the groom', 'Blessings from the bride’s family', 'Feast for the guests'],
    'Janti Prasthan': ['Puja at the groom’s home', 'Mother’s blessing for the groom', 'Janti leaves with Naumati Baja'],
    'Swagat': ['Arati and tika for the groom', 'Garlands for the Janti', 'Sweets and drinks for the Janti'],
    'Swayamvar': ['Exchange of jaimala', 'Blessings from both families'],
    'Kanyadaan': ['Parents wash the couple’s feet', 'Parents place the bride’s hand in the groom’s', 'Gifts from the bride’s family'],
    'Sindoor Halne & Pote': ['Groom applies sindoor', 'Groom ties the pote', 'Blessings from elders'],
    'Saptapadi': ['Sacred fire lit by the pandit', 'Seven steps around the fire', 'Seven vows'],
    'Bidaai': ['Farewell blessings from the bride’s parents', 'Bride leaves for the groom’s home'],
    'Ghar Bhitryaune': ['Arati for the bride at the door', 'Bride steps into her new home', 'Puja at the family shrine'],
    'Mukh Herne': ['Family members see the bride’s face', 'Gifts and blessings for the bride'],
    'Reception (Bhoj)': ['Welcome the guests', 'Couple greets every family', 'Wedding feast']
  };
  const ritualsFor = ceremonyName => ceremonyRituals[Object.keys(ceremonyRituals).find(key => key.toLowerCase() === String(ceremonyName).trim().toLowerCase())] || [];
  const makeRituals = names => names.map(ritual => ({ id: uid('ritual'), name: ritual, done: false }));

  /* Ceremonies belong to the engagement or the wedding */
  const stages = [['engagement', 'Engagement'], ['wedding', 'Wedding']];
  const engagementCeremonies = ['engagement (sagai)', 'engagement', 'sagai', 'tilak', 'ring ceremony'];
  const stageFor = ceremonyName => engagementCeremonies.includes(String(ceremonyName).trim().toLowerCase()) ? 'engagement' : 'wedding';

  /* What each ceremony needs: tasks, things to buy and things to book.
     Side is who usually takes care of it; 'both' goes to the side you're planning for. */
  const ceremonyNeeds = {
    'Engagement (Sagai)': { occasion: 'tilak',
      tasks: [['Fix the engagement date with the pandit', 'both'], ['Make the engagement guest list', 'both'], ['Send engagement invitations', 'both']],
      buy: [['Engagement rings', 'both'], ['Engagement outfit for the bride', 'bride'], ['Engagement outfit for the groom', 'groom'], ['Sagun: fruits, sweets & dahi', 'both'], ['Gifts for the other family', 'both']],
      book: [['Engagement venue', 'both'], ['Engagement catering', 'both'], ['Photographer', 'both'], ['Makeup artist for the engagement', 'bride']] },
    'Mehendi': { occasion: 'haldiMehendi',
      tasks: [['Book a mehendi artist', 'bride'], ['Plan mehendi songs and dancing', 'bride']],
      buy: [['Mehendi cones', 'bride'], ['Mehendi outfit for the bride', 'bride'], ['Snacks & sweets for guests', 'both']],
      book: [['Mehendi artist', 'bride'], ['Dhol / music', 'both']] },
    'Haldi': { occasion: 'haldiMehendi',
      tasks: [['Prepare haldi & ubtan paste', 'both']],
      buy: [['Haldi & ubtan ingredients', 'both'], ['Yellow outfit for the bride', 'bride'], ['Yellow outfit for the groom', 'groom'], ['Marigold flowers & garlands', 'both']],
      book: [['Decorator', 'both'], ['Photographer', 'both']] },
    'Tilak': { occasion: 'tilak',
      tasks: [['Fix the Tilak date with the pandit', 'bride'], ['Pack tilak gifts for the groom’s family', 'bride']],
      buy: [['Tilak thali & puja items', 'bride'], ['Sagun: fruits, sweets & dahi', 'bride'], ['Gifts for the groom’s family', 'bride'], ['Engagement rings', 'both']],
      book: [['Engagement venue', 'both'], ['Photographer', 'both']] },
    'Janti Prasthan': { occasion: 'wedding',
      tasks: [['Confirm the Janti guest list', 'groom'], ['Arrange cars for the Janti', 'groom']],
      buy: [['Groom’s Daura Suruwal / sherwani', 'groom'], ['Dhaka topi', 'groom'], ['Groom’s garland', 'groom']],
      book: [['Naumati Baja', 'groom'], ['Car / transport for the Janti', 'groom']] },
    'Swagat': { occasion: 'wedding',
      tasks: [['Plan the Janti welcome at the venue', 'bride']],
      buy: [['Welcome garlands for the Janti', 'bride'], ['Sweets & drinks for the Janti', 'bride']],
      book: [['Wedding venue / party palace', 'bride'], ['Catering', 'bride']] },
    'Swayamvar': { occasion: 'wedding',
      tasks: [['Order fresh jaimala for the wedding day', 'both']],
      buy: [['Jaimala (wedding garlands)', 'both']],
      book: [['Decorator & mandap', 'both']] },
    'Kanyadaan': { occasion: 'wedding',
      tasks: [['Go through the Kanyadaan rituals with the pandit', 'bride']],
      buy: [['Puja samagri', 'both'], ['Kanyadaan gifts', 'bride']],
      book: [['Pandit / purohit', 'both']] },
    'Sindoor Halne & Pote': { occasion: 'wedding',
      tasks: [['Keep the pote and sindoor ready for the ceremony', 'groom']],
      buy: [['Sindoor & sindoor box', 'groom'], ['Pote & tilhari', 'groom']],
      book: [] },
    'Saptapadi': { occasion: 'wedding',
      tasks: [['Check the mandap is ready for the sacred fire', 'both']],
      buy: [['Puja samagri', 'both'], ['Havan samagri for the sacred fire', 'both']],
      book: [['Pandit / purohit', 'both']] },
    'Bidaai': { occasion: 'wedding',
      tasks: [['Pack the bride’s suitcases', 'bride'], ['Plan the bride’s car to the groom’s home', 'bride']],
      buy: [['Suitcases for the bride', 'bride'], ['Daijo / gifts for the bride', 'bride']],
      book: [['Car for the Bidaai', 'bride']] },
    'Ghar Bhitryaune': { occasion: 'general',
      tasks: [['Prepare the groom’s home to welcome the bride', 'groom']],
      buy: [['Welcome puja items', 'groom'], ['Kalash & flowers for the entrance', 'groom']],
      book: [] },
    'Mukh Herne': { occasion: 'general',
      tasks: [['Make the family list for Mukh Herne', 'groom']],
      buy: [['Gifts for the bride at Mukh Herne', 'groom']],
      book: [] },
    'Reception (Bhoj)': { occasion: 'reception',
      tasks: [['Send reception invitations', 'both'], ['Plan the reception seating', 'both']],
      buy: [['Bride’s reception outfit', 'bride'], ['Groom’s reception outfit', 'groom'], ['Return gifts for guests', 'both']],
      book: [['Reception venue', 'both'], ['Reception catering', 'both'], ['DJ / live band', 'both'], ['Makeup artist for the reception', 'bride']] }
  };

  /* Occasions used to group the shopping list. */
  /* Bookings can also cover every ceremony at once (one photographer, one baja band…) */
  const allCeremonies = ['allCeremonies', 'All ceremonies'];
  const occasions = [['tilak', 'Engagement & Tilak'], ['haldiMehendi', 'Haldi & Mehendi'], ['wedding', 'Wedding day'], ['reception', 'Reception'], ['general', 'General & other']];

  const bookingOccasions = [allCeremonies, ...occasions];

  /* Things to buy and book for each occasion: [name, for which side, note] */
  const shoppingIdeas = {
    allCeremonies: {
      buy: [],
      book: [['Photographer & videographer', 'both', 'One team for every ceremony'], ['Naumati Baja / music band', 'both', 'One group for every ceremony'], ['Decorator', 'both', 'One decorator for every ceremony'], ['Transport', 'both', 'Cars for every ceremony'], ['Event planner / coordinator', 'both'], ['Videographer for a wedding film', 'both'], ['Drone photography', 'both'], ['Generator / backup power', 'both'], ['Security & parking attendants', 'both']]
    },
    tilak: {
      buy: [['Engagement rings', 'both'], ['Tilak thali & puja items', 'bride'], ['Sagun: fruits, sweets & dahi', 'bride'], ['Gifts for the groom’s family', 'bride'], ['Engagement outfits', 'both'], ['Tilak sari / outfit for the bride’s mother', 'bride'], ['Dry fruits & mithai boxes', 'both'], ['Coconut, supari & paan for the rituals', 'both'], ['Ring platter / decorated thali', 'both']],
      book: [['Engagement venue', 'both'], ['Photographer', 'both'], ['Florist for the ring ceremony', 'both']]
    },
    haldiMehendi: {
      buy: [['Mehendi cones', 'bride'], ['Haldi & ubtan ingredients', 'both'], ['Yellow outfit for the bride', 'bride'], ['Yellow outfit for the groom', 'groom'], ['Marigold flowers & garlands', 'both'], ['Bangles & phool jewellery', 'bride'], ['Snacks & sweets for guests', 'both'], ['Extra mehendi cones for guests', 'bride'], ['Floral jewellery for the groom', 'groom'], ['Dholak & small instruments for songs', 'both'], ['Cushions, mats & low seating', 'both']],
      book: [['Mehendi artist', 'bride'], ['Decorator', 'both'], ['Dhol / music', 'both'], ['Photographer', 'both'], ['Sound system / DJ for the sangeet', 'both'], ['Dance choreographer', 'both']]
    },
    wedding: {
      buy: [['Bridal sari / lehenga', 'bride'], ['Bridal jewellery', 'bride', 'Tilhari, necklace, earrings, bangles'], ['Pote & tilhari', 'groom'], ['Sindoor & sindoor box', 'groom'], ['Groom’s Daura Suruwal / sherwani', 'groom'], ['Dhaka topi', 'groom'], ['Jaimala (wedding garlands)', 'both'], ['Bride’s shoes & accessories', 'bride'], ['Puja samagri', 'both'], ['Churra (bangles)', 'bride'], ['Bride’s second outfit (after Sindoor)', 'bride'], ['Shawls / dhaka for elders', 'both'], ['Sagun for the Janti', 'bride'], ['Dakshina envelopes for the pandit & helpers', 'both'], ['Kalash, diyo, batti & ghee', 'both'], ['Emergency kit: safety pins, tissues, medicine, sewing kit', 'both']],
      book: [['Wedding venue / party palace', 'both'], ['Catering', 'both'], ['Makeup artist', 'bride'], ['Naumati Baja', 'groom'], ['Pandit / purohit', 'both'], ['Photographer & videographer', 'both'], ['Decorator & mandap', 'both'], ['Car / transport for the Janti', 'groom'], ['Hair stylist', 'bride'], ['Saree draping artist', 'bride'], ['Mandap flower decoration', 'both'], ['Wedding car decoration', 'both'], ['Doli / palki for the bride’s entry', 'bride'], ['Hotel rooms for the Janti', 'both']]
    },
    reception: {
      buy: [['Bride’s reception outfit', 'bride'], ['Groom’s reception outfit', 'groom'], ['Return gifts for guests', 'both'], ['Reception jewellery', 'bride'], ['Guest book & pen', 'both'], ['Wedding cake', 'both']],
      book: [['Reception venue', 'both'], ['Reception catering', 'both'], ['DJ / live band', 'both'], ['Makeup artist for the reception', 'bride'], ['Stage & lighting', 'both'], ['MC / host', 'both'], ['Live music / ghazal singer', 'both'], ['Photo booth', 'both']]
    },
    general: {
      buy: [['Invitation cards', 'both'], ['Gifts for family members', 'both'], ['Suitcases for the bride', 'bride'], ['Gifts for brothers & sisters', 'both'], ['Thank-you gifts for helpers', 'both'], ['Wedding album & photo frames', 'both'], ['Honeymoon travel items', 'both']],
      book: [['Guest accommodation', 'both'], ['Tailor for outfit fittings', 'both'], ['Invitation card printer', 'both'], ['Tailor for alterations', 'both'], ['Honeymoon travel booking', 'both']]
    }
  };

  /* People needed on the day: [duty, side, what they do] */
  const helperIdeas = {
    allCeremonies: { help: [
      ['Gift & envelope keeper', 'both', 'Holds the gift bag, collects envelopes and writes each guest’s name and amount in the gift register'],
      ['Valuables keeper', 'both', 'Looks after jewellery, cash, phones and bags; keeps the room locked'],
      ['Guest welcome', 'both', 'Greets guests at the door, guides them to seats, elders first'],
      ['Food supervisor', 'both', 'Checks everyone has eaten, elders and special guests are served, and nobody is missed'],
      ['Supplies watcher', 'both', 'Notices when food, water, plates or chairs run low and tells the caterer straight away'],
      ['Security & safety', 'both', 'Watches the entrance, spots outsiders, keeps an eye on children and belongings'],
      ['Elders’ care', 'both', 'Seats, water, medicines and help moving around for elderly relatives'],
      ['Kids in charge', 'both', 'Keeps children safe, fed and away from the fire and stage'],
      ['First aid person', 'both', 'Keeps the first aid kit and knows the nearest hospital and taxi number'],
      ['Photographer guide', 'both', 'Tells the photographer which moments and family groups to capture']
    ] },
    tilak: { help: [
      ['Ring & tilak thali keeper', 'both', 'Keeps the rings, tilak thali and sagun safe until the ceremony'],
      ['Gift register writer', 'both', 'Writes down every gift and envelope with the giver’s name']
    ] },
    haldiMehendi: { help: [
      ['Mehendi queue organiser', 'bride', 'Decides who gets mehendi next and keeps the artist on time'],
      ['Music & dance lead', 'both', 'Plays the songs, gets people dancing and runs the dholak']
    ] },
    wedding: { help: [
      ['Pandit’s helper', 'both', 'Sits near the pandit and quickly hands over puja items when asked: rice, flowers, ghee, coins, water'],
      ['Bride’s companion', 'bride', 'Stays with the bride all day: outfit, jewellery, makeup touch-ups, water and snacks'],
      ['Groom’s companion', 'groom', 'Stays with the groom: outfit, garland, pote, sindoor box and timing'],
      ['Janti welcome lead', 'bride', 'Receives the Janti, offers sagun and drinks, and seats them'],
      ['Janti coordinator', 'groom', 'Keeps the Janti together, on time, and counts everyone on the way back'],
      ['Transport coordinator', 'both', 'Knows every car, driver and phone number; sends cars when needed'],
      ['Missing items runner', 'both', 'Has a bike or car ready to fetch anything forgotten: puja items, safety pins, chargers'],
      ['Baja & music coordinator', 'both', 'Tells the Naumati Baja or band when to start and stop']
    ] },
    reception: { help: [
      ['Gift table in charge', 'both', 'Stays at the gift table and keeps the register up to date'],
      ['Stage coordinator', 'both', 'Sends families to the stage for photos in turn'],
      ['Return gifts handout', 'both', 'Gives return gifts to guests as they leave']
    ] },
    general: { help: [
      ['After-event cleanup', 'both', 'Collects decorations, checks the venue and gathers lost-and-found'],
      ['Accounts keeper', 'both', 'Records payments made on the day and keeps the bills']
    ] }
  };

  /* Suggestions for the Shopping list (type 'buy') or Bookings (type 'book'), one tab per occasion. */
  function ideasFor(type, title, intro, groupOptions = occasions, source = shoppingIdeas) {
    return {
      title, intro,
      groups: groupOptions.map(([key, label]) => ({
        key, label,
        sections: [{ key: type, items: (source[key]?.[type] || []).map(([name, side, note]) => ({ name, side: ownSide(side), notes: note || '', detail: note || '' })) }]
      })),
      exists: (record, item, group) => record.name.toLowerCase() === item.name.toLowerCase() && (record.occasion || 'general') === group.key,
      toRecord: (item, group) => type === 'buy'
        ? { name: item.name, occasion: group.key, quantity: null, side: item.side, amount: null, status: 'toBuy', notes: item.notes }
        : type === 'help'
          ? { name: item.name, occasion: group.key, responsible: '', contact: '', side: item.side, status: 'open', notes: item.notes }
          : { name: item.name, occasion: group.key, contact: '', side: item.side, amount: null, status: 'toBook', notes: item.notes }
    };
  }

  /* ---------- Page settings: field = [key, label, type, required, options] ---------- */
  const collections = {
    events: {
      title: 'Ceremonies', key: 'events', singular: 'ceremony', plural: 'ceremonies', sortBy: 'date', essentials: ['name', 'stage', 'date', 'location'],
      intro: 'Each ceremony with its date, place, and the rituals to prepare.',
      fields: [['name', 'Ceremony name', 'text', true], ['stage', 'Part of', 'select', true, stages], ['date', 'Date', 'date'], ['time', 'Time', 'time'], ['location', 'Location', 'text'], ['side', 'Hosted by', 'select', false, sides], ['status', 'Status', 'select', false, [['planning', 'Planning'], ['ready', 'Ready'], ['done', 'Done']]], ['notes', 'Notes & things to prepare', 'textarea'], ['memory', 'Moments to remember', 'textarea']],
      suggestions: {
        title: 'Start from traditional ceremonies',
        intro: 'Pick the Nepali wedding ceremonies your families will celebrate.',
        groups: [{ key: 'all', sections: [{ key: 'all', items: ceremonies.map(([name, side, about]) => ({ name, side: ownSide(side), notes: about, detail: `${about} · ${sideNames[ownSide(side)]}` })) }] }],
        exists: (record, item) => record.name.toLowerCase() === item.name.toLowerCase(),
        toRecord: item => ({ name: item.name, stage: stageFor(item.name), date: '', time: '', location: '', side: item.side, status: 'planning', notes: item.notes, rituals: makeRituals(ritualsFor(item.name)) })
      }
    },
    guests: {
      title: 'Guests', key: 'guests', singular: 'guest', plural: 'guests', essentials: ['name', 'side', 'people', 'status'],
      intro: 'Invitees, family side, and RSVP details together.',
      fields: [['name', 'Guest or family name', 'text', true], ['side', 'Family side', 'select', true, familySides], ['people', 'Number of people', 'number'], ['group', 'Relation / group', 'text'], ['status', 'Invitation status', 'select', false, [['notSent', 'Not sent'], ['sent', 'Invited'], ['confirmed', 'Confirmed'], ['declined', 'Declined']]], ['contact', 'Phone or address', 'text']]
    },
    budget: {
      ownSideOnly: true,
      title: 'Unexpected expenses', key: 'budgetItems', singular: 'expense', plural: 'expenses', essentials: ['name', 'amount', 'status'],
      intro: 'Shopping and Bookings costs are added to your budget automatically. Add anything else here, like a surprise cost, extra transport or tips.',
      fields: [['name', 'Expense', 'text', true], ['category', 'Category', 'text'], ['amount', 'Amount', 'number', true], ['status', 'Payment status', 'select', false, [['planned', 'Planned'], ['due', 'Due'], ['paid', 'Paid']]]]
    },
    shopping: {
      title: 'Shopping list', key: 'shopping', singular: 'item', plural: 'items', essentials: ['name', 'occasion', 'responsible', 'status'], tracksWork: true,
      intro: 'Everything to buy, grouped by occasion.',
      fields: [['name', 'Item', 'text', true], ['responsible', 'Responsible person', 'person'], ['occasion', 'Occasion', 'select', true, occasions], ['quantity', 'Quantity', 'number'], ['amount', 'Estimated cost', 'number'], ['status', 'Status', 'select', false, [['toBuy', 'To buy'], ['ordered', 'Ordered'], ['bought', 'Bought']]], ['notes', 'Notes', 'textarea']],
      groupBy: { field: 'occasion', options: occasions, fallback: 'general' },
      doneToggle: { field: 'status', done: 'bought', notDone: 'toBuy' },
      ownSideOnly: true,
      suggestions: ideasFor('buy', 'Suggestions: things to buy', 'Tick what you need for each occasion, from outfits and jewellery to puja samagri.')
    },
    helpers: {
      title: 'Helpers & duties', key: 'helpers', singular: 'duty', plural: 'duties', essentials: ['name', 'occasion', 'responsible', 'helper2', 'helper3', 'status'], showsPerson: true,
      intro: 'Family and friends who take care of things on the day: gifts, the pandit’s puja items, the bride, guests, food and safety.',
      fields: [['name', 'Duty', 'text', true], ['responsible', 'Person 1', 'person'], ['helper2', 'Person 2', 'person'], ['helper3', 'Person 3', 'person'], ['occasion', 'Occasion', 'select', true, bookingOccasions], ['contact', 'Phone number', 'text'], ['status', 'Status', 'select', false, [['open', 'Need someone'], ['asked', 'Asked'], ['confirmed', 'Confirmed']]], ['notes', 'What they need to do', 'textarea']],
      groupBy: { field: 'occasion', options: bookingOccasions, fallback: 'general' },
      doneToggle: { field: 'status', done: 'confirmed', notDone: 'open' },
      ownSideOnly: true,
      suggestions: ideasFor('help', 'Suggestions: people you’ll need', 'Tick the duties to hand out: gift keeper, pandit’s helper, bride’s companion, food and safety and more.', bookingOccasions, helperIdeas)
    },
    bookings: {
      title: 'Bookings', key: 'bookings', singular: 'booking', plural: 'bookings', essentials: ['name', 'occasion', 'responsible', 'status'], tracksWork: true,
      intro: 'Services to book, grouped by occasion. Put one booking under All ceremonies when it covers every ceremony, like a photographer or baja band, so its cost is counted once.',
      fields: [['name', 'Service or vendor', 'text', true], ['responsible', 'Responsible person', 'person'], ['occasion', 'Occasion', 'select', true, bookingOccasions], ['contact', 'Contact person or phone', 'text'], ['amount', 'Cost', 'number'], ['status', 'Status', 'select', false, [['toBook', 'To book'], ['talking', 'In talks'], ['booked', 'Booked']]], ['notes', 'Notes', 'textarea']],
      groupBy: { field: 'occasion', options: bookingOccasions, fallback: 'general' },
      doneToggle: { field: 'status', done: 'booked', notDone: 'toBook' },
      ownSideOnly: true,
      suggestions: ideasFor('book', 'Suggestions: things to book', 'Tick the services you need for each occasion: venue, makeup artist, Naumati Baja, catering and more.', bookingOccasions)
    }
  };

  const name = mount.dataset.collection;
  const config = collections[name];
  if (!config) return;
  const fieldKeys = config.fields.map(([key]) => key);
  const optionsFor = key => config.fields.find(field => field[0] === key)?.[4] || [];
  const labelFor = (key, value) => optionsFor(key).find(([option]) => option === value)?.[1] || value;
  const capital = text => text[0].toUpperCase() + text.slice(1);
  /* Which filters to show above the list. */
  // The side filter only makes sense for Guests; everything else is your own side
  const filterKeys = ['stage', 'type', 'side', 'status'].filter(key => fieldKeys.includes(key) && (key !== 'side' || name === 'guests'));

  const saved = storage.get(config.key, []);
  const allSaved = Array.isArray(saved) ? saved : [];
  // Shopping, Bookings and Budget show only your side; other records stay saved but hidden
  const otherSide = config.ownSideOnly ? allSaved.filter(item => !isMine(item)) : [];
  let records = config.ownSideOnly ? allSaved.filter(isMine) : allSaved;
  if (name === 'events') records = records.map(item => item.stage ? item : { ...item, stage: stageFor(item.name) });
  let editing = null;
  /* Shopping and Bookings open showing only your own side (bride or groom), from the wedding profile */
  const filters = Object.fromEntries(filterKeys.map(key => [key, 'all']));
  let openGroup = config.suggestions?.groups[0].key;
  const persist = () => {
    if (!storage.set(config.key, [...records, ...otherSide])) app.showToast('Could not save. Check your browser storage settings.');
  };
  const isDone = record => config.doneToggle && record[config.doneToggle.field] === config.doneToggle.done;

  /* ---------- Summary cards ---------- */
  function summaryHtml() {
    const card = (label, value, note, extra = '') => `<article class="budget-card${extra}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
    if (name === 'budget') {
      const budget = app.profile?.budget;
      const { shopping, bookings } = app.costTotals();
      const expenses = records.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const planned = expenses + shopping + bookings;
      const paid = records.filter(item => item.status === 'paid').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const left = budget == null ? null : budget - planned;
      const over = left != null && left < 0;
      const breakdown = `Shopping ${money(shopping)} · Bookings ${money(bookings)} · Extra ${money(expenses)} · ${money(paid)} paid`;
      return `<section class="budget-cards">
        ${card('Total budget', escape(money(budget)), budget == null ? 'Set it in My details → Edit profile' : 'From your wedding profile')}
        ${card('Planned costs', escape(money(planned)), escape(breakdown))}
        ${card(over ? 'Over budget' : 'Still available', escape(left == null ? '—' : money(Math.abs(left))), over ? 'Planned costs are higher than your budget' : 'Budget minus planned costs', over ? ' over-budget' : '')}
      </section>`;
    }
    if (name === 'guests') {
      const people = status => records.filter(item => status === 'all' || item.status === status).reduce((sum, item) => sum + (Number(item.people) || 1), 0);
      return `<section class="budget-cards">
        ${card('People on the list', people('all'), `${records.length} ${records.length === 1 ? 'invitation' : 'invitations'}`)}
        ${card('Confirmed', people('confirmed'), 'People coming')}
        ${card('Not invited yet', people('notSent'), 'Invitations still to send')}
      </section>`;
    }
    if (name === 'helpers') {
      const confirmed = records.filter(isDone).length;
      const unassigned = records.filter(item => !peopleOn(item).length).length;
      return `<section class="budget-cards">
        ${card('Duties', records.length, 'Jobs to hand out')}
        ${card('Confirmed', confirmed, `of ${records.length} ${records.length === 1 ? 'duty' : 'duties'}`)}
        ${card('Need someone', unassigned, unassigned ? 'No one named yet' : 'Everyone has a job')}
      </section>`;
    }
    if (name === 'shopping' || name === 'bookings') {
      const done = records.filter(isDone).length;
      const cost = records.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const buying = name === 'shopping';
      return `<section class="budget-cards">
        ${card(buying ? 'Still to buy' : 'Still to book', records.length - done, buying ? 'Outfits, jewellery, puja items…' : 'Venue, makeup, baja, catering…')}
        ${card(buying ? 'Bought' : 'Booked', done, `of ${records.length} ${records.length === 1 ? config.singular : config.plural}`)}
        ${card(buying ? 'Estimated cost' : 'Total cost', escape(money(cost)), buying ? 'For items with a price' : 'For bookings with a price')}
      </section>`;
    }
    return '';
  }

  /* ---------- Budget: every cost from every page, highest first ---------- */
  function costListHtml() {
    if (name !== 'budget') return '';
    const statusLabel = (page, value) => collections[page].fields.find(field => field[0] === 'status')?.[4]?.find(([key]) => key === value)?.[1] || value || '';
    const sources = [
      { page: 'budget', label: 'Extra expense', items: records, href: null },
      { page: 'shopping', label: 'Shopping', items: app.list('shopping').filter(isMine), href: 'shopping.html' },
      { page: 'bookings', label: 'Booking', items: app.list('bookings').filter(isMine), href: 'bookings.html' }
    ];
    const all = sources.flatMap(source => source.items.map(item => ({ ...item, source })));
    if (!all.length) return '';
    const priced = all.filter(item => Number(item.amount) > 0).sort((a, b) => Number(b.amount) - Number(a.amount));
    const unpriced = all.filter(item => !(Number(item.amount) > 0));
    const total = priced.reduce((sum, item) => sum + Number(item.amount), 0);
    const row = item => {
      const status = item.status ? `<span class="status-pill status-${escape(item.status)}">${escape(statusLabel(item.source.page, item.status))}</span>` : '';
      const tag = item.source.href
        ? `<a class="cost-source" href="${item.source.href}">${item.source.label}</a>`
        : `<span class="cost-source">${item.source.label}</span>`;
      const amount = Number(item.amount) || 0;
      const share = amount && total ? `${Math.max(1, Math.round((amount / total) * 100))}% of costs` : 'No price yet';
      const own = item.source.page === 'budget';
      const actions = own ? `<div class="record-actions"><button type="button" data-action="edit">Edit</button><button type="button" class="delete-action" data-action="delete">Remove</button></div>` : '';
      return `<li class="cost-row"${own ? ` data-id="${escape(item.id)}"` : ''}>
        <div class="cost-row-main"><strong>${escape(item.name)}</strong><p>${tag}${status}</p></div>
        <div class="cost-row-amount">${amountInput(item, `data-cost-key="${escape(collections[item.source.page].key)}" data-cost-id="${escape(item.id)}"`)}<span>${share}</span></div>
        ${actions}
      </li>`;
    };
    return `<section class="panel cost-list">
      <div class="cost-list-head"><div><p class="eyebrow">ALL COSTS</p><h3>Every cost, highest first</h3></div><span>${priced.length} priced · ${escape(money(total))}</span></div>
      ${priced.length ? `<ol class="cost-rows">${priced.map(row).join('')}</ol>` : ''}
      ${unpriced.length ? `<p class="record-subhead cost-subhead">Still need a price <span>${unpriced.length}</span></p><ul class="cost-rows">${unpriced.map(row).join('')}</ul>` : ''}
    </section>`;
  }

  /* ---------- Ceremonies: tasks, shopping and bookings each one needs ---------- */
  let linkedFor = []; // ceremony names whose "things you'll need" panel is open
  const needsFor = ceremonyName => ceremonyNeeds[Object.keys(ceremonyNeeds).find(key => key.toLowerCase() === String(ceremonyName).toLowerCase())];
  // Only ceremonies with something for your side get suggestions
  const hasNeeds = ceremonyName => { const needs = needsFor(ceremonyName); return Boolean(needs) && ['tasks', 'buy', 'book'].some(kind => (needs[kind] || []).some(([, side]) => ownSide(side) === mySide)); };
  const linkedKinds = [
    { kind: 'tasks', label: 'Tasks', icon: '☑', storageKey: 'tasks', nameField: 'title' },
    { kind: 'buy', label: 'Shopping', icon: '🛍', storageKey: 'shopping', nameField: 'name' },
    { kind: 'book', label: 'Bookings', icon: '📅', storageKey: 'bookings', nameField: 'name' }
  ];
  function linkedHtml() {
    if (name !== 'events' || !linkedFor.length) return '';
    const have = Object.fromEntries(linkedKinds.map(({ kind, storageKey, nameField }) => [kind, new Set(app.list(storageKey).map(item => String(item[nameField] || '').toLowerCase()))]));
    const shown = [];
    const blocks = linkedFor.map(ceremony => {
      const needs = needsFor(ceremony);
      if (!needs) return '';
      const cols = linkedKinds.map(({ kind, label, icon }) => {
        const items = (needs[kind] || []).filter(([, side]) => ownSide(side) === mySide);
        if (!items.length) return '';
        return `<fieldset class="linked-col"><legend><span aria-hidden="true">${icon}</span> ${label}</legend>${items.map(([item]) => {
          const added = have[kind].has(item.toLowerCase());
          return `<label class="linked-option${added ? ' is-added' : ''}"><input type="checkbox" name="linked" value="${escape(`${kind}|${ceremony}|${item}`)}"${added ? ' disabled' : ' checked'}><span>${escape(item)}${added ? '<small>Already in your list</small>' : ''}</span></label>`;
        }).join('')}</fieldset>`;
      }).join('');
      if (cols) shown.push(ceremony);
      return cols ? `<div class="linked-ceremony"><h4>${escape(ceremony)}</h4><div class="linked-cols">${cols}</div></div>` : '';
    }).join('');
    if (!blocks) return '';
    return `<section class="linked-panel" id="linked-panel">
      <div class="task-form-heading"><div><p class="eyebrow">PLAN AHEAD</p><h3>Things you’ll need for ${escape(shown.length <= 2 ? shown.join(' & ') : 'these ceremonies')}</h3><p class="linked-intro">Ticked items are added to your Tasks, Shopping and Bookings. Untick anything you don’t need.</p></div><button class="close-form" type="button" data-action="linked-close" aria-label="Close">×</button></div>
      <form id="linked-form">${blocks}<div class="form-actions"><button class="secondary-button" type="button" data-action="linked-close">Not now</button><button class="primary-button" type="submit"><span aria-hidden="true">＋</span> Add ticked items</button></div></form>
    </section>`;
  }
  function addLinked(chosen) {
    const now = new Date().toISOString();
    const counts = {};
    linkedKinds.forEach(({ kind, label, storageKey, nameField }) => {
      const picks = chosen.filter(value => value.startsWith(`${kind}|`)).map(value => { const [, ceremony, ...rest] = value.split('|'); return { ceremony, item: rest.join('|') }; });
      if (!picks.length) return;
      const existing = app.list(storageKey);
      const names = new Set(existing.map(item => String(item[nameField] || '').toLowerCase()));
      const fresh = picks.filter(({ item }) => !names.has(item.toLowerCase()) && names.add(item.toLowerCase()));
      if (!fresh.length) return;
      const made = fresh.map(({ ceremony, item }) => {
        const notes = `For ${ceremony}`;
        if (kind === 'tasks') {
          const date = records.find(record => record.name.toLowerCase() === ceremony.toLowerCase())?.date || '';
          return { id: uid('tasks'), title: item, dueDate: date, assignee: '', priority: 'normal', notes, completed: false };
        }
        const occasion = needsFor(ceremony)?.occasion || 'general';
        return kind === 'buy'
          ? { id: uid('shopping'), name: item, occasion, quantity: null, side: mySide, amount: null, status: 'toBuy', notes, updatedAt: now, progressAt: now }
          : { id: uid('bookings'), name: item, occasion, contact: '', side: mySide, amount: null, status: 'toBook', notes, updatedAt: now, progressAt: now };
      });
      storage.set(storageKey, kind === 'tasks' ? [...made, ...existing] : [...existing, ...made]);
      counts[label] = made.length;
      app.notify({ kind: 'added', title: `${made.length} ${made.length === 1 ? 'item' : 'items'}`, text: `added for ${[...new Set(fresh.map(pick => pick.ceremony))].join(', ')}: ${made.slice(0, 3).map(item => item.title || item.name).join(', ')}${made.length > 3 ? '…' : ''}`, section: label, href: `pages/${storageKey}.html` });
    });
    return counts;
  }

  /* ---------- Suggestions picker ---------- */
  function suggestionsHtml() {
    const s = config.suggestions;
    if (!s) return '';
    const groups = s.groups.map(group => ({
      ...group,
      sections: group.sections.map(section => ({ ...section, items: section.items.filter(item => (!config.ownSideOnly || item.side === mySide) && !records.some(record => s.exists(record, item, group))) })).filter(section => section.items.length)
    })).filter(group => group.sections.length);
    if (!groups.length) return '';
    const optionHtml = (item, group, section) => `<label class="ceremony-option"><input type="checkbox" name="suggestion" value="${escape(`${group.key}|${section.key}|${item.name}`)}"><span><strong>${escape(item.name)}</strong>${npName(item.name)}<small>${escape(item.detail)}</small></span></label>`;
    const sectionHtml = (section, group) => `${section.label ? `<p class="suggestion-subhead">${section.label}</p>` : ''}<div class="ceremony-options">${section.items.map(item => optionHtml(item, group, section)).join('')}</div>`;
    const tabs = groups.length > 1 && groups[0].label;
    const active = groups.find(group => group.key === openGroup) || groups[0];
    return `<details class="ceremony-picker"${records.length ? '' : ' open'}>
      <summary><span><strong>${s.title}</strong><small>${s.intro}</small></span></summary>
      <form id="suggestion-form">
        ${tabs ? `<div class="occasion-tabs" role="tablist">${groups.map(group => `<button type="button" role="tab" class="occasion-tab${group === active ? ' selected' : ''}" aria-selected="${group === active}" data-group="${group.key}">${group.label}</button>`).join('')}</div>` : ''}
        ${groups.map(group => `<div class="suggestion-group"${group === active || !tabs ? '' : ' hidden'} data-group-panel="${group.key}">${group.sections.map(section => sectionHtml(section, group)).join('')}</div>`).join('')}
        <div class="form-actions"><button class="primary-button" type="submit"><span aria-hidden="true">＋</span> Add selected</button></div>
      </form>
    </details>`;
  }

  /* ---------- Add / edit form ---------- */
  function formHtml() {
    if (!editing) return '';
    const record = editing.id ? editing : null;
    const fieldHtml = ([key, label, type, required, options]) => {
      const value = editing[key] ?? '';
      const req = required ? ' required' : '';
      let control;
      if (type === 'select') {
        const selected = value || (key === 'side' && options.some(([v]) => v === app.profile?.planningSide) ? app.profile.planningSide : options[0][0]);
        control = `<select name="${key}"${req}>${options.map(([v, text]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${text}</option>`).join('')}</select>`;
      } else if (type === 'person') {
        control = `<input name="${key}" type="text" value="${escape(value)}" maxlength="80" list="family-people" placeholder="${key === 'responsible' ? 'Who is taking care of this?' : 'Another person (optional)'}" autocomplete="off">${key === 'responsible' ? `<datalist id="family-people">${familyPeople().map(person => `<option value="${escape(person)}"></option>`).join('')}</datalist>` : ''}`;
      } else if (type === 'textarea') {
        control = `<textarea name="${key}" rows="3" maxlength="500" placeholder="Add helpful details">${escape(value)}</textarea>`;
      } else {
        const extra = type === 'number' ? ' min="0" step="any" inputmode="decimal" placeholder="0"' : type === 'text' ? ' maxlength="120"' : '';
        control = `<input name="${key}" type="${type}" value="${escape(value)}"${req}${extra}>`;
      }
      return `<label class="field${type === 'textarea' ? ' full' : ''}">${label}${required ? '' : ' <span class="optional-label">Optional</span>'}${control}</label>`;
    };
    /* Show the essential fields first; tuck the rest away under "More details". */
    const essentials = config.essentials || fieldKeys;
    const extra = config.fields.filter(([key]) => !essentials.includes(key));
    const hasExtraValues = extra.some(([key]) => editing[key] != null && editing[key] !== '' && key !== 'side');
    const fields = config.fields.filter(([key]) => essentials.includes(key)).map(fieldHtml).join('')
      + (extra.length ? `<details class="more-fields"${hasExtraValues ? ' open' : ''}><summary>More details <span class="optional-label">${extra.map(([, label]) => label.toLowerCase()).join(', ')}</span></summary><div class="more-fields-grid">${extra.map(fieldHtml).join('')}</div></details>` : '');
    const article = /^[aeiou]/.test(config.singular) ? 'an' : 'a';
    return `<section class="task-form-card" id="record-form-card">
      <div class="task-form-heading"><div><p class="eyebrow">${record ? 'UPDATE' : 'NEW'} ${config.singular.toUpperCase()}</p><h3>${record ? `Edit ${config.singular}` : `Add ${article} ${config.singular}`}</h3></div><button class="close-form" type="button" data-action="close" aria-label="Close form">×</button></div>
      <form id="record-form">${fields}<div class="form-actions"><button class="secondary-button" type="button" data-action="close">Cancel</button><button class="primary-button" type="submit">${record ? 'Save changes' : `Save ${config.singular}`}</button></div></form>
    </section>`;
  }

  /* Names to pick as the responsible person: your side's family from the wedding profile */
  function familyPeople() {
    const profile = app.profile || {};
    const couple = mySide === 'groom' ? profile.groomName : profile.brideName;
    const family = (profile.familyMembers || []).filter(member => member.side === mySide).map(member => member.name);
    return [...new Set([couple, ...family].filter(Boolean))];
  }
  let reminding = null; // id of the row whose "Remind" panel is open
  // Everyone responsible for a record (Helpers can have up to 3 people)
  const peopleOn = record => [...new Set([record.responsible, record.helper2, record.helper3].map(value => String(value || '').trim()).filter(Boolean))];

  /* ---------- Updates feed: tell everyone what changed ---------- */
  const sectionNames = { events: 'Ceremonies', guests: 'Guests', budget: 'Budget', shopping: 'Shopping', bookings: 'Bookings', helpers: 'Helpers' };
  const pageFor = key => Object.keys(collections).find(page => collections[page].key === key) || name;
  const log = (record, kind, text, page = name) => app.notify({ kind, title: record.name, text, section: sectionNames[page] || page, href: `pages/${page}.html` });
  const hasValue = value => value != null && value !== '';
  const sameAmount = (a, b) => (hasValue(a) ? Number(a) : null) === (hasValue(b) ? Number(b) : null);
  const costText = (before, after) => !hasValue(before) ? `price added: ${money(after)}` : !hasValue(after) ? 'price removed' : `price changed: ${money(before)} → ${money(after)}`;
  function logChanges(before, after) {
    if (!before) {
      const extras = [hasValue(after.amount) && money(after.amount), after.responsible && `${after.responsible} responsible`].filter(Boolean);
      log(after, 'added', `added${extras.length ? ` · ${extras.join(' · ')}` : ''}`);
      return;
    }
    let logged = false;
    if (before.status !== after.status && after.status) {
      const doneNow = config.doneToggle && after.status === config.doneToggle.done;
      log(after, doneNow ? 'done' : 'status', doneNow ? `marked ${labelFor('status', after.status)}` : `status: ${labelFor('status', before.status) || 'none'} → ${labelFor('status', after.status)}`);
      logged = true;
    }
    if (!sameAmount(before.amount, after.amount)) { log(after, 'cost', costText(before.amount, after.amount)); logged = true; }
    if (peopleOn(before).join('|') !== peopleOn(after).join('|')) { const now = peopleOn(after); log(after, 'person', now.length ? `now looked after by ${now.join(', ')}` : 'no one responsible now'); logged = true; }
    if (!logged && config.fields.some(([key]) => (before[key] ?? '') !== (after[key] ?? ''))) log(after, 'edit', 'details updated');
  }
  const daysAgo = iso => { const days = Math.floor((Date.now() - new Date(iso)) / 86400000); return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`; };

  /* Inline cost box, so a price can be typed straight into a row */
  const amountInput = (record, attrs = '') => `<label class="amount-input"><span>${escape(app.profile?.currency || 'NPR')}</span><input type="number" min="0" step="any" inputmode="decimal" placeholder="Add cost" value="${record.amount == null || record.amount === '' ? '' : escape(String(record.amount))}" data-amount ${attrs} aria-label="Cost for ${escape(record.name)}"></label>`;
  const hasAmount = fieldKeys.includes('amount');

  /* ---------- Ceremonies: ritual checklist inside each ceremony ---------- */
  const openRituals = new Set(); // ceremony ids whose checklist is expanded
  function ritualsHtml(record) {
    if (name !== 'events') return '';
    const rituals = Array.isArray(record.rituals) ? record.rituals : [];
    const preset = ritualsFor(record.name);
    if (!rituals.length && preset.length && !record.ritualsCleared) {
      return `<p class="ritual-offer"><button type="button" class="text-button" data-action="ritual-preset">＋ Add the ${preset.length} traditional rituals for ${escape(record.name)}</button></p>`;
    }
    const done = rituals.filter(ritual => ritual.done).length;
    const percent = rituals.length ? Math.round((done / rituals.length) * 100) : 0;
    const summary = !rituals.length ? 'No rituals yet' : done === rituals.length ? 'All rituals ready ✓' : `${done} of ${rituals.length} ready`;
    return `<details class="ritual-list" data-ritual-panel${openRituals.has(record.id) ? ' open' : ''}>
      <summary><span class="ritual-title">Rituals</span><span class="ritual-count${rituals.length && done === rituals.length ? ' all-done' : ''}">${summary}</span>${rituals.length ? `<span class="journey-track ritual-track" aria-hidden="true"><span style="width:${percent}%"></span></span>` : ''}</summary>
      ${rituals.length ? `<ul>${rituals.map(ritual => `<li class="${ritual.done ? 'is-done' : ''}"><label><input type="checkbox" data-ritual="${escape(ritual.id)}"${ritual.done ? ' checked' : ''}><span>${escape(ritual.name)}</span></label><button type="button" class="ritual-remove" data-action="ritual-remove" data-ritual-id="${escape(ritual.id)}" aria-label="Remove ritual: ${escape(ritual.name)}">×</button></li>`).join('')}</ul>` : ''}
      <form class="ritual-add" data-ritual-form><input name="ritual" type="text" maxlength="80" placeholder="Add your own ritual" aria-label="New ritual for ${escape(record.name)}" required><button type="submit" class="secondary-button">Add</button></form>
    </details>`;
  }
  function saveRituals(record, rituals) {
    record.rituals = rituals;
    record.updatedAt = new Date().toISOString();
    persist();
  }

  /* Ceremony name in Devanagari under the English name (Ceremonies page only) */
  const npName = text => {
    const ne = name === 'events' ? window.WedPlanNepali?.ceremonyName(text) : '';
    return ne ? `<span class="np-name" lang="ne">${escape(ne)}</span>` : '';
  };

  /* ---------- Ceremonies: moments to remember ----------
     Once a ceremony has happened, invite the couple to write down a moment, so the plan becomes a keepsake. */
  function memoryHtml(record) {
    if (name !== 'events') return '';
    if (record.memory) return `<blockquote class="memory-quote"><span class="memory-mark" aria-hidden="true">♥</span><span><small>Moment to remember</small>${escape(record.memory)}</span></blockquote>`;
    const happened = record.status === 'done' || (record.date && app.daysUntil(record.date) < 0);
    if (!happened) return '';
    return `<details class="memory-prompt"><summary>♥ Write a moment to remember</summary>
      <form class="memory-form" data-memory-form><textarea name="memory" rows="3" maxlength="500" required placeholder="e.g. Hajurba’s blessing made everyone cry" aria-label="A moment to remember from ${escape(record.name)}"></textarea><button type="submit" class="secondary-button">Save memory</button></form>
    </details>`;
  }

  /* ---------- Thank-you messages ----------
     When someone finishes what they took on (bought, booked, agreed to help), offer a WhatsApp thank-you.
     Reminders alone only nag; this adds the warm side of planning together. */
  const canThank = record => (config.tracksWork || config.showsPerson) && isDone(record) && peopleOn(record).length > 0;
  const joinNames = names => names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] || '';
  function thankMessage(record) {
    const who = joinNames(peopleOn(record));
    const from = storage.get('me', '') || familyPeople()[0] || '';
    const what = name === 'helpers' ? `looking after “${record.name}” at the wedding`
      : name === 'shopping' ? `buying “${record.name}” for the wedding`
      : `booking “${record.name}” for the wedding`;
    return `Dear ${who}, thank you so much for ${what}. It means a lot to our family. 🙏♥${from ? `\n– ${from}` : ''}`;
  }
  const thankLink = record => `https://wa.me/?text=${encodeURIComponent(thankMessage(record))}`;
  function markThanked(record) {
    record.thankedAt = new Date().toISOString();
    log(record, 'thanks', `thank-you sent to ${joinNames(peopleOn(record))}`);
    persist();
  }
  // Offered in the toast right after something is marked done
  const thankAction = record => canThank(record) && !record.thankedAt ? { label: 'Say thanks 🙏', run: () => {
    window.open(thankLink(record), '_blank', 'noopener');
    markThanked(record); render();
  } } : undefined;

  /* ---------- List ---------- */
  function recordHtml(record) {
    const grouped = config.groupBy;
    const meta = [
      !grouped && (record.category || record.group || record.recipient),
      record.stage && labelFor('stage', record.stage),
      !config.ownSideOnly && record.side && sideNames[record.side],
      record.date && app.withBS(`${dateLabel(record.date)}${record.time ? `, ${record.time}` : ''}`, record.date),
      record.location,
      record.people && `${record.people} ${Number(record.people) === 1 ? 'person' : 'people'}`,
      record.quantity && `Qty ${record.quantity}`,
      !hasAmount && record.amount != null && record.amount !== '' && money(record.amount),
      record.contact
    ].filter(Boolean);
    const statusText = labelFor('status', record.status);
    const status = record.status ? `<span class="status-pill status-${escape(record.status)}">${escape(statusText)}</span>` : '';
    const done = isDone(record);
    const toggle = config.doneToggle ? `<button class="task-toggle${done ? ' checked' : ''}" type="button" data-action="toggle" aria-label="${done ? 'Mark not done' : 'Mark done'}: ${escape(record.name)}">${done ? '✓' : ''}</button>` : '';
    // Responsible person and whether they're working on it
    const work = config.tracksWork ? app.progress(record, config.key) : null;
    const names = peopleOn(record);
    const person = config.tracksWork || config.showsPerson
      ? `<p class="work-line">${names.length
        ? `${names.map(personName => `<span class="person-chip">👤 ${escape(personName)}</span>`).join('')}${record.thankedAt && done ? '<span class="work-flag thanked">Thanked 🙏</span>' : ''}${work?.nudged ? `<span class="work-flag reminded">Reminded ${escape(daysAgo(work.nudged.at))}</span>` : work?.stalled ? `<span class="work-flag stalled">No update for ${work.idleDays} days</span>` : work ? `<span class="work-flag ok">Working on it</span>` : ''}`
        : `<span class="work-person unassigned">${config.showsPerson ? 'Need someone for this' : 'No one responsible yet'}</span>`}</p>`
      : '';
    const canRemind = work && record.responsible;
    const remindPanel = reminding === record.id && canRemind ? `<div class="remind-panel">
        <p class="remind-title">Send ${escape(record.responsible)} a reminder</p>
        <p class="remind-message">${escape(app.reminderMessage(record, config.key))}</p>
        <div class="remind-actions">
          <a class="primary-button" data-action="remind-send" href="https://wa.me/?text=${encodeURIComponent(app.reminderMessage(record, config.key))}" target="_blank" rel="noopener">Send on WhatsApp</a>
          <button class="secondary-button" type="button" data-action="remind-copy">Copy message</button>
          <button class="text-button" type="button" data-action="remind-close">Cancel</button>
        </div>
      </div>` : '';
    return `<article class="record-card${done ? ' is-done' : ''}${work?.stalled && !work.nudged ? ' is-stalled' : ''}${config.showsPerson && names.length ? ' is-assigned' : ''}" data-id="${escape(record.id)}">
      ${toggle}<div class="record-card-main"><strong>${escape(record.name)} ${status}</strong>${npName(record.name)}${person}${meta.length ? `<p>${meta.map(escape).join(' · ')}</p>` : ''}${record.notes ? `<p class="record-notes">${escape(record.notes)}</p>` : ''}${ritualsHtml(record)}${memoryHtml(record)}</div>
      ${hasAmount ? amountInput(record) : ''}
      <div class="record-actions">${canThank(record) && !record.thankedAt ? `<a class="remind-action thank-action" data-action="thank-send" href="${escape(thankLink(record))}" target="_blank" rel="noopener">Say thanks</a>` : ''}${canRemind ? `<button type="button" class="remind-action" data-action="remind">Remind</button>` : ''}${name === 'events' && hasNeeds(record.name) ? `<button type="button" class="remind-action" data-action="linked">What’s needed</button>` : ''}<button type="button" data-action="edit">Edit</button><button type="button" class="delete-action" data-action="delete">Remove</button></div>
      ${remindPanel}
    </article>`;
  }

  function listHtml(shown) {
    if (!shown.length) {
      return `<div class="tasks-empty"><span aria-hidden="true">♥</span><strong>${records.length ? 'Nothing in this view.' : `Your ${config.title.toLowerCase()} list is ready.`}</strong><p>${records.length ? 'Try another filter, or add something new.' : `Add your first ${config.singular} or start from the suggestions above.`}</p></div>`;
    }
    const g = config.groupBy;
    if (!g) return shown.map(recordHtml).join('');
    const valueOf = (record, spec) => spec.options.some(([key]) => key === record[spec.field]) ? record[spec.field] : spec.fallback;
    return g.options.map(([key, label]) => {
      const inGroup = shown.filter(record => valueOf(record, g) === key);
      if (!inGroup.length) return '';
      const all = records.filter(record => valueOf(record, g) === key);
      const done = all.filter(isDone).length;
      const subs = g.sub
        ? g.sub.options.map(([subKey, subLabel]) => {
          const items = inGroup.filter(record => valueOf(record, g.sub) === subKey);
          return items.length ? `<p class="record-subhead">${subLabel} <span>${items.length}</span></p>${items.map(recordHtml).join('')}` : '';
        }).join('')
        : inGroup.map(recordHtml).join('');
      return `<section class="record-group">
        <div class="record-group-head"><h3>${label}</h3><span>${done} of ${all.length} done</span></div>
        <div class="journey-track"><span style="width:${all.length ? Math.round((done / all.length) * 100) : 0}%"></span></div>
        <div class="record-list">${subs}</div>
        <button class="text-button group-add" type="button" data-action="add" data-occasion="${key}">＋ Add to ${label}</button>
      </section>`;
    }).join('');
  }

  function render() {
    let shown = records.filter(item => filterKeys.every(key => filters[key] === 'all' || (item[key] || (key === 'type' ? 'buy' : '')) === filters[key]));
    if (config.sortBy) shown = [...shown].sort((a, b) => (a[config.sortBy] || '9999').localeCompare(b[config.sortBy] || '9999'));
    const filterLabels = { stage: 'Show', type: 'Show', side: 'Side', status: 'Status' };
    const filterSelect = key => `<label>${filterLabels[key]}<select data-filter="${key}"><option value="all">Everything</option>${optionsFor(key).map(([v, text]) => `<option value="${v}"${v === filters[key] ? ' selected' : ''}>${text}</option>`).join('')}</select></label>`;
    if (name === 'budget') {
      mount.innerHTML = `${summaryHtml()}
      <section class="collection-page">
        <div class="collection-heading"><div><p class="eyebrow">EXTRA COSTS</p><h2>${escape(config.title)}</h2><p>${escape(config.intro)}</p></div><button class="primary-button" type="button" data-action="add"><span aria-hidden="true">＋</span> Add expense</button></div>
        ${formHtml()}
      </section>
      ${costListHtml()}`;
      return;
    }
    mount.innerHTML = `${summaryHtml()}
      <section class="collection-page">
        <div class="collection-heading"><div><p class="eyebrow">YOUR ${config.title.toUpperCase()}</p><h2>${records.length} ${records.length === 1 ? config.singular : config.plural}</h2><p>${escape(config.intro)}</p></div><button class="primary-button" type="button" data-action="add"><span aria-hidden="true">＋</span> Add ${config.singular}</button></div>
        ${linkedHtml()}
        ${suggestionsHtml()}
        ${formHtml()}
        ${records.length && filterKeys.length ? `<div class="collection-toolbar"><span>${shown.length} shown</span><div class="toolbar-filters">${filterKeys.map(filterSelect).join('')}</div></div>` : ''}
        <div class="record-list">${listHtml(shown)}</div>
      </section>`;
  }

  /* A finished occasion or a finished list is worth a small celebration */
  function milestoneFor(record) {
    const g = config.groupBy;
    if (g) {
      const key = g.options.some(([option]) => option === record[g.field]) ? record[g.field] : g.fallback;
      const group = records.filter(item => (g.options.some(([option]) => option === item[g.field]) ? item[g.field] : g.fallback) === key);
      if (group.length > 1 && group.every(isDone)) return `Everything for ${g.options.find(([option]) => option === key)?.[1] || 'this occasion'} is done. ♥`;
    }
    if (records.length > 1 && records.every(isDone)) return `Your whole ${config.title.toLowerCase()} is done. ♥`;
    return '';
  }

  /* ---------- Actions ---------- */
  function openForm(record) {
    editing = record;
    render();
    const card = document.querySelector('#record-form-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
  }

  mount.addEventListener('click', event => {
    const tab = event.target.closest('[data-group]');
    if (tab) {
      openGroup = tab.dataset.group;
      mount.querySelectorAll('[data-group]').forEach(item => { item.classList.toggle('selected', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
      mount.querySelectorAll('[data-group-panel]').forEach(panel => { panel.hidden = panel.dataset.groupPanel !== openGroup; });
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const record = records.find(item => item.id === button.closest('[data-id]')?.dataset.id);
    const action = button.dataset.action;
    if (action === 'add') openForm(button.dataset.occasion ? { occasion: button.dataset.occasion } : name === 'events' ? { stage: filters.stage && filters.stage !== 'all' ? filters.stage : 'wedding' } : {});
    if (action === 'close') { editing = null; render(); }
    if (action === 'edit' && record) openForm(record);
    if (action === 'toggle' && record && config.doneToggle) {
      const { field, done, notDone } = config.doneToggle;
      record[field] = record[field] === done ? notDone : done;
      record.updatedAt = record.progressAt = new Date().toISOString();
      persist();
      log(record, isDone(record) ? 'done' : 'status', isDone(record) ? `marked ${labelFor('status', record.status)}` : `moved back to ${labelFor('status', record.status)}`);
      render();
      const milestone = isDone(record) && milestoneFor(record);
      const thanks = isDone(record) ? thankAction(record) : undefined;
      if (milestone) app.celebrate(milestone, thanks);
      else app.showToast(isDone(record) ? `“${record.name}” marked done.${thanks ? ` Thank ${joinNames(peopleOn(record))}?` : ''}` : `“${record.name}” moved back to your list.`, thanks);
    }
    if (action === 'ritual-preset' && record) {
      openRituals.add(record.id);
      saveRituals(record, makeRituals(ritualsFor(record.name)));
      render();
      app.showToast(`Rituals added to ${record.name}.`);
      return;
    }
    if (action === 'ritual-remove' && record) {
      openRituals.add(record.id);
      const rituals = (record.rituals || []).filter(ritual => ritual.id !== button.dataset.ritualId);
      if (!rituals.length) record.ritualsCleared = true;
      saveRituals(record, rituals);
      render();
      return;
    }
    if (action === 'linked' && record) { linkedFor = [record.name]; render(); document.querySelector('#linked-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (action === 'linked-close') { linkedFor = []; render(); return; }
    if (action === 'thank-send' && record) {
      // Let the WhatsApp link open before the list redraws
      markThanked(record);
      window.setTimeout(render, 0);
      app.showToast(`Thank-you for ${joinNames(peopleOn(record))} saved. ♥`);
      return;
    }
    if (action === 'remind' && record) { reminding = reminding === record.id ? null : record.id; render(); return; }
    if (action === 'remind-close') { reminding = null; render(); return; }
    if ((action === 'remind-send' || action === 'remind-copy') && record) {
      const message = app.reminderMessage(record, config.key);
      if (action === 'remind-copy') navigator.clipboard?.writeText(message).catch(() => {});
      record.nudges = [...(record.nudges || []), { at: new Date().toISOString() }];
      log(record, 'reminder', `reminder sent to ${record.responsible}`);
      reminding = null;
      persist();
      // Let the WhatsApp link open before the list redraws
      window.setTimeout(render, 0);
      app.showToast(action === 'remind-copy' ? `Message copied. Reminder for ${record.responsible} saved.` : `Reminder for ${record.responsible} saved.`);
      return;
    }
    // Remove straight away and offer Undo, instead of asking "Are you sure?" first
    if (action === 'delete' && record) {
      const index = records.indexOf(record);
      records = records.filter(item => item.id !== record.id);
      log(record, 'removed', 'removed');
      if (editing?.id === record.id) editing = null;
      if (reminding === record.id) reminding = null;
      persist(); render();
      app.showToast(`“${record.name}” removed.`, { label: 'Undo', run: () => {
        if (records.some(item => item.id === record.id)) return;
        records.splice(Math.min(index, records.length), 0, record);
        log(record, 'added', 'restored');
        persist(); render();
        app.showToast(`“${record.name}” is back.`);
      } });
    }
  });

  mount.addEventListener('change', event => {
    const key = event.target.dataset.filter;
    if (key) { filters[key] = event.target.value; render(); return; }
    if ('ritual' in event.target.dataset) {
      const record = records.find(item => item.id === event.target.closest('[data-id]')?.dataset.id);
      const ritual = record?.rituals?.find(item => item.id === event.target.dataset.ritual);
      if (!ritual) return;
      ritual.done = event.target.checked;
      saveRituals(record, record.rituals);
      if (ritual.done) log(record, 'done', `ritual ready: ${ritual.name}`);
      openRituals.add(record.id);
      render();
      const left = record.rituals.filter(item => !item.done).length;
      if (ritual.done && !left) app.celebrate(`Every ritual for ${record.name} is ready. ♥`);
      else app.showToast(ritual.done ? `“${ritual.name}” is ready. ${left} to go.` : `“${ritual.name}” moved back.`);
      return;
    }
    if ('amount' in event.target.dataset) saveAmount(event.target);
  });
  // Remember which ritual checklists are open so a redraw keeps them open
  mount.addEventListener('toggle', event => {
    if (!event.target.matches?.('[data-ritual-panel]')) return;
    const id = event.target.closest('[data-id]')?.dataset.id;
    if (id) event.target.open ? openRituals.add(id) : openRituals.delete(id);
  }, true);
  mount.addEventListener('keydown', event => {
    if (event.key === 'Enter' && 'amount' in event.target.dataset) { event.preventDefault(); event.target.blur(); }
  });

  /* Save a price typed into a row's cost box */
  function saveAmount(input) {
    const raw = input.value.trim();
    const amount = raw === '' ? null : Number(raw);
    if (amount != null && (Number.isNaN(amount) || amount < 0)) { app.showToast('Enter a cost of 0 or more.'); return; }
    const now = new Date().toISOString();
    const otherKey = input.dataset.costKey && input.dataset.costKey !== config.key ? input.dataset.costKey : null;
    if (otherKey) {
      const id = input.dataset.costId;
      const before = app.list(otherKey).find(item => item.id === id);
      const saved = app.list(otherKey).map(item => item.id === id ? { ...item, amount, updatedAt: now } : item);
      if (!storage.set(otherKey, saved)) { app.showToast('Could not save. Check your browser storage settings.'); return; }
      if (before && !sameAmount(before.amount, amount)) log(before, 'cost', costText(before.amount, amount), pageFor(otherKey));
    } else {
      const id = input.dataset.costId || input.closest('[data-id]')?.dataset.id;
      const before = records.find(item => item.id === id);
      records = records.map(item => item.id === id ? { ...item, amount, updatedAt: now } : item);
      persist();
      if (before && !sameAmount(before.amount, amount)) log(before, 'cost', costText(before.amount, amount));
    }
    // Re-render to update totals, then put focus back where the user was heading
    const next = document.activeElement;
    const nextId = next && 'amount' in next.dataset ? (next.dataset.costId || next.closest('[data-id]')?.dataset.id) : null;
    render();
    if (nextId) mount.querySelector(`[data-cost-id="${CSS.escape(nextId)}"], [data-id="${CSS.escape(nextId)}"] [data-amount]`)?.focus();
    app.showToast(amount == null ? 'Cost cleared.' : `Cost saved: ${money(amount)}`);
  }

  mount.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.target);
    if ('ritualForm' in event.target.dataset) {
      const record = records.find(item => item.id === event.target.closest('[data-id]')?.dataset.id);
      const ritualName = String(form.get('ritual') || '').trim();
      if (!record || !ritualName) return;
      openRituals.add(record.id);
      saveRituals(record, [...(record.rituals || []), ...makeRituals([ritualName])]);
      render();
      mount.querySelector(`[data-id="${CSS.escape(record.id)}"] .ritual-add input`)?.focus();
      app.showToast(`Ritual added to ${record.name}.`);
      return;
    }
    if ('memoryForm' in event.target.dataset) {
      const record = records.find(item => item.id === event.target.closest('[data-id]')?.dataset.id);
      const memory = String(form.get('memory') || '').trim();
      if (!record || !memory) return;
      record.memory = memory;
      record.updatedAt = new Date().toISOString();
      log(record, 'edit', 'moment to remember added');
      persist(); render();
      app.showToast(`Saved a moment from ${record.name}. ♥`);
      return;
    }
    if (event.target.id === 'linked-form') {
      const chosen = form.getAll('linked');
      if (!chosen.length) { app.showToast('Tick at least one item first.'); return; }
      const counts = addLinked(chosen);
      linkedFor = [];
      render();
      const summary = Object.entries(counts).map(([label, count]) => `${count} to ${label}`).join(', ');
      app.showToast(summary ? `Added ${summary}.` : 'Those are already in your lists.');
      return;
    }
    if (event.target.id === 'suggestion-form') {
      const s = config.suggestions;
      const chosen = form.getAll('suggestion');
      if (!chosen.length) { app.showToast('Tick at least one item first.'); return; }
      const added = [];
      s.groups.forEach(group => group.sections.forEach(section => section.items.forEach(item => {
        if (chosen.includes(`${group.key}|${section.key}|${item.name}`)) added.push({ id: uid(config.key), ...s.toRecord(item, group, section), updatedAt: new Date().toISOString() });
      })));
      records = [...records, ...added];
      if (added.length) app.notify({ kind: 'added', title: `${added.length} ${added.length === 1 ? config.singular : config.plural}`, text: `added from suggestions: ${added.slice(0, 3).map(item => item.name).join(', ')}${added.length > 3 ? '…' : ''}`, section: sectionNames[name] || name, href: `pages/${name}.html` });
      persist();
      if (name === 'events') linkedFor = added.map(item => item.name).filter(hasNeeds);
      render();
      if (linkedFor.length) document.querySelector('#linked-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      app.showToast(`${added.length} ${added.length === 1 ? config.singular : config.plural} added.${linkedFor.length ? ' Here’s what you’ll need for them.' : ''}`);
      return;
    }
    if (event.target.id !== 'record-form') return;
    const data = Object.fromEntries(config.fields.map(([key, , type]) => {
      const value = String(form.get(key) ?? '').trim();
      return [key, type === 'number' ? (value === '' ? null : Number(value)) : value];
    }));
    if (!data.name) return;
    const existing = editing?.id ? editing : null;
    const now = new Date().toISOString();
    const moved = !existing || existing.status !== data.status || (existing.responsible || '') !== (data.responsible || '');
    if (config.showsPerson) {
      const someone = peopleOn(data).length > 0;
      if (someone && data.status === 'open') data.status = 'asked';
      if (!someone && data.status === 'asked') data.status = 'open';
    }
    const record = { ...existing, ...data, ...(config.ownSideOnly ? { side: mySide } : {}), id: existing?.id || uid(config.key), updatedAt: now, ...(config.tracksWork && moved ? { progressAt: now } : {}) };
    records = existing ? records.map(item => item.id === existing.id ? record : item) : [record, ...records];
    editing = null;
    logChanges(existing, record);
    persist(); render(); app.showToast(`${capital(config.singular)} ${existing ? 'updated' : 'added'}.`);
  });

  render();
})();
