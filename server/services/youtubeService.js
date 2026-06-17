const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

async function findLessonVideos({ lesson, moduleDoc }) {
  if (!process.env.YOUTUBE_API_KEY) {
    const error = new Error("server error");
    error.statusCode = 500;
    throw error;
  }

  const query = `${lesson.title} ${moduleDoc.title} tutorial`;
  const params = new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY,
    part: "snippet",
    type: "video",
    safeSearch: "moderate",
    maxResults: "10",
    q: query,
  });

  let response;
  try {
    response = await fetch(`${SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    const error = new Error("Could not reach YouTube. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error("YouTube video search failed.");
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const existingUrls = new Set((lesson.content || []).map((block) => block.url).filter(Boolean));
  const videos = [];

  for (const item of data.items || []) {
    const videoId = item.id?.videoId;
    const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

    if (!url || existingUrls.has(url)) continue;

    videos.push({
      type: "video",
      url,
      title: item.snippet?.title || query,
    });

    if (videos.length >= 1) break;
  }

  if (!videos.length) {
    const error = new Error("No new relevant videos were found for this lesson.");
    error.statusCode = 409;
    throw error;
  }

  return videos;
}

module.exports = { findLessonVideos };
