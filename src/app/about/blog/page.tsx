import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, TrendingUp, Calendar, 
  Clock, Tag, BookmarkPlus, 
  Shield, DollarSign, Search,
  Share2, ChevronRight, Mail
} from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';

const blogPosts = [
  {
    id: 1,
    title: "The Future of Cryptocurrency",
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    category: "Market Insights",
    readTime: "5 min read",
    date: "2024-03-20",
    author: {
      name: "Tony Smith",
      role: "Market Analyst",
      avatar: "https://ui-avatars.com/api/?name=Tony+Smith&background=10B981&color=fff"
    },
    tags: ["Cryptocurrency", "Market Analysis", "Future Trends"],
    content: "Explore the evolving landscape of cryptocurrency and its potential impact on the future of finance...",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "Security Best Practices in Crypto",
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    category: "Security",
    readTime: "7 min read",
    date: "2024-03-18",
    author: {
      name: "Sarah Johnson",
      role: "Security Expert",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=2563EB&color=fff"
    },
    tags: ["Security", "Best Practices", "Wallet Safety", "Cybersecurity"],
    content: [
      "Multi-factor authentication: Your first line of defense",
      "Hardware vs Software wallets: Making the right choice",
      "Common phishing tactics in crypto and how to avoid them",
      "The importance of seed phrase management",
      "Regular security audits for your crypto holdings"
    ],
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    title: "DeFi Revolution: Beyond Traditional Banking",
    icon: <BookOpen className="h-5 w-5 text-purple-600" />,
    category: "Technology",
    readTime: "6 min read",
    date: "2024-03-15",
    author: {
      name: "Michael Chen",
      role: "DeFi Researcher",
      avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=7C3AED&color=fff"
    },
    tags: ["DeFi", "Innovation", "Banking", "Finance"],
    content: [
      "How DeFi is disrupting traditional lending and borrowing",
      "Yield farming strategies for beginners",
      "Smart contracts: The backbone of DeFi applications",
      "Risk management in DeFi investments",
      "The future of decentralized exchanges"
    ],
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    title: "Crypto Tax Guide 2024",
    icon: <DollarSign className="h-5 w-5 text-green-600" />,
    category: "Education",
    readTime: "8 min read",
    date: "2024-03-12",
    author: {
      name: "David Wilson",
      role: "Tax Consultant",
      avatar: "https://ui-avatars.com/api/?name=David+Wilson&background=0A8D4F&color=fff"
    },
    tags: ["Taxes", "Compliance", "Regulation", "Finance"],
    content: [
      "Understanding your crypto tax obligations",
      "How to track and report crypto transactions",
      "Tax implications of DeFi yields and staking rewards",
      "Common crypto tax mistakes to avoid",
      "Tools and software for crypto tax reporting"
    ],
    image: "https://images.unsplash.com/photo-1554672723-b208dc85134f?w=800&auto=format&fit=crop&q=60"
  }
];

const featuredPost = blogPosts[0];

export default async function BlogPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-lg font-bold sm:text-2xl md:text-3xl">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                trustBank Blog
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Stay informed with the latest insights, trends, and news in cryptocurrency and blockchain technology.
            </p>
          </div>

          {/* Featured Post */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Badge variant="secondary" className="mb-2">Featured</Badge>
                  <CardTitle className="text-3xl font-bold">
                    {blogPosts[0].title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {blogPosts[0].content}
                  </CardDescription>
                  <div className="flex items-center gap-4">
                    <Image
                      src={blogPosts[0].author.avatar}
                      alt={blogPosts[0].author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{blogPosts[0].author.name}</p>
                      <p className="text-sm text-muted-foreground">{blogPosts[0].author.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {blogPosts[0].date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {blogPosts[0].readTime}
                    </span>
                  </div>
                  <Button className="mt-4">
                    Read More
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="relative aspect-[4/3] md:aspect-auto">
                  <Image
                    src={blogPosts[0].image}
                    alt={blogPosts[0].title}
                    fill
                    className="object-cover rounded-lg"
                    priority={blogPosts[0].id === 1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(1).map((post) => (
              <Card key={post.id} className="border-none shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover rounded-t-lg"
                    priority={post.id === 1}
                  />
                </div>
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                  <CardTitle className="text-xl font-bold mb-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mb-4">
                    {post.content}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{post.author.name}</p>
                        <p className="text-muted-foreground">{post.date}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 