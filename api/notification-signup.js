// Vercel Serverless Function for Notification Signup
// このファイルは /api/notification-signup エンドポイントとして動作します

export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;

    // バリデーション
    if (!name || !email) {
      return res.status(400).json({
        error: 'Bad request',
        details: 'Name and email are required'
      });
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad request',
        details: 'Invalid email format'
      });
    }

    // 環境変数から設定を取得
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_NOTIFICATION_TABLE_NAME;

    // 環境変数のチェック
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Airtable credentials not configured'
      });
    }

    // Airtable APIにデータを送信
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    const fields = {
      'お名前': name,
      'メールアドレス': email,
      '通知ステータス': '未通知'
    };

    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    // Airtableからのレスポンスをチェック
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable API error:', errorData);
      return res.status(airtableResponse.status).json({
        error: 'Failed to submit to Airtable',
        details: errorData
      });
    }

    const data = await airtableResponse.json();

    // 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      message: '通知登録が完了しました',
      recordId: data.id
    });

  } catch (error) {
    console.error('Error submitting notification signup:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
