// Vercel Serverless Function for News
// このファイルは /api/news エンドポイントとして動作します

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
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_NEWS_TABLE_NAME;

    // 環境変数のチェック
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Airtable credentials not configured'
      });
    }

    // Airtable APIのURLとパラメータを構築
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    // URLSearchParamsを使ってクエリパラメータを構築
    const params = new URLSearchParams({
      filterByFormula: '{公開} = TRUE()',
    });

    // ソート順を追加（新しい順）
    params.append('sort[0][field]', '日付');
    params.append('sort[0][direction]', 'desc');

    // Airtable APIからデータを取得
    const airtableResponse = await fetch(`${airtableUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
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

    // レコードを整形して返す
    const newsItems = data.records.map(record => {
      // サムネイル画像の取得（アタッチメント優先、なければURL）
      let thumbnailUrl = '';
      let images = [];

      // 1. アタッチメントフィールドをチェック
      if (record.fields['サムネイル画像'] && Array.isArray(record.fields['サムネイル画像']) && record.fields['サムネイル画像'].length > 0) {
        thumbnailUrl = record.fields['サムネイル画像'][0].url;
        // 全ての画像URLを配列として保存
        images = record.fields['サムネイル画像'].map(img => img.url);
      }
      // 2. アタッチメントがなければURL文字列フィールドを使用
      else if (record.fields['サムネイル画像URL']) {
        thumbnailUrl = record.fields['サムネイル画像URL'];
        images = [thumbnailUrl];
      }

      return {
        id: record.id,
        title: record.fields['タイトル'] || '',
        date: record.fields['日付'] || '',
        summary: record.fields['概要'] || '',
        content: record.fields['本文'] || '',
        thumbnailUrl: thumbnailUrl,
        images: images,
        published: record.fields['公開'] || false,
        createdTime: record.createdTime
      };
    });

    // 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      news: newsItems,
      count: newsItems.length
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
