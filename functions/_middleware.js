// Cloudflare Pages middleware to inject Google Analytics (GA4) tracking
// Measurement ID: G-WQ27HV6QM2 (washingtonhomeoffers.com)

const GA_MEASUREMENT_ID = 'G-WQ27HV6QM2';

const GA_SCRIPT = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
        </script>
        `;

export async function onRequest(context) {
    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';

  // Only inject into HTML responses
  if (!contentType.includes('text/html')) {
        return response;
  }

  return new HTMLRewriter()
      .on('head', {
              element(element) {
                        element.prepend(GA_SCRIPT, { html: true });
              }
      })
      .transform(response);
}
