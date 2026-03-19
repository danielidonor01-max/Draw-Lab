async function findSeason() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  console.log('🔍 Finding current season for EPL (39)...');
  const resp = await fetch(`${BASE_URL}/leagues?id=39`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const data = await resp.json();
  const seasons = data.response[0].seasons;
  const current = seasons.find(s => s.current);
  console.log(`✅ Current season for league 39: ${current.year}`);
  
  // Now generate the SQL with the CORRECT season
  // ... (rest of generate_sql logic inside)
}
findSeason();
