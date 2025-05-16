import { useState } from "react";

export default function BaziCalculator() {
  const [formData, setFormData] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
  });
  const [baziResult, setBaziResult] = useState(null);
  const [lang, setLang] = useState("zh");

  const labels = {
    zh: {
      title: "🧧 八字排盘计算器",
      year: "出生年份：",
      month: "出生月份：",
      day: "出生日：",
      hour: "出生时辰（小时制 0-23）：",
      placeholderYear: "例如 1990",
      placeholderMonth: "1 到 12",
      placeholderDay: "1 到 31",
      placeholderHour: "例如 13 代表下午 1 点",
      calculate: "🪐 计算八字",
      result: "🧩 排盘结果",
      yearPillar: "年柱",
      monthPillar: "月柱",
      dayPillar: "日柱",
      hourPillar: "时柱",
      disclaimer: "本站仅供参考，不构成任何人生决策建议。",
      switchLang: "EN"
    },
    en: {
      title: "🧧 Bazi Calculator",
      year: "Year of Birth:",
      month: "Month of Birth:",
      day: "Day of Birth:",
      hour: "Hour (0–23):",
      placeholderYear: "e.g. 1990",
      placeholderMonth: "1 to 12",
      placeholderDay: "1 to 31",
      placeholderHour: "e.g. 13 means 1 PM",
      calculate: "🪐 Calculate Bazi",
      result: "🧩 Bazi Result",
      yearPillar: "Year Pillar",
      monthPillar: "Month Pillar",
      dayPillar: "Day Pillar",
      hourPillar: "Hour Pillar",
      disclaimer: "For reference only. Not professional advice.",
      switchLang: "中文"
    }
  };

  const stemsMap = {
    "甲": "A", "乙": "B", "丙": "C", "丁": "D",
    "戊": "E", "己": "F", "庚": "G", "辛": "H",
    "壬": "I", "癸": "J"
  };

  const branchesMap = {
    "子": "🐭", "丑": "🐮", "寅": "🐯", "卯": "🐰",
    "辰": "🐲", "巳": "🐍", "午": "🐴", "未": "🐑",
    "申": "🐵", "酉": "🐔", "戌": "🐶", "亥": "🐷"
  };

  const convert = (ganZhi) => {
    if (!ganZhi || ganZhi.length !== 2) return ["", "", ganZhi];
    const [stem, branch] = ganZhi.split("");
    const s = stemsMap[stem] || stem;
    const b = branchesMap[branch] || branch;
    return [s, b, ganZhi];
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateBazi = async () => {
    const response = await fetch("https://eightzi.onrender.com/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    setBaziResult(data);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>{labels[lang].title}</h1>
        <button onClick={() => setLang(lang === "zh" ? "en" : "zh")} style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
          {labels[lang].switchLang}
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          {labels[lang].year}
          <input type="number" name="year" placeholder={labels[lang].placeholderYear} onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          {labels[lang].month}
          <input type="number" name="month" placeholder={labels[lang].placeholderMonth} onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          {labels[lang].day}
          <input type="number" name="day" placeholder={labels[lang].placeholderDay} onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          {labels[lang].hour}
          <input type="number" name="hour" placeholder={labels[lang].placeholderHour} onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <button onClick={calculateBazi} style={{ padding: "0.75rem", backgroundColor: "#ffcc00", border: "none", cursor: "pointer", fontWeight: "bold" }}>{labels[lang].calculate}</button>
      </div>

      {baziResult && (
        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>{labels[lang].result}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Pillar</th>
                <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Simplified</th>
                <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Original</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{labels[lang].yearPillar}</td>
                <td>{convert(baziResult.yearPillar)[0]}{convert(baziResult.yearPillar)[1]}</td>
                <td>{convert(baziResult.yearPillar)[2]}</td>
              </tr>
              <tr>
                <td>{labels[lang].monthPillar}</td>
                <td>{convert(baziResult.monthPillar)[0]}{convert(baziResult.monthPillar)[1]}</td>
                <td>{convert(baziResult.monthPillar)[2]}</td>
              </tr>
              <tr>
                <td>{labels[lang].dayPillar}</td>
                <td>{convert(baziResult.dayPillar)[0]}{convert(baziResult.dayPillar)[1]}</td>
                <td>{convert(baziResult.dayPillar)[2]}</td>
              </tr>
              <tr>
                <td>{labels[lang].hourPillar}</td>
                <td>{convert(baziResult.hourPillar)[0]}{convert(baziResult.hourPillar)[1]}</td>
                <td>{convert(baziResult.hourPillar)[2]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
        {labels[lang].disclaimer}
      </div>
    </div>
  );
}
