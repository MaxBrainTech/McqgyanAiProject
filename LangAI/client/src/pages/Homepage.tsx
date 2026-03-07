import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-4xl font-bold">Home Page</h1>

      <button onClick={() => navigate("/test")} className="btn">
        Start Test
      </button>

      <button onClick={() => navigate("/teacher-auth")} className="btn">
        Teacher Login
      </button>

      <button onClick={() => navigate("/custom-test")} className="btn">
        Custom Test
      </button>

      <button onClick={() => navigate("/answer-evaluator")} className="btn">
        Answer Evaluator
      </button>
    </div>
  );
}
