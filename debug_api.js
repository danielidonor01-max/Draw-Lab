async function debugFixtures() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const BASE_URL = 'https://v3.football.api-sports.io';
  const LEAGUES = [39, 140, 135, 78, 61];
  
  for (const id of LEAGUES) {
    console.log(`🔍 Fetching next 10 for league ${id}...`);
    const resp = await fetch(`${BASE_URL}/fixtures?next=10&league=${id}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await resp.json();
    if (data.response && data.response.length > 0) {
      console.log(`   📅 Next match: ${data.response[0].fixture.date} (${data.response[0].teams.home.name})`);
    } else {
      console.log(`   ❌ No upcoming fixtures found.`);
    }
  }
}
debugFixtures();
