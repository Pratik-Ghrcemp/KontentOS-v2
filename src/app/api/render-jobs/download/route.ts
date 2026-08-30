import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const renderOutputDir = () => path.resolve(process.env.LOCAL_RENDER_OUTPUT_DIR || path.join(os.tmpdir(), 'kontentos-renders'));

function resolveRequestedRenderPath(filePath: string): string {
  const withoutFileProtocol = filePath.replace(/^file:\/\/\/?/, '');
  return path.resolve(withoutFileProtocol);
}

function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const relative = path.relative(directory, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function sanitizeDownloadFilename(filename: string): string {
  const baseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  return baseName.toLowerCase().endsWith('.mp4') ? baseName : `${baseName}.mp4`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get('path');
  const filename = url.searchParams.get('filename') || 'rendered-video.mp4';

  if (!filePath) {
    return NextResponse.json({ error: 'Missing file path parameter' }, { status: 400 });
  }

  const resolvedPath = resolveRequestedRenderPath(filePath);
  const outputDir = renderOutputDir();

  if (!isPathInsideDirectory(resolvedPath, outputDir) || path.extname(resolvedPath).toLowerCase() !== '.mp4') {
    return NextResponse.json({ error: 'Invalid render output path' }, { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'Rendered output file not found on disk' }, { status: 404 });
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    return NextResponse.json({ error: 'Rendered output path is not a file' }, { status: 400 });
  }

  const fileStream = fs.createReadStream(resolvedPath);
  const safeFilename = sanitizeDownloadFilename(filename);

  // Return streamed binary response
  return new Response(fileStream as any, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}
