async function checkStatus() {
  const API_KEY = '8052001c13b6a7149d6cbb63a3633f06';
  const resp = await fetch(`https://v3.football.api-sports.io/status`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  const data = await resp.json();
  console.log('📊 API Status:', JSON.stringify(data, null, 2));
}
checkStatus();
