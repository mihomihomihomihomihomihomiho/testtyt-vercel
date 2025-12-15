// Vercel Serverless Function for Contact Form
// このファイルは /api/contact エンドポイントとして動作します

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
    // 環境変数から設定を取得
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    // 環境変数のチェック
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Airtable credentials not configured'
      });
    }

    // リクエストボディからフォームデータを取得
    const { name, email, category, message, company } = req.body;

    // バリデーション
    if (!name || !email || !category || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'category', 'message']
      });
    }

    // Airtable APIにデータを送信
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

    // Airtableに送信するフィールド
    const fields = {
      'お名前': name,
      'メールアドレス': email,
      'お問い合わせ': category,
      'お問い合わせ内容': message,
      '個人情報': true, // 同意済みのみ送信される
    };

    // 会社名が入力されている場合のみ追加
    if (company) {
      fields['会社名'] = company;
    }

    // デバッグ用ログ
    console.log('Sending to Airtable:', {
      url: airtableUrl,
      fields: fields
    });

    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields })
    });

    // Airtableからのレスポンスをチェック
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable API error:', errorData);
      return res.status(airtableResponse.status).json({
        error: 'Failed to save to Airtable',
        details: errorData
      });
    }

    const data = await airtableResponse.json();

    // 成功レスポンスを返す
    return res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      id: data.id
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
