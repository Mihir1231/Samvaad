import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Target, Medal, Clock, ExternalLink } from "lucide-react";
import sportsImage from "@/assets/sports.jpg";

const SportsCell = () => {
  const sportsOffered = [
    { name: "Cricket", category: "Outdoor", season: "Winter" },
    { name: "Football", category: "Outdoor", season: "Monsoon" },
    { name: "Basketball", category: "Outdoor", season: "All Year" },
    { name: "Volleyball", category: "Indoor/Outdoor", season: "All Year" },
    { name: "Badminton", category: "Indoor", season: "All Year" },
    { name: "Table Tennis", category: "Indoor", season: "All Year" },
    { name: "Chess", category: "Indoor", season: "All Year" },
    { name: "Athletics", category: "Outdoor", season: "Winter" }
  ];

  const achievements = [
    { title: "Inter-College Cricket Championship", year: "2024", position: "1st Place" },
    { title: "University Basketball Tournament", year: "2023", position: "2nd Place" },
    { title: "State Level Athletics Meet", year: "2024", position: "3rd Place" },
    { title: "Regional Chess Championship", year: "2023", position: "1st Place" }
  ];

  const facilities = [
    "Multi-purpose Sports Ground",
    "Basketball Court",
    "Volleyball Court", 
    "Indoor Badminton Hall",
    "Table Tennis Hall",
    "Gymnasium",
    "Sports Equipment Room",
    "First Aid Station"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <div className="relative h-80 rounded-xl overflow-hidden mb-8">
            <img 
              src={sportsImage} 
              alt="Sports Activities"
              className="w-full h-full object-cover"
            />
            
          </div>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Sports Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sports is one of the top most activity which helps to improve health, make our body flexible and responsive and also make our brain active.
Sports also develops decision making skill and also Social, Organizational and Physical Skills. Which beneficial in personal and professional life. Sports teach How to think and response quickly. When you play sports, you develop qualifies like honesty, teamwork, leadership and strategic planning. This all skills will be helpful in every walk of life. Sportsman understands that success and failure are both part of the game. Sports teach value of time. Sports are a source of recreation and experience less stress in life.
To understand the importance of Sports & Games, KADI SARVA VISHWAVIDYALAYA is always support the Sports, Sportsman and all the sports activities.
Each and every college of KSV are actively participating in Inter College Tournaments. University also provides coaches and made an arrangement of Sports Club membership for players practice of Cricket, Football, Volleyball, Basketball, Table Tennis, Kabaddi, Kho Kho, Handball, Hockey, Athletics, Softball, Badminton, Swimming, Wrestling, Boxing, Taekwondo, Yoga and Riffle Shooting.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our mission is to develop well-rounded individuals by providing opportunities for students to excel in sports 
              alongside their academic pursuits. We believe that sports play a crucial role in character building, leadership 
              development, and maintaining physical and mental health.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              With state-of-the-art facilities and professional coaching, we provide students with the resources and guidance 
              needed to excel in their chosen sports while fostering teamwork, discipline, and healthy competition.
            </p>
            
            <div className="flex justify-center">
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SportsCell;