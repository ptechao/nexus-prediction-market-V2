import axios from "axios";
async function main() {
  const response = await axios.get("https://api.manifold.markets/v0/markets", {
    params: { limit: 20 },
  });
  response.data.forEach((m: any) => {
    console.log(`Title: ${m.question}`);
    console.log(`Slugs: ${m.groupSlugs?.join(', ') || 'none'}`);
    console.log('---');
  });
}
main();
