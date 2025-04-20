
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white relative">
      <WaveBackground />
      <Header />
      <div className="container px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-ocean-400 to-sui-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-3 bg-gradient-to-br from-ocean-400 to-sui-500 rounded-full flex items-center justify-center text-white text-5xl font-bold">
              404
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-ocean-800">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for may have drifted away with the tide. Let's get you back to shore.
          </p>
          
          <Link to="/">
            <Button variant="ocean" size="lg">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
