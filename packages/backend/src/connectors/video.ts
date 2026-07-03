/**
 * Educational Video Connector — Agricultural Training Content
 * 
 * Uses yt-dlp (github.com/yt-dlp/yt-dlp) to download agricultural training
 * videos from YouTube and other platforms for offline access by farmers.
 * 
 * Applications in KilimoPRO:
 * 1. Download KALRO training videos for offline viewing
 * 2. Download FAO agricultural tutorials
 * 3. Package video content with subtitles in Swahili
 * 4. Create a curated library of best farming practices
 * 
 * yt-dlp supports 1000+ sites including YouTube, Vimeo, etc.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_STORAGE = process.env.VIDEO_STORAGE_PATH || './assets/videos';
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

interface VideoInfo {
  id: string;
  title: string;
  url: string;
  channel: string;
  duration: number;     // seconds
  description: string;
  thumbnail: string;
  localPath?: string;   // path to downloaded video
  downloadedAt?: Date;
  subtitles?: string;   // path to subtitle file
}

// Curated agricultural YouTube channels relevant to Kenyan farmers
const AG_CHANNELS = {
  kalro: 'https://www.youtube.com/@KALROKenya',
  fao: 'https://www.youtube.com/@FAO',
  accessAgriculture: 'https://www.youtube.com/@AccessAgriculture',
  shambaShapeUp: 'https://www.youtube.com/@ShambaShapeUp',  // Popular Kenyan farming show
  digitalGreen: 'https://www.youtube.com/@DigitalGreenOrg',
};

export class VideoConnector {
  /**
   * Download a video for offline access
   */
  async downloadVideo(url: string, options?: {
    format?: string;       // 'mp4' default
    quality?: string;      // '360p' for data saving
    subtitles?: boolean;   // Download subtitles if available
    subtitleLang?: string; // 'sw' for Swahili
  }): Promise<VideoInfo | null> {
    const format = options?.format || 'mp4';
    const quality = options?.quality || '360p'; // Low quality for data saving
    
    try {
      // Ensure storage directory exists
      if (!fs.existsSync(VIDEO_STORAGE)) {
        fs.mkdirSync(VIDEO_STORAGE, { recursive: true });
      }

      // Get video info first
      const info = await this.getVideoInfo(url);
      if (!info) return null;

      // Download video
      const outputFile = path.join(VIDEO_STORAGE, `${info.id}.${format}`);
      
      const ytDlpArgs = [
        YT_DLP_PATH,
        '-f', `best[height<=${quality.includes('360') ? '360' : '720'}][ext=${format}]/best[ext=${format}]/best`,
        '-o', outputFile,
        '--no-playlist',
        '--no-warnings',
      ];

      if (options?.subtitles) {
        ytDlpArgs.push('--write-sub', '--sub-lang', options.subtitleLang || 'en', '--sub-format', 'srt');
      }

      ytDlpArgs.push(url);

      execSync(ytDlpArgs.join(' '), { timeout: 300000 }); // 5 minute timeout

      // Check if file was downloaded
      if (!fs.existsSync(outputFile)) {
        throw new Error('Download failed — file not found');
      }

      return {
        ...info,
        localPath: outputFile,
        downloadedAt: new Date(),
        subtitles: options?.subtitles ? outputFile.replace(`.${format}`, '.srt') : undefined,
      };
    } catch (error) {
      console.error('[VideoConnector] Download failed:', error);
      return null;
    }
  }

  /**
   * Get video metadata without downloading
   */
  async getVideoInfo(url: string): Promise<VideoInfo | null> {
    try {
      const output = execSync(
        `${YT_DLP_PATH} --dump-json --no-playlist "${url}"`,
        { encoding: 'utf-8', timeout: 30000 }
      ).trim();

      const data = JSON.parse(output);
      
      return {
        id: data.id || data.extractor_key,
        title: data.title,
        url,
        channel: data.channel || data.uploader || 'Unknown',
        duration: data.duration || 0,
        description: data.description || '',
        thumbnail: data.thumbnail || '',
      };
    } catch (error) {
      console.error('[VideoConnector] Failed to get video info:', error);
      return null;
    }
  }

  /**
   * List available videos from curated agricultural channels
   */
  async listChannelVideos(channelKey: keyof typeof AG_CHANNELS, maxResults: number = 20): Promise<VideoInfo[]> {
    const channelUrl = AG_CHANNELS[channelKey];
    if (!channelUrl) return [];

    try {
      const output = execSync(
        `${YT_DLP_PATH} --flat-playlist --dump-json --playlistend ${maxResults} "${channelUrl}/videos"`,
        { encoding: 'utf-8', timeout: 60000 }
      ).trim();

      const lines = output.split('\n').filter(Boolean);
      const videos: VideoInfo[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          videos.push({
            id: data.id,
            title: data.title,
            url: data.url ? `https://www.youtube.com/watch?v=${data.id}` : data webpage_url,
            channel: channelKey,
            duration: data.duration || 0,
            description: data.description || '',
            thumbnail: data.thumbnails?.[0]?.url || '',
          });
        } catch {
          // Skip malformed entries
        }
      }

      return videos;
    } catch (error) {
      console.error('[VideoConnector] Failed to list channel videos:', error);
      return [];
    }
  }

  /**
   * Search for agricultural training videos
   */
  async searchVideos(query: string, maxResults: number = 10): Promise<VideoInfo[]> {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} farming Kenya agriculture tutorial`)}`;
    
    try {
      const output = execSync(
        `${YT_DLP_PATH} --flat-playlist --dump-json --playlistend ${maxResults} "${searchUrl}"`,
        { encoding: 'utf-8', timeout: 60000 }
      ).trim();

      const lines = output.split('\n').filter(Boolean);
      const videos: VideoInfo[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          videos.push({
            id: data.id,
            title: data.title,
            url: `https://www.youtube.com/watch?v=${data.id}`,
            channel: data.channel || 'YouTube',
            duration: data.duration || 0,
            description: data.description || '',
            thumbnail: data.thumbnails?.[0]?.url || '',
          });
        } catch {
          // Skip malformed entries
        }
      }

      return videos;
    } catch (error) {
      console.error('[VideoConnector] Search failed:', error);
      return [];
    }
  }

  /**
   * Get locally downloaded videos
   */
  getLocalVideos(): VideoInfo[] {
    if (!fs.existsSync(VIDEO_STORAGE)) return [];

    const files = fs.readdirSync(VIDEO_STORAGE);
    const videos: VideoInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.mp4') || file.endsWith('.webm')) {
        const stats = fs.statSync(path.join(VIDEO_STORAGE, file));
        const id = file.replace(/\.(mp4|webm)$/, '');
        
        videos.push({
          id,
          title: id, // Would be loaded from metadata database
          url: '',
          channel: 'Downloaded',
          duration: 0,
          description: '',
          thumbnail: '',
          localPath: path.join(VIDEO_STORAGE, file),
          downloadedAt: stats.mtime,
        });
      }
    }

    return videos;
  }
}

export const videoConnector = new VideoConnector();
