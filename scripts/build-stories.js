#!/usr/bin/env node
// assets/web/data のMarkdownファイルからJSONを生成するスクリプト
// 使用方法: node scripts/build-stories.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../assets/web/data');
const outputDir = path.join(__dirname, '../public/stories');
const indexPath = path.join(__dirname, '../public/stories.json');

// 出力ディレクトリを作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// frontmatterをパース
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    // frontmatterがない場合、preambleを除去してから再試行
    const preambleMatch = content.match(/^([\s\S]*?)(^---)/m);
    if (preambleMatch) {
      const trimmed = content.substring(preambleMatch.index + preambleMatch[1].length);
      return parseFrontmatter(trimmed);
    }
    return { data: {}, content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const data = {};
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      // クォートを除去
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  });

  return { data, content: body };
}

// タイトルと抜粋を抽出
function extractTitleAndExcerpt(content) {
  // タイトル（最初のH1）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1].trim() : 'Untitled';
  // 【タイトル】【物語】などのプレフィックスを除去
  title = title.replace(/^【[^】]+】[:：]?\s*/, '');

  // 抜粋（タイトル後の最初の段落）
  const contentWithoutTitle = content.replace(/^#\s+(.+)$/m, '');
  const excerptMatch = contentWithoutTitle.match(/(?:\r?\n){2}([\s\S]+?)(?:\r?\n){2}/);
  let excerpt = excerptMatch ? excerptMatch[1].trim().substring(0, 150) + '...' : '';
  excerpt = excerpt.replace(/[*#]/g, '');

  return { title, excerpt };
}

// Markdownを読み込んで処理
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.md'));
const stories = [];

files.forEach(filename => {
  const id = filename.replace(/^generated_/, '').replace(/\.md$/, '');
  const filepath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filepath, 'utf8');

  let data = {};
  let body = raw;

  // ファイルの先頭が---で始まるか、preamble後に---があるかチェック
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('---')) {
    // frontmatterあり
    const { data: parsedData, content: parsedBody } = parseFrontmatter(trimmed);
    data = parsedData;
    body = parsedBody;
  } else {
    // preamble + frontmatter の可能性をチェック（行頭が---で始まる行を探す）
    const lines = raw.split('\n');
    let frontmatterStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        frontmatterStart = i;
        break;
      }
      // #で始まる行（タイトル）が先に見つかったらfrontmatterなし
      if (lines[i].trim().startsWith('#')) {
        break;
      }
    }

    if (frontmatterStart >= 0) {
      // ---の次の非空行が#で始まる場合は水平線なのでスキップ
      let nextNonEmptyLine = '';
      for (let j = frontmatterStart + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          nextNonEmptyLine = lines[j].trim();
          break;
        }
      }
      if (!nextNonEmptyLine.startsWith('#')) {
        const afterPreamble = lines.slice(frontmatterStart).join('\n');
        const { data: parsedData, content: parsedBody } = parseFrontmatter(afterPreamble);
        data = parsedData;
        body = parsedBody;
      }
    }
    // frontmatterがない場合はbody = rawのまま
  }

  const { title, excerpt } = extractTitleAndExcerpt(body);

  const story = {
    id,
    title,
    excerpt,
    learnerId: data.learner_id || '',
    generatedAt: data.generated_at || '2024-01-01 00:00:00',
    storyType: data.story_type || '',
  };

  stories.push(story);

  // 個別ファイルも保存（詳細ページ用）
  const storyDetail = {
    ...story,
    content: body,
  };
  fs.writeFileSync(
    path.join(outputDir, `${id}.json`),
    JSON.stringify(storyDetail, null, 2)
  );
});

// 日付で降順ソート
stories.sort((a, b) => {
  if (a.generatedAt < b.generatedAt) return 1;
  return -1;
});

// インデックスを保存
fs.writeFileSync(indexPath, JSON.stringify({
  success: true,
  count: stories.length,
  stories,
}, null, 2));

console.log(`Generated ${stories.length} stories`);
console.log(`Index: ${indexPath}`);
console.log(`Details: ${outputDir}/`);
