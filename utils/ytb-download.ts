import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';

// Set ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

interface DownloadOptions {
  url: string;
  outputPath?: string;
  format?: 'mp3' | 'mp4';
  quality?: 'highest' | 'lowest' | 'highestaudio' | 'lowestaudio';
  bitrate?: number;
}

/**
 * Download YouTube video/audio
 * @param options Download configuration options
 * @returns Promise that resolves when download is complete
 */
export async function downloadYouTubeVideo(
  options: DownloadOptions
): Promise<string> {
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
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const outputFile = path.join(outputPath, `${title}.${format}`);

    return new Promise((resolve, reject) => {
      try {
        // Get stream based on format
        const stream = ytdl(url, {
          quality: quality as any,
          filter: format === 'mp3' ? 'audioonly' : 'audioandvideo'
        });

        const ffmpegCommand = ffmpeg(stream);

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

/**
 * Download multiple YouTube videos
 * @param urls Array of YouTube URLs
 * @param options Download configuration options
 * @returns Promise that resolves when all downloads are complete
 */
export async function downloadMultipleVideos(
  urls: string[],
  options: Omit<DownloadOptions, 'url'> = {}
): Promise<string[]> {
  const results: string[] = [];

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

/**
 * Get video information without downloading
 * @param url YouTube video URL
 * @returns Video information
 */
export async function getVideoInfo(url: string) {
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
