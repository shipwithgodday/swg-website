# SEO Implementation Guide for Ship With Godday

This document outlines all SEO implementations and best practices for the Ship With Godday website.

## 1. Metadata Implementation

### Root Layout Metadata (`app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: {
    default: 'Ship With Godday | Lucky Godday Business Services',
    template: '%s | Ship With Godday'
  },
  description: 'Your trusted partner for seamless shipping solutions between China and Ghana...',
  keywords: ['shipping', 'logistics', 'Ghana', 'China', 'procurement', ...],
  authors: [{ name: 'Godday' }],
  creator: 'Godday',
  publisher: 'Lucky Godday Business Services',
  // ... other metadata
};
```

**Explanation:**

- Title template allows for consistent page titles across the site
- Comprehensive description for better search engine understanding
- Relevant keywords for the shipping and logistics industry
- Author and publisher information for content credibility

## 2. Technical SEO Files

### robots.txt (`public/robots.txt`)

```txt
# Allow all crawlers
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://shipwithgodday.com/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /static/
```

**Explanation:**

- Allows search engines to crawl the site
- Points to sitemap for better indexing
- Blocks sensitive routes from being indexed

### sitemap.xml (`public/sitemap.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shipwithgodday.com</loc>
    <lastmod>2024-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Other URLs -->
</urlset>
```

**Explanation:**

- Helps search engines discover and index all important pages
- Priority levels indicate relative importance of pages
- Change frequency helps search engines know how often to recrawl

## 3. Analytics and Monitoring

### Google Analytics Setup

```typescript
// In app/layout.tsx
<GoogleAnalytics gaId="G-GHJH5C564E" />
```

**Explanation:**

- Tracks user behavior and website performance
- Provides insights into user engagement and conversion rates
- Helps identify areas for improvement

### Web Vitals Monitoring (`components/analytics/WebVitals.tsx`)

```typescript
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics and send to Google Analytics
  });
  return null;
}
```

**Explanation:**

- Monitors Core Web Vitals (LCP, FID, CLS)
- Helps maintain good user experience
- Identifies performance issues

### Custom Event Tracking (`lib/analytics.ts`)

```typescript
export const trackEvent = (
  eventName: string,
  eventParams?: { [key: string]: any }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

export const EVENTS = {
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  // ... other events
};
```

**Explanation:**

- Tracks specific user interactions
- Helps understand user behavior
- Measures conversion rates

## 4. Image Optimization

### Logo Component (`components/shared/navbar/Logo.tsx`)

```typescript
<Image
  src={logo}
  width={484}
  height={137}
  alt="Ship With Godday - Your Trusted Shipping Partner"
  priority
/>
```

**Explanation:**

- Proper image dimensions for better loading
- Descriptive alt text for accessibility and SEO
- Priority loading for above-the-fold images

## 5. Semantic HTML

### Achievements Component (`components/about/Achievements.tsx`)

```typescript
<motion.section
  aria-label="Company Achievements"
  // ... other props
>
  <article>
    {/* Content */}
  </article>
</motion.section>
```

**Explanation:**

- Uses semantic HTML elements (`section`, `article`)
- ARIA labels for accessibility
- Proper heading hierarchy

## 6. Best Practices Implemented

1. **Performance**

   - Image optimization with Next.js Image component
   - Priority loading for critical resources
   - Web Vitals monitoring

2. **Accessibility**

   - Semantic HTML structure
   - ARIA labels
   - Alt text for images

3. **Technical SEO**

   - Proper metadata structure
   - Sitemap and robots.txt
   - Canonical URLs

4. **Analytics**
   - Google Analytics integration
   - Custom event tracking
   - Performance monitoring

## 7. Next Steps

1. **Content Optimization**

   - Regularly update content
   - Use relevant keywords naturally
   - Create quality backlinks

2. **Performance Monitoring**

   - Regularly check Google Search Console
   - Monitor Core Web Vitals
   - Address any issues promptly

3. **Local SEO**

   - Add location-specific metadata
   - Implement local business schema
   - Get listed in local directories

4. **Regular Maintenance**
   - Update sitemap regularly
   - Check for broken links
   - Monitor analytics for improvements

## 8. Tools and Resources

1. **Google Tools**

   - Google Analytics
   - Google Search Console
   - Google PageSpeed Insights

2. **Monitoring**

   - Core Web Vitals
   - Custom event tracking
   - User behavior analytics

3. **Development**
   - Next.js Image optimization
   - Semantic HTML
   - Accessibility tools

Remember to regularly check these implementations and update them as needed. SEO is an ongoing process that requires constant monitoring and optimization.
