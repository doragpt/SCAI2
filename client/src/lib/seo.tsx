import { Helmet } from 'react-helmet';

interface SEOProps {
  title: string;
  description: string;
  jobPosting?: {
    title: string;
    description: string;
    datePosted: string;
    employmentType: string;
    hiringOrganization: {
      name: string;
      address: {
        addressLocality: string;
        addressRegion: string;
      };
    };
    jobLocation: {
      addressLocality: string;
      addressRegion: string;
    };
    baseSalary?: {
      minValue: number;
      maxValue: number;
      currency: string;
    };
  };
}

export function SEO({ title, description, jobPosting }: SEOProps) {
  const jobPostingSchema = jobPosting
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        ...jobPosting,
        baseSalary: jobPosting.baseSalary
          ? {
              "@type": "MonetaryAmount",
              currency: jobPosting.baseSalary.currency,
              value: {
                "@type": "QuantitativeValue",
                minValue: jobPosting.baseSalary.minValue,
                maxValue: jobPosting.baseSalary.maxValue,
                unitText: "DAY",
              },
            }
          : undefined,
      }
    : null;

  return (
    <Helmet>
      <title>{title} | SCAI</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jobPostingSchema && (
        <script type="application/ld+json">
          {JSON.stringify(jobPostingSchema)}
        </script>
      )}
    </Helmet>
  );
}
