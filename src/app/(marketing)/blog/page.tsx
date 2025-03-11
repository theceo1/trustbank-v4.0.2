'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { motion, AnimatePresence } from "framer-motion";
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
      avatar: "/avatars/tony-smith.jpg"
    },
    tags: ["Crypto", "Market Analysis", "Technology", "Future Trends"],
    content: [
      "Bitcoin's trajectory and its impact on global finance in 2024",
      "The rise of institutional adoption and its implications for retail investors",
      "CBDCs vs Traditional Cryptocurrencies: The brewing competition",
      "How AI and blockchain convergence is reshaping crypto trading",
      "Key market indicators to watch in the coming quarters"
    ],
    image: "/blog/crypto-future.jpg"
  },
  // ... existing blog posts ...
];

const featuredPost = blogPosts[0];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient<Database>();

  const categories = ["all", "Market Insights", "Security", "Technology", "Education"];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleBookmark = useCallback((postId: number) => {
    setBookmarkedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: subscribeError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            email,
            source: 'blog_page',
            preferences: { interests: ['blog', 'updates'] },
            metadata: { subscribed_from: 'blog' }
          }
        ]);

      if (subscribeError) throw subscribeError;

      setEmail('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Subscription error:', error);
      if (error.code === '23505') {
        setError('This email is already subscribed to our newsletter.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto space-y-12"
        >
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className="mb-4 px-4 py-1 text-sm bg-white dark:bg-gray-800 shadow-sm"
              >
                trustBank Blog
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Insights & Knowledge Hub
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Stay ahead with expert analysis, market insights, and the latest in cryptocurrency trends
              </p>
            </motion.div>
          </section>

          {/* Featured Post */}
          <section>
            <Card className="overflow-hidden border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative h-64 md:h-full">
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge 
                    className="absolute top-4 left-4 bg-green-600 text-white border-none"
                  >
                    Featured
                  </Badge>
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <Badge variant="outline" className="w-fit mb-4">
                    {featuredPost.category}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    {featuredPost.title}
                  </h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={featuredPost.author.avatar}
                          alt={featuredPost.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{featuredPost.author.name}</p>
                        <p className="text-xs text-muted-foreground">{featuredPost.author.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(featuredPost.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button className="w-fit group" asChild>
                    <Link href={`/blog/${featuredPost.id}`}>
                      Read Article
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Search and Filter Section */}
          <section className="sticky top-20 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="w-full md:w-auto">
                <div className="flex space-x-2 p-1">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap ${
                        selectedCategory === category ? 'bg-green-600 hover:bg-green-500' : ''
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </section>

          {/* Newsletter Section */}
          <section>
            <Card className="border-none shadow-xl bg-gradient-to-br from-green-600 to-green-400 text-white">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
                    <p className="text-green-50 mb-4">
                      Get the latest insights and updates delivered directly to your inbox
                    </p>
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-white text-green-600 hover:bg-white/90"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                      </Button>
                    </form>
                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="mt-4 bg-white/10 border-white/20">
                        <AlertDescription>
                          Thank you for subscribing! You'll receive our next update soon.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="relative h-48">
                      <Image
                        src="/newsletter-illustration.svg"
                        alt="Newsletter"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Blog Posts Grid */}
          <section>
            <AnimatePresence>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300 group">
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            {post.icon}
                            <Badge variant="secondary" className="text-xs">
                              {post.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleBookmark(post.id)}
                              className="hover:text-green-600"
                            >
                              <BookmarkPlus 
                                className={`h-5 w-5 transition-colors ${
                                  bookmarkedPosts.includes(post.id) 
                                    ? "fill-current text-green-600" 
                                    : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-green-600"
                            >
                              <Share2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-xl mt-4 group-hover:text-green-600 transition-colors">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {post.readTime}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow p-6">
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                          {post.content.slice(0, 3).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                        {post.content.length > 3 && (
                          <Button 
                            variant="link" 
                            className="mt-4 p-0 text-green-600 hover:text-green-500"
                          >
                            Read more
                          </Button>
                        )}
                        <div className="mt-6 flex flex-wrap gap-2">
                          {post.tags.map((tag, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-xs hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </section>
        </motion.div>
      </div>
    </div>
  );
} 