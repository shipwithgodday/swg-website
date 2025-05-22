// Custom event tracking for Google Analytics
export const trackEvent = (
  eventName: string,
  eventParams?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Common event names
export const EVENTS = {
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  CONTACT_CLICK: 'contact_click',
  SCHEDULE_CLICK: 'schedule_click',
  SERVICE_VIEW: 'service_view',
  SCROLL_DEPTH: 'scroll_depth',
} as const;

// Track page views
export const trackPageView = (url: string) => {
  trackEvent(EVENTS.PAGE_VIEW, {
    page_path: url,
    page_title: document.title,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string) => {
  trackEvent(EVENTS.BUTTON_CLICK, {
    button_name: buttonName,
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string) => {
  trackEvent(EVENTS.FORM_SUBMIT, {
    form_name: formName,
  });
};

// Track service views
export const trackServiceView = (serviceName: string) => {
  trackEvent(EVENTS.SERVICE_VIEW, {
    service_name: serviceName,
  });
};

// Track scroll depth
export const trackScrollDepth = (depth: number) => {
  trackEvent(EVENTS.SCROLL_DEPTH, {
    depth: depth,
  });
};
