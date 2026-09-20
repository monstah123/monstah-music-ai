/**
 * Triggers a native file download for any audio URL (Replicate CDN, Data URI, or demo MP3)
 * via the same-origin /api/download proxy endpoint.
 */
export function triggerDownload(audioUrl, title = 'Monstah_Track') {
  if (!audioUrl) return;
  
  const safeTitle = (title || 'Monstah_Track').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'Monstah_Track';
  const downloadEndpoint = `/api/download?url=${encodeURIComponent(audioUrl)}&title=${encodeURIComponent(safeTitle)}`;

  const link = document.createElement('a');
  link.href = downloadEndpoint;
  link.download = `${safeTitle}.mp3`;
  link.target = '_self';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
