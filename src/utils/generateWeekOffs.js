// utils/generateWeekOffs.js

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getRandomDay() {
  return DAYS[Math.floor(Math.random() * DAYS.length)];
}

function expandLanguages(language) {
  return language.split('/').map(l => l.trim());
}

export function generateWeekOffs(data) {
  const campaignMap = {};
  const languageMap = {};

  // Group by campaign
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

      // Try 100 times to find a conflict-free day
      while (!assignedDay && attempts < 100) {
        const tryDay = getRandomDay();

        const campaignConflict = isStrict && Object.values(usedDaysInCampaign).includes(tryDay);
        const languageConflict = languages.some(lang => usedDaysByLanguage[lang]?.includes(tryDay));

        if (!campaignConflict && !languageConflict) {
          assignedDay = tryDay;
          break;
        }

        attempts++;
      }

      // Fallback: assign a random day even if conflict remains
      if (!assignedDay) {
        assignedDay = getRandomDay();
      }

      // Save week off
      person.WeekOff = assignedDay;

      if (isStrict) {
        usedDaysInCampaign[person.Name] = assignedDay;
      }

      for (const lang of languages) {
        if (!usedDaysByLanguage[lang]) usedDaysByLanguage[lang] = [];
        usedDaysByLanguage[lang].push(assignedDay);
      }

      result.push(person);
    }
  }

  return result;
}
