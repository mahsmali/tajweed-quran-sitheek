/**
 * Third-party lesson videos.
 *
 * Titles and channel names are the creators' own words and are never
 * translated or paraphrased — they are attribution, not interface copy.
 */
export interface LessonVideo {
  videoId: string;
  title: string;
  channel: string;
  channelUrl: string;
}

/** Companion overview for the whole 30-day roadmap. */
export const TAJWEED_OVERVIEW: LessonVideo = {
  videoId: 'RxC8OWsAAh4',
  title: 'All Basic Tajweed Rules Explained in One Video. Complete Tajweed Course for Beginners',
  channel: 'QTA .. Ahmad Noor',
  channelUrl: 'https://www.youtube.com/@QTA..AhmadNoor',
};
