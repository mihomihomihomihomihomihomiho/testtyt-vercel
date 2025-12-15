// Vercel Serverless Function for Reading Resources
// このファイルは /api/reading エンドポイントとして動作します

export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETリクエストのみ受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数から設定を取得
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_READING_TABLE_NAME;

    // 環境変数のチェック
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Airtable credentials not configured'
      });
    }

    // Airtable APIからデータを取得
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    // クエリパラメータ: 公開フラグがtrueのもののみ、公開日の降順で取得
    const params = new URLSearchParams({
      filterByFormula: '{公開} = TRUE()',
      sort: [JSON.stringify({ field: '公開日', direction: 'desc' })]
    });

    const airtableResponse = await fetch(`${airtableUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      }
    });

    // Airtableからのレスポンスをチェック
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable API error:', errorData);
      return res.status(airtableResponse.status).json({
        error: 'Failed to fetch from Airtable',
        details: errorData
      });
    }

    const data = await airtableResponse.json();

    // レコードを整形
    const resources = data.records.map(record => ({
      id: record.id,
      title: record.fields['タイトル'] || '',
      url: record.fields['URL'] || '',
      category: record.fields['カテゴリ'] || '',
      description: record.fields['説明'] || '',
      publishedDate: record.fields['公開日'] || '',
      youtubeId: record.fields['YouTube ID'] || '',
      thumbnail: record.fields['サムネイル'] ? record.fields['サムネイル'][0]?.url : null,
    }));

    // 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      count: resources.length,
      resources: resources
    });

  } catch (error) {
    console.error('Error fetching reading resources:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
