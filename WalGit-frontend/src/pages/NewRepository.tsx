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
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
         <Link to="/repositories" className="inline-flex items-center text-sm text-ocean-600 hover:text-ocean-700 mb-4">
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
                <Input id="repoName" placeholder="my-awesome-project" required /* value={repoName} onChange={(e) => setRepoName(e.target.value)} */ />
                <p className="text-xs text-muted-foreground mt-1">Great repository names are short and memorable.</p>
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" placeholder="A short description of your project" /* value={description} onChange={(e) => setDescription(e.target.value)} */ />
              </div>
              {/* Add public/private toggle later */}
              <div className="pt-4">
                <Button type="submit" variant="ocean">Create repository</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewRepository;
