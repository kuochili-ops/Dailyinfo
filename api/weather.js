export default async function handler(req, res) {
  const { city = "臺北市" } = req.query;
  const API_KEY = "CWA-A6F3874E-27F3-4AA3-AF5A-96B365798F79";
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}&locationName=${encodeURIComponent(city)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "天氣資料取得失敗", details: error.message });
  }
}
