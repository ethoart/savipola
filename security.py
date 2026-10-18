"""Small ASGI boundary: bounded bodies and production response policies."""
import settings
from starlette.responses import JSONResponse

class SecurityBoundary:
    def __init__(self, app): self.app = app
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        path = scope.get('path', '')
        if settings.PRODUCTION and (path in ('/classic','/responsive-check','/docs','/redoc','/openapi.json') or
                path.startswith(('/static/index.html','/static/responsive-check'))):
            return await JSONResponse({'detail':'Not found'},404)(scope,receive,send)
        if scope['method'] in ('POST','PUT','PATCH'):
            chunks=[]; size=0
            while True:
                event=await receive()
                if event['type']=='http.disconnect': return
                size+=len(event.get('body',b''))
                if size>4*1024*1024:
                    return await JSONResponse({'detail':'Request is too large'},413)(scope,receive,send)
                chunks.append(event.get('body',b''))
                if not event.get('more_body'):break
            delivered=False
            original=receive
            async def replay():
                nonlocal delivered
                if delivered:return await original()
                delivered=True
                return {'type':'http.request','body':b''.join(chunks),'more_body':False}
            receive=replay
        async def secured(event):
            if event['type']=='http.response.start':
                headers=list(event.get('headers',[]))
                headers += [(b'x-content-type-options',b'nosniff'),(b'referrer-policy',b'strict-origin-when-cross-origin'),
                            (b'permissions-policy',b'camera=(), microphone=(), geolocation=()')]
                if path.startswith('/api/') or path=='/':headers.append((b'cache-control',b'no-store'))
                elif path=='/sw.js' or path.endswith(('.css','.js','.html')):
                    # Revalidate app code so a phone receives fixes immediately.
                    headers.append((b'cache-control',b'no-cache'))
                if settings.PRODUCTION:
                    headers += [(b'strict-transport-security',b'max-age=31536000'),
                                (b'content-security-policy',b"default-src 'self'; script-src 'self' https://www.gstatic.com https://www.google.com https://www.recaptcha.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.recaptcha.net https://www.google.com wss:; frame-src https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'")]
                event['headers']=headers
            await send(event)
        await self.app(scope,receive,secured)
