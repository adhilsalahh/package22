import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'product' | 'article';
    price?: number;
    packageData?: {
        name: string;
        description: string;
        price: number;
        duration: number;
        destination: string;
        image: string;
    };
}

export const SEO = ({ title, description, keywords, image, url, type = 'website', price, packageData }: SEOProps) => {
    const siteTitle = "Va Oru Trippadikkam";
    const siteName = "Va Oru Trippadikkam - Kolukkumalai Trekking & Adventure";
    const defaultImage = "/header image.jpg";
    const siteUrl = "https://vaorutrippadikkam.com";

    const fullTitle = `${title} | ${siteTitle}`;
    const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

    // Local Business Schema (for all pages)
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "Va Oru Trippadikkam",
        "image": `${siteUrl}/Va oru trippadikkam.jpg`,
        "url": siteUrl,
        "telephone": "+917592049934",
        "email": "info@vaorutrippadikkam.com",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Suryanelli, Chinnakanal Panchayathu",
            "addressLocality": "Munnar",
            "addressRegion": "Kerala",
            "postalCode": "685618",
            "addressCountry": "IN"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 10.0889,
            "longitude": 77.0595
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "06:00",
            "closes": "22:00"
        },
        "priceRange": "₹₹",
        "sameAs": [
            "https://www.instagram.com/va_oru_trippadikkam",
            "https://www.facebook.com/share/1GNtZvvrhs/"
        ],
        "areaServed": {
            "@type": "Place",
            "name": "Munnar, Kerala, India"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Trekking & Adventure Packages",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "TouristTrip",
                        "name": "Kolukkumalai Sunrise Trekking"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "TouristTrip",
                        "name": "Meeshapulimala Trekking"
                    }
                }
            ]
        }
    };

    // Product/Package Schema (for package pages)
    const productSchema = packageData ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": packageData.name,
        "description": packageData.description,
        "image": packageData.image.startsWith('http') ? packageData.image : `${siteUrl}${packageData.image}`,
        "brand": {
            "@type": "Brand",
            "name": "Va Oru Trippadikkam"
        },
        "offers": {
            "@type": "Offer",
            "url": fullUrl,
            "priceCurrency": "INR",
            "price": packageData.price,
            "priceValidUntil": "2027-12-31",
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "Va Oru Trippadikkam"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
        }
    } : null;

    // TouristTrip Schema (for package pages)
    const touristTripSchema = packageData ? {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": packageData.name,
        "description": packageData.description,
        "image": packageData.image.startsWith('http') ? packageData.image : `${siteUrl}${packageData.image}`,
        "touristType": ["Adventure Seekers", "Nature Lovers", "Trekkers"],
        "itinerary": {
            "@type": "ItemList",
            "numberOfItems": packageData.duration,
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": `Day 1 - ${packageData.destination} Adventure`
                }
            ]
        },
        "offers": {
            "@type": "Offer",
            "price": packageData.price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Va Oru Trippadikkam",
            "url": siteUrl
        }
    } : null;

    // FAQ Schema for home page
    const faqSchema = url === '/' ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is the best time to visit Kolukkumalai?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The best time to visit Kolukkumalai is from October to March when the weather is pleasant. The sunrise view is spectacular during these months with clear skies."
                }
            },
            {
                "@type": "Question",
                "name": "How to book Kolukkumalai trekking package?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can book Kolukkumalai trekking packages through Va Oru Trippadikkam website or WhatsApp. We offer tent stay, cabin stay, and jeep safari options."
                }
            },
            {
                "@type": "Question",
                "name": "What is included in the Kolukkumalai package?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our Kolukkumalai packages include jeep safari, trekking guide, camping/cabin accommodation, meals, and sunrise viewing at the tea factory."
                }
            },
            {
                "@type": "Question",
                "name": "Is Kolukkumalai trek difficult?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kolukkumalai trek is moderate difficulty suitable for beginners and families. The jeep ride covers most of the journey, with a short trek to the viewpoint."
                }
            },
            {
                "@type": "Question",
                "name": "What is the price of Kolukkumalai package?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kolukkumalai packages start from ₹1,500 per person including jeep safari, guide, and breakfast. Camping packages with tent stay start from ₹2,500."
                }
            }
        ]
    } : null;

    // BreadcrumbList Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl
            },
            ...(url && url !== '/' ? [{
                "@type": "ListItem",
                "position": 2,
                "name": title,
                "item": fullUrl
            }] : [])
        ]
    };

    // WebSite Schema for sitelinks search box
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "url": siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/packages?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={fullUrl} />

            {/* Language & Region */}
            <meta name="language" content="English" />
            <meta name="geo.region" content="IN-KL" />
            <meta name="geo.placename" content="Munnar, Kerala" />
            <meta name="geo.position" content="10.0889;77.0595" />
            <meta name="ICBM" content="10.0889, 77.0595" />

            {/* Robots */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="en_IN" />
            {price && <meta property="product:price:amount" content={String(price)} />}
            {price && <meta property="product:price:currency" content="INR" />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Mobile & App */}
            <meta name="theme-color" content="#059669" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Va Oru Trippadikkam" />

            {/* Structured Data - JSON-LD */}
            <script type="application/ld+json">
                {JSON.stringify(localBusinessSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(websiteSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbSchema)}
            </script>
            {productSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(productSchema)}
                </script>
            )}
            {touristTripSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(touristTripSchema)}
                </script>
            )}
            {faqSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
                </script>
            )}
        </Helmet>
    );
};
