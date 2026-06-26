import { useState, useEffect } from "react";
import { ArrowRight, Calendar, Users, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import background images from assets
import heroImage1 from "@/assets/hero-campus.jpg";
import heroImage2 from "@/assets/hero-campus2.jpg";

import FoundersSection from "@/components/sections/FoundersSection";
import ChatBot from "@/components/ChatBot";
import SearchBar from "@/components/SearchBar";

const Home = () => {
  // background slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const backgroundImages = [heroImage1, heroImage2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // change every 5s
    return () => clearInterval(interval);
  }, []);

  // Mock data
  const galleryItems = [
    {
      id: 3,
      title: "Campus Infrastructure",
      image:
        "https://image-static.collegedunia.com/public/reviewPhotos/680942/IMG_20240223_124013.jpg",
      category: "Campus",
    },
    {
      id: 4,
      title: "Student Activities",
      image:
        "https://geetanjaligroupofcolleges.in/wp-content/uploads/2020/06/sac3.jpg",
      category: "Activities",
    },
    {
      id: 5,
      title: "Faculty Development Program",
      image:
        "https://media.licdn.com/dms/image/v2/D4D22AQHzGJSBMbUw5g/feedshare-shrink_800/B4DZQLpI.vHUAg-/0/1735362125011?e=2147483647&v=beta&t=Q96CApv--IeVZ8-bM_Zx-xoMKsbhS7cEZ8DHZf22D5A",
      category: "Faculty",
    },
  ];

  const newsItems = [
   
  ];

  const stats = [
    { icon: Users, label: "Students", value: "2500+" },
    { icon: BookOpen, label: "Programs", value: "25+" },
    { icon: Award, label: "Awards", value: "100+" },
    { icon: Calendar, label: "Years", value: "20+" },
  ];

  return (
    <div className="min-h-screen">
       <div className="absolute top-32 right-4 z-20 w-80">
        <SearchBar />
      </div>

      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        
        {/* Background Slideshow */}
        {backgroundImages.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${bg})` }}
          >
            
            <div className="absolute inset-0  from-primary/80 to-primary-dark/60">

           
            
            </div>
            
          </div>
        ))}
        


        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">

           
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 fade-in">
            Leelaben Dhasrthbhai Ramdas Patel Institute of Technology and Research
          </h1>
          <p className="text-4xl md:text-4xl text-white/90 mb-8 slide-up">
            Education is true Service
          </p>
        </div>
        
        
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-primary-dark mb-2">
                  {stat.value}
                </h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <FoundersSection />

      {/* Latest Galleries Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
               Gallery
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryItems.map((item, index) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-0 shadow-lg hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-primary-dark"
                    >
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-dark transition-colors">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      

      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
};

export default Home;
