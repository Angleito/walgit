import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

const NewRepository = () => {
  // TODO: Add form handling state and submission logic
  // const [repoName, setRepoName] = useState('');
  // const [description, setDescription] = useState('');
  // const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call Move module to create repository
    console.log("Submitting new repository...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
         <Link to="/repositories" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to repositories
          </Link>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Repository</CardTitle>
            <CardDescription>A repository contains all project files, including the revision history.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="repoName">Repository name <span className="text-destructive">*</span></Label>
                <Input id="repoName" placeholder="my-repo" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea id="description" placeholder="Describe your repository" className="mt-1.5 h-20" />
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                Create Repository
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewRepository;
