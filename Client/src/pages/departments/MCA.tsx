import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mcaImg from "@/assets/mca.jpg";
import faculty20 from "@/assets/faculty-20.jpg";
import faculty19 from "@/assets/faculty-19.jpg";
import faculty21 from "@/assets/faculty-21.jpg";

const MCA = () => {
  const facultyList = [
    {
      name: "	Dr. Bhrantav Vora",
      designation: "Assistant Professor",
      qualification: "Ph.D.(CS), MBA, MCA, BCA",
      experience: "16 years",
      specialization: "AI | ML | Data Science | Web Development | Programming",
      image: faculty19
    },
    {
      name: "	Vishal P. Kothari",
      designation: "Associate Professor",
      qualification: "	B.Com. MCA. Ph.D. (Pursuing)",
      experience: "14 years",
      specialization: "Python, Data Science, Data Analytics, Database management, cloud infrastructure, Block chain Technology",
      image: faculty20
    },
    {
      name: "	MAHENDRA KHAMBHALIA",
      designation: "	Assistant Professor & Head",
      qualification: "	MCA, Ph.D (Pursuing)",
      experience: "25 years",
      specialization: "Advanced Networking, Web Development, Data Science, Deep Learning for Computer Vision.",
      image: faculty21
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
       

        {/* Department Description */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About the Program</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Master of Computer Applications (MCA) program is designed to provide 
              comprehensive knowledge in computer applications, software development, 
              and information technology. This program bridges the gap between computer 
              science theory and practical application development.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our curriculum covers advanced programming, software engineering, database 
              management, web technologies, mobile application development, and emerging 
              technologies like cloud computing and data analytics. Students gain hands-on 
              experience through projects and industry collaborations.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              MCA graduates are well-prepared for roles as software developers, system 
              analysts, project managers, and IT consultants. The program emphasizes 
              both technical skills and project management capabilities, making graduates 
              valuable assets in the IT industry.
            </p>
          </CardContent>
        </Card>

        {/* Faculty Section */}
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold text-primary mb-8">Our Faculty</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facultyList.map((faculty, index) => (
              <Card key={index} className="hover-scale transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <img 
                    src={faculty.image} 
                    alt={faculty.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-md"
                  />
                  <h3 className="font-bold text-lg text-primary mb-2">{faculty.name}</h3>
                  <p className="text-accent font-medium mb-2">{faculty.designation}</p>
                  <p className="text-sm text-muted-foreground mb-1">{faculty.qualification}</p>
                  <p className="text-sm text-muted-foreground mb-2">Experience: {faculty.experience}</p>
                  <p className="text-sm text-primary font-medium">
                    Specialization: {faculty.specialization}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCA;