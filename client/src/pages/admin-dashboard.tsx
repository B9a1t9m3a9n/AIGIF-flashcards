import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsersIcon, BookIcon, SettingsIcon, DatabaseIcon } from "lucide-react";

export default function AdminDashboard() {
  const { user, userRole } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admin users
  useEffect(() => {
    if (userRole === "student") {
      navigate("/");
    } else if (userRole === "teacher") {
      navigate("/teacher");
    }
  }, [userRole, navigate]);

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && userRole === "admin",
  });

  // Fetch flashcard sets
  const { data: flashcardSets, isLoading: setsLoading } = useQuery({
    queryKey: ["/api/flashcard-sets"],
    enabled: !!user && userRole === "admin",
  });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header isAdmin={true} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h2 className="text-2xl font-bold">{usersLoading ? '...' : users?.length || 0}</h2>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                <BookIcon className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flashcard Sets</p>
                <h2 className="text-2xl font-bold">{setsLoading ? '...' : flashcardSets?.length || 0}</h2>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mr-4">
                <DatabaseIcon className="h-6 w-6 text-accent-dark" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Flashcards</p>
                <h2 className="text-2xl font-bold">
                  {setsLoading ? '...' : flashcardSets?.reduce((sum, set) => sum + (set.wordCount || 0), 0) || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button>Add User</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                      </TableRow>
                    ) : users?.length ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.displayName}</TableCell>
                          <TableCell className="capitalize">{user.role?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No users found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Content Management</CardTitle>
                  <Button>Create Flashcard Set</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading content...</TableCell>
                      </TableRow>
                    ) : flashcardSets?.length ? (
                      flashcardSets.map((set) => (
                        <TableRow key={set.id}>
                          <TableCell>{set.title}</TableCell>
                          <TableCell>{set.wordCount}</TableCell>
                          <TableCell>{set.creator?.displayName || 'System'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No content found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">AI Settings</h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span>Enable AI Content Generation</span>
                            <div className="w-12 h-6 bg-primary rounded-full relative">
                              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">User Registration</h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span>Allow New Registrations</span>
                            <div className="w-12 h-6 bg-primary rounded-full relative">
                              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <Button className="w-full">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
