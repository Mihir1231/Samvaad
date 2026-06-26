import { Link } from "react-router-dom";

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-primary mb-6">Faculty Dashboard</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Welcome to the faculty panel! You can view classes, upload materials, and manage students.
      </p>

      <div className="space-x-4">
        <Link
          to="/faculty-login"
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Logout
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
