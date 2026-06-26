import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Heart, Users, Target, Clock, Calendar, Activity, ExternalLink } from "lucide-react";
import lakshImage from "@/assets/laksh.jpg";

const LakshCell = () => {
  const programs = [
    {
      name: "Strength Training",
      description: "Build muscle strength and endurance with guided workouts",
      duration: "45 minutes",
      level: "All Levels"
    },
    {
      name: "Cardio Fitness",
      description: "Improve cardiovascular health with varied cardio exercises",
      duration: "30 minutes", 
      level: "Beginner to Advanced"
    },
    {
      name: "Yoga & Meditation",
      description: "Enhance flexibility and mental wellness through yoga practice",
      duration: "60 minutes",
      level: "All Levels"
    },
    {
      name: "Functional Training",
      description: "Real-world movement patterns for everyday strength",
      duration: "40 minutes",
      level: "Intermediate"
    },
    {
      name: "Group Fitness Classes",
      description: "Fun and motivating group workout sessions",
      duration: "45 minutes",
      level: "All Levels"
    },
    {
      name: "Sports-Specific Training",
      description: "Specialized training for various sports performance",
      duration: "50 minutes",
      level: "Advanced"
    }
  ];

  const schedules = [
    { time: "6:00 AM - 7:00 AM", activity: "Morning Yoga", instructor: "Instructor A" },
    { time: "7:00 AM - 8:00 AM", activity: "Strength Training", instructor: "Instructor B" },
    { time: "4:00 PM - 5:00 PM", activity: "Group Fitness", instructor: "Instructor C" },
    { time: "5:00 PM - 6:00 PM", activity: "Cardio Session", instructor: "Instructor D" },
    { time: "6:00 PM - 7:00 PM", activity: "Functional Training", instructor: "Instructor E" }
  ];

  const facilities = [
    "Modern Gymnasium Equipment",
    "Cardio Machines (Treadmill, Elliptical, Cycles)",
    "Free Weights Section",
    "Yoga & Aerobics Studio",
    "Locker Rooms with Shower Facilities",
    "First Aid Station",
    "Nutritional Guidance Corner",
    "Sports Equipment Storage"
  ];

  const benefits = [
    { title: "Physical Health", description: "Improved strength, endurance, and overall fitness" },
    { title: "Mental Wellness", description: "Reduced stress and enhanced mental clarity" },
    { title: "Social Connection", description: "Meet like-minded fitness enthusiasts" },
    { title: "Academic Performance", description: "Better focus and energy for studies" },
    { title: "Lifestyle Management", description: "Develop healthy daily routines" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <div className="relative h-80 rounded-xl overflow-hidden mb-8">
            <img 
              src={lakshImage} 
              alt="LAKSH Fitness Cell"
              className="w-full h-full object-cover"
            />
            
          </div>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About LAKSH Fitness Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The LAKSH started in Kadi Sarva Vishwavidyalaya from the year 2018-2019 under the guidance of our Hon’ble Chairman Shri Vallabhbhai M. Patel.
Kadi Sarva Vishwavidyalaya strongly support financially and morally in throughout the event.
The LAKSH designed on Fitness Components like Speed, Endurance, Flexibility, Agility, Strength, Stamina, Power, Coordination and Balance.
To prove yourself in each task in all the three rounds with minimum time.
Final Round conduct at Uttarakhand.
Winner receives Rs.10000/- cash award, Trophy and many more.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To improve not only Health, Fitness and Ability to perform necessary aspects of Sports or Daily Activities but Also Improve Mental and Moral Fitness, to boost Confidence Level, Discipline, Unity, Team work, Leadership Quality and Handle Psychological Stress.
            </p>
            
            
            <div className="flex justify-center">
              <Button className="flex items-center gap-2" size="lg" asChild>
                <a href="https://svkm.org.in/academics/activities/laksh/" target="_blank" rel="noopener noreferrer">
                  Visit Portal <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LakshCell;