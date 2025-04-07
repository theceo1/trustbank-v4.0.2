import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, MessageCircle, Phone, HelpCircle, ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const metadata = {
  title: 'Support - trustBank',
  description: 'Get help and support for your trustBank account. We\'re here to help you succeed in your crypto journey.',
};

export default async function SupportPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Get session server-side
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          We&apos;re here to help you succeed
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          in your crypto journey with <span className="font-semibold text-green-600">trustBank</span>
        </p>
        
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/10 border-none shadow-lg">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <HelpCircle className="h-6 w-6" />
                How can we help?
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We&apos;re here to help you with any questions or concerns you may have about trustBank&apos;s services.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Email Support</h3>
                    <p className="text-green-600">support@trustbank.tech</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Phone Support</h3>
                    <p className="text-green-600">+XXX (XXX) XXXX-XXXX</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Live Chat</h3>
                    <p className="text-green-600">Available 24/7</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/10 border-none shadow-lg">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-bold text-green-600">Common Questions</CardTitle>
              <CardDescription className="text-base mt-2">
                Quick answers to frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="space-y-6">
                <li className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <h3 className="font-semibold">How do I create an account?</h3>
                  <p className="text-green-600 mt-1">Click the &quot;Get Started&quot; button and follow the registration process.</p>
                </li>
                <li className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <h3 className="font-semibold">How do I buy cryptocurrency?</h3>
                  <p className="text-green-600 mt-1">Visit our Trade page, select your desired cryptocurrency, and follow the purchase instructions.</p>
                </li>
                <li className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <h3 className="font-semibold">What are the trading fees?</h3>
                  <p className="text-green-600 mt-1">Our trading fees vary by transaction type. Visit our pricing page for detailed information.</p>
                </li>
              </ul>
              <Button asChild className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                <Link href="/about/faq" className="flex items-center justify-center gap-2">
                  View All FAQs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 