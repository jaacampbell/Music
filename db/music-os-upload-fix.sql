-- Music OS upload compatibility patch
-- Safe to run after db/music-os-phase2.sql.
-- Browsers report the same music format with different MIME types, especially M4A.

update storage.buckets
set
  file_size_limit = 524288000,
  allowed_mime_types = array[
    'audio/wav',
    'audio/x-wav',
    'audio/vnd.wave',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/flac',
    'audio/x-flac',
    'audio/aiff',
    'audio/x-aiff',
    'audio/ogg',
    'audio/webm',
    'application/octet-stream',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain'
  ]
where id = 'music-assets';
