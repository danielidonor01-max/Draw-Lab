async function findLatestSeasons() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const BASE_URL = 'https://v3.football.api-sports.io';
  const LEAGUES = [39, 140, 135, 78, 61];
  
  for (const id of LEAGUES) {
    const resp = await fetch(`${BASE_URL}/leagues?id=${id}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await resp.json();
    const seasons = data.response[0].seasons;
    const current = seasons.find(s => s.current);
    console.log(`League ${id}: current=${current.year}, latest=${seasons[seasons.length-1].year}`);
  }
}
findLatestSeasons();
