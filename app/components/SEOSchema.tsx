import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateProductSchema,
  generateArticleSchema,
  generateDiscussionForumPostingSchema,
  generateFAQPageSchema,
  generateBreadcrumbSchema,
} from '../../lib/schema-generator';

interface SEOSchemaProps {
  type: 'Organization' | 'WebSite' | 'Product' | 'Article' | 'DiscussionForumPosting' | 'FAQPage' | 'BreadcrumbList';
  data: any;
}

export function SEOSchema({ type, data }: SEOSchemaProps) {
  let schema: any;
  
  switch (type) {
    case 'Organization':
      schema = generateOrganizationSchema(data);
      break;
    case 'WebSite':
      schema = generateWebSiteSchema(data);
      break;
    case 'Product':
      schema = generateProductSchema(data);
      break;
    case 'Article':
      schema = generateArticleSchema(data);
      break;
    case 'DiscussionForumPosting':
      schema = generateDiscussionForumPostingSchema(data);
      break;
    case 'FAQPage':
      schema = generateFAQPageSchema(data);
      break;
    case 'BreadcrumbList':
      schema = generateBreadcrumbSchema(data);
      break;
    default:
      schema = {};
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}

// Organization Schema for YoForex
export function OrganizationSchema() {
  const schema = generateOrganizationSchema({
    name: "YoForex",
    url: "https://yoforex.net",
    logo: "https://yoforex.net/logo.png",
    description: "Leading Forex Trading Community & EA Marketplace. Expert Advisors, MT4/MT5 tools, trading strategies, and forex signals.",
    sameAs: [
      "https://twitter.com/yoforex",
      "https://facebook.com/yoforex",
      "https://youtube.com/yoforex"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@yoforex.net",
      "availableLanguage": ["English"]
    }
  });
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}

// Website Search Schema
export function WebsiteSearchSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://yoforex.net",
          "name": "YoForex",
          "description": "Expert Advisor Forum & EA Marketplace",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://yoforex.net/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })
      }}
    />
  );
}

// Product Schema for EA/Robot
export function EAProductSchema({ ea }: { ea: any }) {
  const schema = generateProductSchema({
    name: ea.title,
    description: ea.description,
    imageUrl: ea.thumbnailUrl,
    price: ea.price || 0,
    currency: 'USD',
    availability: 'InStock',
    brand: ea.vendorName || "YoForex",
    ratingValue: ea.averageRating,
    ratingCount: ea.reviewCount || 0,
    sku: ea.id,
  });
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}

// FAQ Schema for FAQ pages
export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = generateFAQPageSchema({
    questions: faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer
    }))
  });
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}

// Forum Discussion Schema
export function ForumThreadSchema({ thread }: { thread: any }) {
  const schema = generateDiscussionForumPostingSchema({
    headline: thread.title,
    text: thread.content,
    author: thread.authorName,
    datePublished: thread.createdAt,
    dateModified: thread.updatedAt,
    url: `https://yoforex.net/thread/${thread.slug}`,
    commentCount: thread.replyCount || 0,
    upvoteCount: thread.likes || 0,
    keywords: thread.tags || [],
  });
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}