async function findFixtures() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const BASE_URL = 'https://v3.football.api-sports.io';
  const LEAGUES = [39, 140, 135, 78, 61];
  
  const from = '2026-03-19';
  const to = '2026-03-31';

  for (const id of LEAGUES) {
    console.log(`🔍 Checking league ${id} from ${from} to ${to}...`);
    const resp = await fetch(`${BASE_URL}/fixtures?league=${id}&season=2025&from=${from}&to=${to}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await resp.json();
    if (data.response && data.response.length > 0) {
      console.log(`   ✅ Found ${data.response.length} fixtures! First is ${data.response[0].fixture.date} (${data.response[0].teams.home.name})`);
    } else {
      console.log(`   ❌ No fixtures found.`);
    }
  }
}
findFixtures();
