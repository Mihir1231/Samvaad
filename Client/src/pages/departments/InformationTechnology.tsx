import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import informationTechnologyImg from "@/assets/information-technology.jpg";
import faculty5 from "@/assets/faculty-5.jpg";
import faculty4 from "@/assets/faculty-4.jpg";
import faculty6 from "@/assets/faculty-6.jpg";

const InformationTechnology = () => {
  const facultyList = [
    {
      name: "DR. MEHUL P. BAROT",
      designation: "Head of Department",
      qualification: "Ph.D, ME(CE), BE(CE)",
      experience: "23 years",
      specialization: "Data Science,Cyber Security, Computer Vision, Computer Network",
      image: faculty4
    },
    {
      name: "Prof. PALAK J. PARMAR",
      designation: "Assistant Professor",
      qualification: "PhD(Pursuing), M.Tech(CE), B.E (IT)",
      experience: "13 years",
      specialization: "Machine Learning, Artificial Intelligence, Data Structure and algorithm, cyber security",
      image: faculty5
    },
    {
      name: "DR. LOKESH GAGNANI",
      designation: "Associate Professor",
      qualification: "	Ph.D, ME(IT), BE(IT)",
      experience: "15 years",
      specialization: "Image Processing, Data Mining, Data Science, Deep Learning, Cyber Security, Internet of Things, Soft Computing, Machine Learning",
      image: faculty6
    },
    {
      name: "DUSHYANT CHAVDA",
      designation: "	Assistant Professor",
      qualification: "		MTech(CSE), BE(IT)",
      experience: "18 years",
      specialization: "	Cyber Security, Data Compression, TOC, AVR",
      image: "https://www.ldrp.ac.in/images/faculty/2_DUSHYANT%20CHAWDA.jpg"
    },
    {
      name: "	RASHMIKA PATEL",
      designation: "Assistant Professor",
      qualification: "		PhD (Pursuing), M.E (CSE),B.E (IT)",
      experience: "13 years",
      specialization: "	Data Security, Artificial intelligence, Machine Learning",
      image: "https://www.ldrp.ac.in/images/faculty/2_RASHMIKA%20N.%20PATEL.jpg"
    },
    {
      name: "	AKASH R BRAHMBHATT",
      designation: "	Assistant Professor",
      qualification: "		PhD(Pursuing), M.Tech(CE), B.E (CE)",
      experience: "8 years",
      specialization: "Machine Learning, Python programming, Java programming, Data Structure",
      image: "https://www.ldrp.ac.in/images/faculty/Akash_ce.jpeg"
    },
    {
      name: "	Prof. Rutul Patel",
      designation: "	Assistant Professor",
      qualification: "		M.Tech(CE).BE(CE)",
      experience: "5 years",
      specialization: "	Artificial Intelligence",
      image: "https://www.ldrp.ac.in/images/faculty/RUTULPATEL.jpg"
    },
    {
      name: "	DEEPALI JAIN",
      designation: "	Assistant Professor",
      qualification: "		M.TECH (CSE) B.TECH(IT)",
      experience: "15 years",
      specialization: "	Artificial Intelligence,Distributed Parallel computing,Web Services,Machine Learning,Python Programming",
      image: "https://www.ldrp.ac.in/images/faculty/Deepali.jpg"
    },
    {
      name: "		NILAM THAKKAR",
      designation: "	Assistant Professor",
      qualification: "			PHD Pursuing, MTech(CE),BE(IT)",
      experience: "5 years",
      specialization: "		Machine Learning, Artificial Intelligence, Deep Learning, Natural Language Processing, Database Management System, Data Mining",
      image: "https://www.ldrp.ac.in/images/faculty/nilamthakkar.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        

        {/* Department Description */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About the Department</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Department of Information Technology focuses on the application of computing 
              technologies to solve real-world problems. Our programs emphasize practical skills 
              in software development, system administration, and technology management, preparing 
              students for diverse career opportunities in the IT industry.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We offer comprehensive training in modern technologies including cloud computing, 
              mobile application development, web technologies, database management, and emerging 
              fields like IoT and data analytics. Our curriculum is regularly updated to reflect 
              current industry trends and requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The department maintains excellent industry partnerships and provides students with 
              internship opportunities, live project experiences, and exposure to cutting-edge 
              technologies. Our graduates are well-prepared for roles in software companies, 
              IT consulting firms, and technology startups.
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

export default InformationTechnology;