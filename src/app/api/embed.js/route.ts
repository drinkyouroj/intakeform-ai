import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://intakeform.ai'

  const script = `
(function() {
  var scripts = document.querySelectorAll('script[data-intakeform-id]');
  scripts.forEach(function(script) {
    var formId = script.getAttribute('data-intakeform-id');
    if (!formId) return;

    var container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '720px';
    container.style.margin = '0 auto';

    var iframe = document.createElement('iframe');
    iframe.src = '${appUrl}/embed/' + formId;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.minHeight = '600px';
    iframe.setAttribute('title', 'Intake Form');
    iframe.setAttribute('loading', 'lazy');

    // Listen for height updates from the iframe
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'intakeform-resize' && e.data.formId === formId) {
        iframe.style.height = e.data.height + 'px';
      }
    });

    container.appendChild(iframe);
    script.parentNode.insertBefore(container, script.nextSibling);
  });
})();
`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
