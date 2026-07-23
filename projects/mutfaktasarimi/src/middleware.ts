import { defineMiddleware } from 'astro:middleware';
import { getDomainConfig } from './config/domains';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  
  // Allow overriding via query param for testing / previewing (e.g. ?sim_domain=bursaakrilikmutfak.com)
  const simDomain = url.searchParams.get('sim_domain');
  const hostname = simDomain || context.request.headers.get('host') || 'bursamutfaktasarim.com';
  
  const domainConfig = getDomainConfig(hostname);
  
  // Pass down through locals
  context.locals.domainConfig = domainConfig;
  context.locals.currentHost = hostname;
  
  const response = await next();
  
  // Set custom SEO header for Vercel edge verification
  response.headers.set('X-Domain-SEO-Target', domainConfig.domainName);
  
  return response;
});
