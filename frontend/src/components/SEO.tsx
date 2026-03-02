import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
}

const SEO = ({ title, description, url }: SEOProps) => {
  const siteName = 'Tổng Kho Nội Thất Tây Ninh';
  const defaultDesc = 'Chuyên cung cấp nội thất bàn ghế, sofa tại Tây Ninh uy tín.';
  const baseUrl = 'https://tongkhonoithattayninh.vn';

  return (
    <Helmet>
      <title>{title ? `${title} | ${siteName}` : siteName}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:url" content={`${baseUrl}${url || ''}`} />
      <link rel="canonical" href={`${baseUrl}${url || ''}`} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "url": baseUrl
        })}
      </script>
    </Helmet>
  );
};

export default SEO;