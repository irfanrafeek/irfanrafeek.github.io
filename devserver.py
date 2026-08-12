#!/usr/bin/env python3
"""Local dev server that mirrors how GitHub Pages resolves URLs.

python3 -m http.server serves files literally, so extensionless links like
/about 404 even though they work fine in production. This adds the same
fallback Pages uses: /about -> about.html, and a directory -> index.html.

    python3 devserver.py [port]
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class PagesHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)

        # Only fall back when the literal path doesn't exist and the request
        # has no extension of its own -- never shadow a real file.
        if not os.path.exists(local) and not os.path.splitext(local)[1]:
            candidate = local + '.html'
            if os.path.isfile(candidate):
                return candidate

        return local

    def end_headers(self):
        # Dev convenience: always fetch fresh CSS/JS instead of a stale cache.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('Serving http://localhost:%d (extensionless URLs enabled)' % port)
    HTTPServer(('', port), PagesHandler).serve_forever()
