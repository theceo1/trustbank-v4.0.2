'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart } from "@/components/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="data-[state=active]:text-green-600">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:text-green-600">Transactions</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:text-green-600">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={[]} 
                  categories={['Revenue']}
                  colors={['#10B981']}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={[]} 
                  categories={['New Users']}
                  colors={['#10B981']}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction analytics content */}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* User analytics content */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 