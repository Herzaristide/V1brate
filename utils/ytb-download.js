'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getVideoInfo =
  exports.downloadMultipleVideos =
  exports.downloadYouTubeVideo =
    void 0;
const ffmpeg_static_1 = require('ffmpeg-static');
const fluent_ffmpeg_1 = require('fluent-ffmpeg');
const fs_1 = require('fs');
const path_1 = require('path');
const ytdl_core_1 = require('ytdl-core');
// ytdl-core may export the function directly (CommonJS) or as default (ESM transpiled).
const ytdl =
  ytdl_core_1 && ytdl_core_1.default ? ytdl_core_1.default : ytdl_core_1;
// Set ffmpeg path
if (ffmpeg_static_1.default) {
  fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
/**
 * Download YouTube video/audio
 * @param options Download configuration options
 * @returns Promise that resolves when download is complete
 */
async function downloadYouTubeVideo(options) {
  const {
    url,
    outputPath = './downloads',
    format = 'mp3',
    quality = format === 'mp3' ? 'highestaudio' : 'highest',
    bitrate = 128
  } = options;
  // Validate YouTube URL
  if (!ytdl.validateURL(url)) {
    throw new Error('Invalid YouTube URL provided');
  }
  try {
    // Get video info
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // Remove special characters
    // Ensure output directory exists
    if (!fs_1.default.existsSync(outputPath)) {
      fs_1.default.mkdirSync(outputPath, { recursive: true });
    }
    const outputFile = path_1.default.join(outputPath, `${title}.${format}`);
    return new Promise((resolve, reject) => {
      try {
        // Get stream based on format
        const stream = ytdl(url, {
          quality: quality,
          filter: format === 'mp3' ? 'audioonly' : 'audioandvideo'
        });
        const ffmpegCommand = (0, fluent_ffmpeg_1.default)(stream);
        if (format === 'mp3') {
          // Audio-only conversion
          ffmpegCommand
            .audioBitrate(bitrate)
            .toFormat('mp3')
            .audioCodec('libmp3lame');
        } else {
          // Video conversion
          ffmpegCommand.videoCodec('libx264').audioCodec('aac').toFormat('mp4');
        }
        ffmpegCommand
          .save(outputFile)
          .on('start', (commandLine) => {
            console.log('🚀 Starting download:', title);
            console.log('📄 Command:', commandLine);
          })
          .on('progress', (progress) => {
            const percent = progress.percent
              ? progress.percent.toFixed(2)
              : '0';
            process.stdout.write(
              `⏳ Progress: ${percent}% | Time: ${progress.timemark || 'N/A'}\r`
            );
          })
          .on('end', () => {
            console.log(
              `\n✅ ${format.toUpperCase()} downloaded successfully: "${outputFile}"`
            );
            resolve(outputFile);
          })
          .on('error', (err) => {
            console.error('\n❌ FFmpeg Error:', err.message);
            reject(new Error(`FFmpeg conversion failed: ${err.message}`));
          });
        // Handle stream errors
        stream.on('error', (err) => {
          console.error('❌ Stream Error:', err.message);
          reject(new Error(`Stream error: ${err.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    throw new Error(
      `Failed to get video info: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
exports.downloadYouTubeVideo = downloadYouTubeVideo;
/**
 * Download multiple YouTube videos
 * @param urls Array of YouTube URLs
 * @param options Download configuration options
 * @returns Promise that resolves when all downloads are complete
 */
async function downloadMultipleVideos(urls, options = {}) {
  const results = [];
  for (const url of urls) {
    try {
      console.log(
        `\n📥 Starting download ${results.length + 1}/${urls.length}`
      );
      const result = await downloadYouTubeVideo({ ...options, url });
      results.push(result);
      console.log(`✅ Completed ${results.length}/${urls.length}`);
    } catch (error) {
      console.error(
        `❌ Failed to download ${url}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
  return results;
}
exports.downloadMultipleVideos = downloadMultipleVideos;
/**
 * Get video information without downloading
 * @param url YouTube video URL
 * @returns Video information
 */
async function getVideoInfo(url) {
  if (!ytdl.validateURL(url)) {
    throw new Error('Invalid YouTube URL provided');
  }
  try {
    const info = await ytdl.getInfo(url);
    return {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      duration: info.videoDetails.lengthSeconds,
      description: info.videoDetails.shortDescription,
      thumbnails: info.videoDetails.thumbnails,
      viewCount: info.videoDetails.viewCount,
      uploadDate: info.videoDetails.uploadDate
    };
  } catch (error) {
    throw new Error(
      `Failed to get video info: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
exports.getVideoInfo = getVideoInfo;
// Example usage (commented out to prevent auto-execution)
/*
// Single video download
downloadYouTubeVideo({
  url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
  outputPath: './downloads',
  format: 'mp3',
  bitrate: 192
}).then((filePath) => {
  console.log('Download completed:', filePath);
}).catch((error) => {
  console.error('Download failed:', error.message);
});

// Multiple videos download
const urls = [
  'https://www.youtube.com/watch?v=VIDEO_ID_1',
  'https://www.youtube.com/watch?v=VIDEO_ID_2'
];

downloadMultipleVideos(urls, {
  format: 'mp3',
  outputPath: './music',
  bitrate: 320
}).then((results) => {
  console.log('All downloads completed:', results);
}).catch((error) => {
  console.error('Batch download failed:', error);
});
*/
