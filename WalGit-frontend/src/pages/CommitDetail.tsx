import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommit, User, Calendar, ArrowLeft } from "lucide-react";

const CommitDetail = () => {
  const { owner, name, commitId } = useParams<{ owner: string; name: string; commitId: string }>();

  // TODO: query chain for commit data based on commitId
  const commit = {
    id: commitId || '0xabcdef123',
    message: 'Feat: Implement advanced wave rendering',
    author: 'wavecoder',
    timestamp: Date.now() - 86400000,
    parentCommitId: '0x123456789',
    // Add file changes later
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8">
        <div className="mb-6">
          <Link to={`/${owner}/${name}/commits`} className="inline-flex items-center text-sm text-ocean-600 hover:text-ocean-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to commits
          </Link>
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{commit.message}</CardTitle>
              <CardDescription className="flex items-center text-sm pt-2">
                <User className="h-4 w-4 mr-1.5" />
                <span className="font-medium mr-1">{commit.author}</span> committed on
                <Calendar className="h-4 w-4 ml-2 mr-1.5" />
                {new Date(commit.timestamp).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/60 pt-4">
                <span>Commit <code className="text-xs bg-muted px-1 py-0.5 rounded">{commit.id.substring(0,9)}...</code></span>
                {commit.parentCommitId && (
                  <span>Parent <Link to={`/${owner}/${name}/commits/${commit.parentCommitId}`} className="text-ocean-600 hover:underline"><code className="text-xs bg-muted px-1 py-0.5 rounded">{commit.parentCommitId.substring(0,9)}...</code></Link></span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for file changes diff */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">File diff view coming soon...</p>
            {/* TODO: Fetch and display file diff using Walrus Blob ID */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommitDetail;
