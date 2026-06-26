import { Card, CardContent } from "@/components/ui/card";

const FoundersSection = () => {
  const founders = [
    {
      name: "Pujya Chhaganbha",
      image: "https://ksv.ac.in/docs/images/Pujyachaganbha.jpg",
      quote: "Kar Bhala Hoga Bhala.",
      description: "Visionary leader and founding father"
    },
    {
      name: "Late Shri Maneklal M. Patel", 
      image: "https://ksv.ac.in/docs/images/mmpatel.jpg",
      quote: "Education is the true service.",
      description: "Educational pioneer and philanthropist"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Honoring Our Founders
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <Card 
              key={founder.name} 
              className="group overflow-hidden border-0 shadow-lg hover-lift bg-white/80 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-48 h-60 mx-auto rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={founder.image} 
                      alt={founder.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-primary-dark mb-4">
                  {founder.name}
                </h3>
                
                <div className="mb-4">
                  <div className="text-4xl text-primary mb-2">"</div>
                  <p className="text-lg italic text-muted-foreground font-medium leading-relaxed">
                    {founder.quote}
                  </p>
                  <div className="text-4xl text-primary rotate-180 inline-block">"</div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {founder.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoundersSection;