import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Management</h1>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({13})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({1831})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({141})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({662})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add DataTable component here */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar TabsContent for other collections */}
      </Tabs>
    </div>
  )
}