#!/usr/bin/env node

const { downloadYouTubeVideo } = require('../utils/ytb-download');

const url = process.argv[2] || process.env.YTB_URL;
const outputPath = process.argv[3] || './downloads';
const format = (process.argv[4] || 'mp3').toLowerCase();
const bitrate = parseInt(process.argv[5] || '192', 10);

if (!url) {
  console.error(
    'Usage: node scripts/run-ytb.js <YOUTUBE_URL> [outputPath] [format(mp3|mp4)] [bitrate]'
  );
  process.exit(1);
}

(async () => {
  try {
    const file = await downloadYouTubeVideo({
      url,
      outputPath,
      format,
      bitrate
    });
    console.log('Saved to:', file);
    process.exit(0);
  } catch (err) {
    console.error('Download failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
