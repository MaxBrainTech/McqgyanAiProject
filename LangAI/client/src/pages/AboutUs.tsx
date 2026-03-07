import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Users, Target, Award } from "lucide-react";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About MCQGyaan AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionizing learning through AI-powered education for CBSE students across India.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <Target className="h-12 w-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 dark:text-gray-300">
              To democratize quality education using AI and make learning engaging for every student in India.
            </p>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
            <Lightbulb className="h-12 w-12 text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-700 dark:text-gray-300">
              To become the leading AI-powered learning platform empowering millions of students to achieve academic excellence.
            </p>
          </Card>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: "CBSE Aligned" },
              { icon: Users, title: "Personalized" },
              { icon: Lightbulb, title: "Innovative" },
              { icon: Target, title: "Effective" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return <Card key={idx} className="p-6"><Icon className="h-8 w-8 text-blue-600 mb-2 mx-auto" /><p className="font-bold">{item.title}</p></Card>;
            })}
          </div>
        </div>

        <Button onClick={() => navigate("/")} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-lg">Start Learning Free</Button>
      </div>
    </div>
  );
}
