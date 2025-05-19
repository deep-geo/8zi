import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BaziCalculator() {
  const [formData, setFormData] = useState({
    year: "", month: "", day: "", hour: "", gender: "1"
  });
  const [baziResult, setBaziResult] = useState(null);
  const [lang, setLang] = useState("en");

  const labels = {
    zh: {
      title: "☯️ 八字排盘计算器", year: "出生年份：", month: "出生月份：", day: "出生日：",
      hour: "出生时辰（小时制 0-23）：", gender: "性别", placeholderYear: "例如 1990",
      placeholderMonth: "1 到 12", placeholderDay: "1 到 31", placeholderHour: "例如 13 代表下午 1 点",
      calculate: "🪐 计算八字", result: "🧩 排盘结果", yearPillar: "年柱", monthPillar: "月柱",
      dayPillar: "日柱", hourPillar: "时柱", disclaimer: "本站仅供参考，不构成任何人生决策建议。",
      switchLang: "EN"
    },
    en: {
      title: "☯️ Chinese Destiny Chart Calculator", year: "Birth Year:", month: "Birth Month:", day: "Birth Day:",
      hour: "Hour of Birth (0–23):", gender: "Gender", placeholderYear: "e.g. 1990",
      placeholderMonth: "1 to 12", placeholderDay: "1 to 31", placeholderHour: "e.g. 13 means 1 PM",
      calculate: "🧠 Generate Destiny Chart", result: "🧩 Four Pillars Result", yearPillar: "Year Pillar",
      monthPillar: "Month Pillar", dayPillar: "Day Pillar", hourPillar: "Hour Pillar",
      disclaimer: "For entertainment purposes only. Not professional advice.", switchLang: "中文"
    }
  };

  const stemsMap = {
    "甲": "A", "乙": "B", "丙": "C", "丁": "D", "戊": "E", "己": "F",
    "庚": "G", "辛": "H", "壬": "I", "癸": "J"
  };
  const branchesMap = {
    "子": "🐭", "丑": "🐮", "寅": "🐯", "卯": "🐰", "辰": "🐲", "巳": "🐍",
    "午": "🐴", "未": "🐑", "申": "🐵", "酉": "🐔", "戌": "🐶", "亥": "🐷"
  };

  const convert = (ganZhi) => {
    if (!ganZhi || ganZhi.length !== 2) return ["", "", ganZhi];
    const [stem, branch] = ganZhi.split("");
    return [stemsMap[stem] || stem, branchesMap[branch] || branch, ganZhi];
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateBazi = async () => {
    const response = await fetch("https://eightzi.onrender.com/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();

    const interpretResponse = await fetch("https://eightzi.onrender.com/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yearPillar: data.yearPillar,
        monthPillar: data.monthPillar,
        dayPillar: data.dayPillar,
        hourPillar: data.hourPillar,
        dayun: data.dayun,
        liunian: data.liunian,
      }),
    });

    const interpretationData = await interpretResponse.json();
    data.interpretation = interpretationData.interpretation;
    setBaziResult(data);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{labels[lang].title}</h1>
        <button onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
          {labels[lang].switchLang}
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {["year", "month", "day", "hour"].map((field) => (
          <label key={field}>
            {labels[lang][field]}
            <input
              type="number"
              name={field}
              placeholder={labels[lang][`placeholder${field.charAt(0).toUpperCase() + field.slice(1)}`]}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </label>
        ))}
        <label>
          {labels[lang].gender}
          <select name="gender" onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }}>
            <option value="1">{lang === "zh" ? "男" : "Male"}</option>
            <option value="0">{lang === "zh" ? "女" : "Female"}</option>
          </select>
        </label>
        <button
          onClick={calculateBazi}
          style={{ padding: "0.75rem", backgroundColor: "#ffcc00", border: "none", cursor: "pointer", fontWeight: "bold" }}
        >
          {labels[lang].calculate}
        </button>
      </div>

      {baziResult && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{labels[lang].result}</h2>

          <div style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
            <h3>🧩 Four Pillars</h3>
            <table style={{ width: "100%" }}>
              <thead><tr><th>Pillar</th><th>Simplified</th><th>Traditional</th></tr></thead>
              <tbody>
                {["yearPillar", "monthPillar", "dayPillar", "hourPillar"].map((key) => (
                  <tr key={key}>
                    <td>{labels[lang][key]}</td>
                    <td>{convert(baziResult[key])[0]}{convert(baziResult[key])[1]}</td>
                    <td>{convert(baziResult[key])[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#fffbe6", borderRadius: "8px" }}>
            <h3>📖 Gemini AI Interpretation</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {baziResult.interpretation}
            </ReactMarkdown>
          </div>

          <div style={{ marginTop: "1.5rem", backgroundColor: "#eef8ff", padding: "1rem", borderRadius: "8px" }}>
            <h3>🔮 DaYun (Decade Luck)</h3>
            <table style={{ width: "100%" }}>
              <thead><tr><th>Start Age</th><th>Age Range</th><th>Pillar</th></tr></thead>
              <tbody>
                {baziResult.dayun?.map((d, i) => (
                  <tr key={i}><td>{d.startAge}</td><td>{d.ageRange}</td><td>{d.pillar}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "1.5rem", backgroundColor: "#fff6ec", padding: "1rem", borderRadius: "8px" }}>
            <h3>📅 LiuNian (Annual Luck)</h3>
            <table style={{ width: "100%" }}>
              <thead><tr><th>Year</th><th>Pillar</th></tr></thead>
              <tbody>
                {baziResult.liunian?.map((d, i) => (
                  <tr key={i}><td>{d.year}</td><td>{d.pillar}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
        {labels[lang].disclaimer}
      </div>
    </div>
  );
}