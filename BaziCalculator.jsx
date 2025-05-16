import { useState } from "react";

export default function BaziCalculator() {
  const [formData, setFormData] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
  });
  const [baziResult, setBaziResult] = useState(null);

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
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem", textAlign: "center" }}>🧧 八字排盘计算器</h1>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          出生年份：
          <input type="number" name="year" placeholder="例如 1990" onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          出生月份：
          <input type="number" name="month" placeholder="1 到 12" onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          出生日：
          <input type="number" name="day" placeholder="1 到 31" onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <label>
          出生时辰（小时制 0-23）：
          <input type="number" name="hour" placeholder="例如 13 代表下午 1 点" onChange={handleChange} style={{ width: "100%", padding: "0.5rem" }} />
        </label>
        <button onClick={calculateBazi} style={{ padding: "0.75rem", backgroundColor: "#ffcc00", border: "none", cursor: "pointer", fontWeight: "bold" }}>🪐 计算八字</button>
      </div>

      {baziResult && (
        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>🧩 排盘结果</h2>
          <p><strong>年柱：</strong>{baziResult.yearPillar}</p>
          <p><strong>月柱：</strong>{baziResult.monthPillar}</p>
          <p><strong>日柱：</strong>{baziResult.dayPillar}</p>
          <p><strong>时柱：</strong>{baziResult.hourPillar}</p>
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
        本站仅供参考，不构成任何人生决策建议。
      </div>
    </div>
  );
}
