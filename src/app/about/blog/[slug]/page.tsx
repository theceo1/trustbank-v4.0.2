import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Blog posts data
const blogPosts = {
  'future-of-cryptocurrency': {
    title: 'The Future of Cryptocurrency: Trends to Watch in 2024',
    author: 'Tony Smith',
    date: '2024-03-15',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?q=80&w=2070',
    category: 'Technology',
    tags: ['Cryptocurrency', 'Blockchain', 'Finance'],
    content: `
      The cryptocurrency landscape is evolving rapidly in 2024, bringing new opportunities and challenges. As we navigate through this transformative period, several key trends are shaping the future of digital assets.

      ## Institutional Adoption
      Major financial institutions are increasingly embracing cryptocurrencies, marking a significant shift in the traditional banking sector. This institutional adoption is providing newfound legitimacy to digital assets and creating more stable market conditions.

      ## Environmental Sustainability
      The focus on sustainable cryptocurrency mining has never been stronger. New consensus mechanisms and green mining initiatives are addressing environmental concerns while maintaining network security.

      ## DeFi Evolution
      Decentralized Finance (DeFi) continues to innovate, offering more sophisticated financial instruments and improved user experiences. Smart contracts are becoming more efficient and secure, enabling complex financial operations with minimal intermediaries.

      ## Regulatory Clarity
      Governments worldwide are developing clearer regulatory frameworks for cryptocurrencies, providing much-needed certainty for investors and businesses operating in the space.

      ## Looking Ahead
      As we progress through 2024, these trends will likely accelerate, bringing cryptocurrency closer to mainstream adoption. The key to success will be balancing innovation with security and user experience.
    `
  },
  'security-best-practices': {
    title: 'Security Best Practices in Crypto Trading',
    author: 'Sarah Johnson',
    date: '2024-03-18',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832',
    category: 'Security',
    tags: ['Security', 'Trading', 'Best Practices'],
    content: `
      In the ever-evolving world of cryptocurrency trading, security remains paramount. This guide explores essential security practices that every trader should implement.

      ## Two-Factor Authentication
      2FA is your first line of defense. Always enable it for all your crypto accounts, preferably using authenticator apps rather than SMS verification.

      ## Hardware Wallets
      For long-term storage, hardware wallets provide the highest level of security. They keep your private keys offline and safe from online threats.

      ## Secure Networks
      Only trade on secure, private networks. Avoid public Wi-Fi for cryptocurrency transactions, and always use a VPN for an additional layer of security.

      ## Regular Security Audits
      Periodically review your security settings and update your passwords. Monitor your account activity regularly for any suspicious behavior.

      ## Phishing Awareness
      Stay vigilant against phishing attempts. Verify URLs carefully and never click on suspicious links or download unknown attachments.
    `
  },
  'defi-revolution': {
    title: 'DeFi Revolution: Beyond Traditional Banking',
    author: 'Michael Chen',
    date: '2024-03-20',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=2070',
    category: 'DeFi',
    tags: ['DeFi', 'Banking', 'Innovation'],
    content: `
      Decentralized Finance (DeFi) is transforming the financial landscape, offering innovative solutions that challenge traditional banking systems.

      ## The Rise of DeFi
      DeFi protocols are providing financial services without traditional intermediaries, making finance more accessible and efficient.

      ## Key Innovations
      - Automated Market Makers (AMMs)
      - Yield Farming
      - Decentralized Lending
      - Liquidity Pools

      ## Advantages Over Traditional Banking
      DeFi offers several advantages:
      - 24/7 Operation
      - Global Accessibility
      - Transparent Transactions
      - Programmable Finance

      ## Challenges and Solutions
      While DeFi presents exciting opportunities, it also faces challenges:
      - Smart Contract Security
      - User Experience
      - Regulatory Compliance

      ## Future Outlook
      The DeFi sector continues to innovate and mature, promising a more inclusive and efficient financial system.
    `
  }
};

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug as keyof typeof blogPosts];

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/about/blog"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Blog
      </Link>

      <div className="space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="mb-4">
            {post.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>
                {format(new Date(post.date), 'MMMM d, yyyy')}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} read</span>
            </div>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex items-center justify-between py-4 border-y">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              <Image
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`}
                alt={post.author}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-medium">{post.author}</div>
              <div className="text-sm text-muted-foreground">Author</div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="prose prose-green dark:prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-6">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              <Tag className="mr-2 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
} 