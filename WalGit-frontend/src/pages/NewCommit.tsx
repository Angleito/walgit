import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

const NewCommit = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();

  // TODO: Add form handling state and submission logic
  // const [message, setMessage] = useState('');
  // const [walrusBlobId, setWalrusBlobId] = useState(''); // Or handle file upload

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call Move module create_commit function
    console.log("Submitting new commit...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
         <Link to={`/${owner}/${name}`} className="inline-flex items-center text-sm text-ocean-600 hover:text-ocean-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to repository
          </Link>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Commit</CardTitle>
            <CardDescription>Commit changes to the repository <code className="text-xs bg-muted px-1 py-0.5 rounded">{owner}/{name}</code>.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="message">Commit message <span className="text-destructive">*</span></Label>
                <Input id="message" placeholder="Fix: Correct calculation" required /* value={message} onChange={(e) => setMessage(e.target.value)} */ />
              </div>
              <div>
                <Label htmlFor="description">Extended description (optional)</Label>
                <Textarea id="description" placeholder="Add more details about the changes..." rows={4} />
              </div>
               <div>
                <Label htmlFor="walrusBlobId">Walrus Blob ID <span className="text-destructive">*</span></Label>
                <Input id="walrusBlobId" placeholder="ipfs://..." required /* value={walrusBlobId} onChange={(e) => setWalrusBlobId(e.target.value)} */ />
                 <p className="text-xs text-muted-foreground mt-1">Pointer to the content snapshot in Walrus (e.g., IPFS CID).</p>
              </div>
              {/* Add parent commit selection later */}
              <div className="pt-4">
                <Button type="submit" variant="ocean">Commit changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCommit;
