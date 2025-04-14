// utils/generateWeekOffs.js
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getUniqueDay(usedDays) {
  const available = DAYS.filter(day => !usedDays.includes(day));
  return available[Math.floor(Math.random() * available.length)];
}

function expandLanguages(language) {
  return language.split('/').map(l => l.trim());
}

export function generateWeekOffs(data) {
  const campaignMap = {};
  const languageMap = {};

  // Group data by campaign
  for (let person of data) {
    const campaign = person.Campaign.trim();
    if (!campaignMap[campaign]) campaignMap[campaign] = [];
    campaignMap[campaign].push(person);
  }

  const result = [];

  for (const [campaign, members] of Object.entries(campaignMap)) {
    const isStrict = members.length < 6;
    const usedDaysInCampaign = {};
    const usedDaysByLanguage = {};

    for (const person of members) {
      const languages = expandLanguages(person.Language || '');
      let assignedDay;
      let attempts = 0;

      while (!assignedDay && attempts < 100) {
        const tryDay = DAYS[Math.floor(Math.random() * DAYS.length)];
        const dayConflict =
          isStrict && Object.values(usedDaysInCampaign).includes(tryDay);

        const languageConflict = languages.some(lang => {
          return usedDaysByLanguage[lang]?.includes(tryDay);
        });

        if (!dayConflict && !languageConflict) {
          assignedDay = tryDay;
        }

        attempts++;
      }

      // Assign day
      person.WeekOff = assignedDay || 'None';

      if (isStrict) {
        usedDaysInCampaign[person.Name] = person.WeekOff;
      }

      for (const lang of languages) {
        if (!usedDaysByLanguage[lang]) usedDaysByLanguage[lang] = [];
        usedDaysByLanguage[lang].push(person.WeekOff);
      }

      result.push(person);
    }
  }

  return result;
}
