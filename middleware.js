import { NextResponse } from 'next/server';

export function middleware(request) {
  // Récupérer la réponse
  const response = NextResponse.next();

  // Ajouter les headers anti-cache pour forcer le navigateur à toujours récupérer la dernière version
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}

export const config = {
  // Appliquer le middleware sur toutes les routes sauf les fichiers statiques (_next/static, images, etc.)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
