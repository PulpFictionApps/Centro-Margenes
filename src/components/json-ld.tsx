export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "MedicalOrganization"],
        "@id": "https://centromargenes.cl/#organization",
        name: "Centro Márgenes",
        alternateName: "Centro Psicoanalítico Márgenes",
        description:
          "Centro de atención psicológica psicoanalítica en Providencia, Santiago de Chile. Atención clínica individual online y presencial. Convenios disponibles.",
        url: "https://centromargenes.cl",
        email: "centropsicoanalitico.margenes@gmail.com",
        logo: {
          "@type": "ImageObject",
          url: "https://centromargenes.cl/images/Imagotipo1.png",
        },
        image: "https://centromargenes.cl/images/Imagotipo1.png",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Providencia",
          addressRegion: "Región Metropolitana",
          addressCountry: "CL",
        },
        areaServed: [
          { "@type": "City", name: "Santiago" },
          { "@type": "Country", name: "Chile" },
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Servicios Psicológicos",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Consulta Psicológica Presencial",
                description:
                  "Sesión de psicoanálisis presencial en Providencia, Santiago.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Consulta Psicológica Online",
                description:
                  "Sesión de psicoanálisis por videollamada para todo Chile.",
              },
            },
          ],
        },
        knowsAbout: [
          "Psicoanálisis",
          "Terapia Psicoanalítica",
          "Psicología Clínica",
          "Salud Mental",
          "Psicoanálisis Lacaniano",
        ],
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": "https://centromargenes.cl/#website",
        url: "https://centromargenes.cl",
        name: "Centro Márgenes",
        description:
          "Centro de atención psicológica psicoanalítica en Providencia, Santiago.",
        publisher: { "@id": "https://centromargenes.cl/#organization" },
        inLanguage: "es-CL",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
