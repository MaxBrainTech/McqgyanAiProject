import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-10">
      <h1 className="text-4xl font-bold">{t("homepage.title")}</h1>

      <button onClick={() => navigate("/test")} className="btn">
        {t("homepage.startTest")}
      </button>

      <button onClick={() => navigate("/teacher-auth")} className="btn">
        {t("homepage.teacherLogin")}
      </button>

      <button onClick={() => navigate("/custom-test")} className="btn">
        {t("homepage.customTest")}
      </button>

      <button onClick={() => navigate("/answer-evaluator")} className="btn">
        {t("homepage.answerEvaluator")}
      </button>
    </div>
  );
}
