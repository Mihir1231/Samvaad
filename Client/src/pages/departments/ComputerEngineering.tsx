import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import computerEngineeringImg from "@/assets/computer-engineering.jpg";
import faculty1 from "@/assets/faculty-1.jpg";
import faculty2 from "@/assets/faculty-2.jpg";
import faculty3 from "@/assets/faculty-3.jpg";

const ComputerEngineering = () => {
  const facultyList = [
    {
      name: "Dr. Ashishkumar Patel",
      designation: "Head of Department",
      qualification: "PHD, ME (CSE), BE (CE), Diploma (CE)",
      experience: "19 years",
      specialization: "Data Science, Artificial Intelligence, Machine Learning",
      image: faculty1
    },
    {
      name: "Dr. Jayana C. Kaneriya",
      designation: "Associate Professor",
      qualification: "	PhD",
      experience: "17 years",
      specialization: "SNetwork security, Blockchain Technology",
      image: faculty2
    },
    {
      name: "Prof. Trupesh Patel",
      designation: "Assistant Professor",
      qualification: "PHD Pursuing, ME-CSE",
      experience: "11 years",
      specialization: "Data Structures, Artificial Intelligence, Deep Learning, Federated Learning, Computer Vision, Blockchain Technology",
      image: faculty3
    },
     {
      name: "Dr. Hitesh Patel",
      designation: "Associate Professor",
      qualification: "	PhD, M.Tech(CE), BE(IT)",
      experience: "19 years",
      specialization: "	Machine Learning, Optimization, Security, Cloud Computing",
      image: "https://www.ldrp.ac.in/images/faculty/1_Hitesh%20Photo.jpg"
    },
     {
      name: "	Dr. Himani Trivedi",
      designation: "	Assistant Professor",
      qualification: "	PHD, ME-CE",
      experience: "8 years",
      specialization: "		Machine Learning, Deep Learning and Computer Vision",
      image: "https://www.ldrp.ac.in/images/faculty/1_HimaniTrivedi.jpg"
    },
     {
      name: "	Dr. Avani Dadhania",
      designation: "Associate Professor",
      qualification: "		PHD, M Tech (CSE)",
      experience: "16 years",
      specialization: "Cryptography and Network Security, Internet of Things, Cyber Security, Blockchain Technology, Machine Learning",
      image: "https://www.ldrp.ac.in/images/faculty/1_NI%20J%20Lecturer.jpg"
    },
     {
      name: "	Prof. Dharmesh Tank",
      designation: "	Assistant Professor",
      qualification: "		PhD Pursuing, ME(CSE)",
      experience: "10 years",
      specialization: "	Machine Learning, Deep Learning and Computer Vision",
      image: "https://www.ldrp.ac.in/images/faculty/DharmeshTank.jpg"
    },
     {
      name: "	Prof. Alok Patel",
      designation: "	Assistant Professor",
      qualification: "		ME-CE",
      experience: "9 years",
      specialization: "	Web Development Technology, Data mining, Blockchain Technology, Machine Learning",
      image: "https://www.ldrp.ac.in/images/faculty/alok.png"
    },
     {
      name: "	Prof. Bhargavi Patel",
      designation: "Associate Professo",
      qualification: "		ME(CE), BE(CE)",
      experience: "8 years",
      specialization: "		Software Testing, Cloud Computing, Deep Learning, Data Analytics",
      image: "https://www.ldrp.ac.in/images/faculty/Bhargavi.jpeg"
    },
     {
      name: "	Prof. Bhautik Panchal",
      designation: "	Assistant Professor",
      qualification: "		M.Tech.)",
      experience: "7 years",
      specialization: "	Computer Networks,IoT,Artificial Intelligence, Machine Learning",
      image: "https://www.ldrp.ac.in/images/faculty/BhautikPanchal.jpg"
    },
     {
      name: "	Dr. Riya Gohil",
      designation: "Assistant Professor",
      qualification: "	Ph.D., ME (CE), BE(IT)",
      experience: "16 years",
      specialization: "Cloud computing, AWS services , Artificial Intelligent, Big Data Analytics",
      image: "https://www.ldrp.ac.in/images/faculty/1_Riya.jpg"
    },
     {
      name: "	Dr. Jalpa Khamar",
      designation: "	Assistant Professor",
      qualification: "	PhD , ME(CE), BE(CE)",
      experience: "18 years",
      specialization: "	Wireless/Adhoc Networks, Blockchain technology, Network/Cyber Security",
      image: "https://www.ldrp.ac.in/images/faculty/1_Jalpa%20Khamar.JPG"
    },
  
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
              Established in 2005, the Computer Engineering department of LDRP Institute of Technology and Research offers Bachelor of Engineering (B. E.) and Master of Engineering (M. E.) programmes in Computer Engineering. The undergraduate B. E. programme is current intake of 180 students where as the M. E. is having the intake of 18. Admissions to both these programmes are carried out by the Government nominated admission committee (http://jacpcldce.ac.in). The department has adequate and well-qualified doctorate faculty members who also act as supervisors for Ph.D. programme being run by affiliating university viz. Kadi Sarva Vishwavidyalaya (https://ksvuniversity.org.in/). Active research and post-graduate dissertation is being carried out in department under various facets viz. Cloud computing, data/web mining, networking, image processing, soft computing, IoT etc. Equipped with latest tools and hardware, the department offers state of the art infrastructures to its students for their all round development. Collaboration of various significant stakeholders such as alumni, industry, academia and parents, department resolute to offer all aspects of teaching learning process before the students. Various curricular, co-curricular and extra-curricular activities provide platform to the students to grow freely.
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

export default ComputerEngineering;