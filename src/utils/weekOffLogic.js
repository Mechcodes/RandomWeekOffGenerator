// src/utils/weekOffLogic.js

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeeksInMonth(year, month) {
  const weeks = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const week = [];
    for (let i = 0; i < 7 && date.getMonth() === month; i++) {
      week.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function canAssignDayOff(person, day, campaignMap, langMap, campaignPeopleCount, personHistory) {
  // Check campaign conflict
  const campaignSet = campaignMap[day][person.Campaign] || new Set();
  const isCampaignConflict = campaignPeopleCount <= 6 && campaignSet.size > 0;
  
  if (isCampaignConflict) {
    return false;
  }

  // Check language conflicts
  const langList = person.Language.split('/').map(l => l.trim().toLowerCase());
  const langSet = langMap[day];
  
  // Check if any non-Hindi/English language conflicts exist
  const isLangConflict = langList.some(lang => 
    lang !== 'hindi' && 
    lang !== 'english' && 
    langSet.has(lang)
  );

  // Check for long weekend conflicts
  const history = personHistory[person.Name] || [];
  const lastWeekOff = history[history.length - 1];
  
  // If last week was Saturday, prevent Monday this week
  if (lastWeekOff === 'Saturday' && day === 'Monday') {
    return false;
  }
  
  // If last week was Monday, prevent Saturday this week
  if (lastWeekOff === 'Monday' && day === 'Saturday') {
    return false;
  }

  return !isLangConflict;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateWeekOffs(people, year, month) {
  if (!year || month === undefined) {
    const today = new Date();
    year = today.getFullYear();
    month = today.getMonth();
  }
  
  const weeks = getWeeksInMonth(year, month);
  const finalOutput = [];
  const personHistory = {}; // Track week-off history for each person
  
  // Group people by campaign to get counts
  const campaignCounts = {};
  people.forEach(person => {
    campaignCounts[person.Campaign] = (campaignCounts[person.Campaign] || 0) + 1;
    personHistory[person.Name] = [];
  });

  // Process each week
  weeks.forEach((week, weekIndex) => {
    const unassignedPeople = JSON.parse(JSON.stringify(people));
    const campaignMap = {};
    const langMap = {};

    // Initialize maps for each day
    weekdays.forEach(day => {
      campaignMap[day] = {};
      langMap[day] = new Set();
    });

    // Shuffle weekdays to randomize assignments
    const shuffledWeekdays = shuffleArray([...weekdays]);

    // First pass: Try to assign people to their optimal days
    for (const day of shuffledWeekdays) {
      // Shuffle people to randomize assignments
      shuffleArray(unassignedPeople);
      
      let i = 0;
      while (i < unassignedPeople.length) {
        const person = unassignedPeople[i];
        
        if (canAssignDayOff(person, day, campaignMap, langMap, campaignCounts[person.Campaign], personHistory)) {
          // Assign the day off
          const langList = person.Language.split('/').map(l => l.trim().toLowerCase());
          
          // Update language map
          langList.forEach(lang => {
            if (lang !== 'hindi' && lang !== 'english') {
              langMap[day].add(lang);
            }
          });

          // Update campaign map
          if (!campaignMap[day][person.Campaign]) {
            campaignMap[day][person.Campaign] = new Set();
          }
          campaignMap[day][person.Campaign].add(person.Name);

          // Update person's history
          personHistory[person.Name].push(day);

          // Add to final output
          const weekOffDate = week.find(d => d.getDay() === weekdays.indexOf(day) + 1);
          finalOutput.push({
            Name: person.Name,
            Campaign: person.Campaign,
            Language: person.Language,
            'Week Off Date': weekOffDate?.toISOString().split('T')[0] || 'N/A',
            'Week Off Day': day,
            'Week Number': weekIndex + 1
          });

          // Remove from unassigned list
          unassignedPeople.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    // Second pass: Force assign any remaining people
    if (unassignedPeople.length > 0) {
      for (const person of unassignedPeople) {
        // Find the day with least conflicts, avoiding long weekends if possible
        let bestDay = shuffledWeekdays[0];
        let minConflicts = Infinity;

        // Shuffle weekdays again for remaining assignments
        const shuffledDaysForRemaining = shuffleArray([...weekdays]);

        for (const day of shuffledDaysForRemaining) {
          const campaignSet = campaignMap[day][person.Campaign] || new Set();
          const langList = person.Language.split('/').map(l => l.trim().toLowerCase());
          const conflictingLangs = langList.filter(lang => 
            lang !== 'hindi' && 
            lang !== 'english' && 
            langMap[day].has(lang)
          ).length;

          // Check long weekend conflicts
          const lastWeekOff = personHistory[person.Name]?.[personHistory[person.Name].length - 1];
          const isLongWeekendConflict = 
            (lastWeekOff === 'Saturday' && day === 'Monday') ||
            (lastWeekOff === 'Monday' && day === 'Saturday');

          const totalConflicts = campaignSet.size + conflictingLangs + (isLongWeekendConflict ? 10 : 0);
          if (totalConflicts < minConflicts) {
            minConflicts = totalConflicts;
            bestDay = day;
          }
        }

        // Assign to the best available day
        const langList = person.Language.split('/').map(l => l.trim().toLowerCase());
        langList.forEach(lang => {
          if (lang !== 'hindi' && lang !== 'english') {
            langMap[bestDay].add(lang);
          }
        });

        if (!campaignMap[bestDay][person.Campaign]) {
          campaignMap[bestDay][person.Campaign] = new Set();
        }
        campaignMap[bestDay][person.Campaign].add(person.Name);

        // Update person's history
        personHistory[person.Name].push(bestDay);

        const weekOffDate = week.find(d => d.getDay() === weekdays.indexOf(bestDay) + 1);
        finalOutput.push({
          Name: person.Name,
          Campaign: person.Campaign,
          Language: person.Language,
          'Week Off Date': weekOffDate?.toISOString().split('T')[0] || 'N/A',
          'Week Off Day': bestDay,
          'Week Number': weekIndex + 1,
          'Note': minConflicts > 0 ? 'Assigned with minimal conflicts' : ''
        });
      }
    }
  });

  // Sort the output by Name and Week Number for better readability
  finalOutput.sort((a, b) => {
    if (a.Name === b.Name) {
      return a['Week Number'] - b['Week Number'];
    }
    return a.Name.localeCompare(b.Name);
  });

  return finalOutput;
}

export { generateWeekOffs };

