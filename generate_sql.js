const fs = require('fs');

async function generateSql() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const BASE_URL = 'https://v3.football.api-sports.io';
  const LEAGUES = [39, 140, 135, 78, 61];
  
  let sql = `-- 🚨 STEP 1: RUN THIS TO WIPE CORRUPTED DATA
DELETE FROM "Prediction";
DELETE FROM "Match";

-- 📡 STEP 2: RUN THIS TO POPULATE CLEAN DATA
`;

  const dates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  for (const dateStr of dates) {
    for (const leagueId of LEAGUES) {
      console.log(`🔍 Syncing league ${leagueId} on ${dateStr}...`);
      try {
        // Try multiple seasons to find data
        const seasonsToTry = [2025, 2024];
        let fixtures = [];
        let successSeason = '';

        for (const s of seasonsToTry) {
          const resp = await fetch(`${BASE_URL}/fixtures?date=${dateStr}&league=${leagueId}&season=${s}`, {
            headers: { 'x-apisports-key': API_KEY }
          });
          const data = await resp.json();
          if (data.response && data.response.length > 0) {
            fixtures = data.response;
            successSeason = s.toString();
            break;
          }
        }
        
        if (fixtures.length > 0) {
          console.log(`   ✅ Found ${fixtures.length} fixtures using season ${successSeason}!`);
          for (const f of fixtures.slice(0, 10)) {
            const id = f.fixture.id;
            const home = f.teams.home.name.replace(/'/g, "''");
            const away = f.teams.away.name.replace(/'/g, "''");
            const league = f.league.name.replace(/'/g, "''");
            const kickoff = f.fixture.date;
            
            sql += `INSERT INTO "Match" (id, "homeTeamId", "awayTeamId", league, season, "kickoffTime", status) 
VALUES ('${id}', '${home}', '${away}', '${league}', '${successSeason}', '${kickoff}', 'SCHEDULED')
ON CONFLICT (id) DO UPDATE SET 
  "homeTeamId" = EXCLUDED."homeTeamId",
  "awayTeamId" = EXCLUDED."awayTeamId",
  league = EXCLUDED.league,
  season = EXCLUDED.season,
  "kickoffTime" = EXCLUDED."kickoffTime";\n`;
          }
        }
      } catch (e) {
        console.error(`Error league ${leagueId} on ${dateStr}:`, e.message);
      }
    }
  }

  fs.writeFileSync('sync_data.sql', sql);
  console.log('✅ Final sync_data.sql generated.');
}

generateSql();
