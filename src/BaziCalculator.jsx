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
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "auto" }}>
      <h1>八字排盘计算器</h1>
      <input type="number" name="year" placeholder="年份 (如1990)" onChange={handleChange} /><br />
      <input type="number" name="month" placeholder="月份 (1-12)" onChange={handleChange} /><br />
      <input type="number" name="day" placeholder="日期 (1-31)" onChange={handleChange} /><br />
      <input type="number" name="hour" placeholder="时辰 (0-23)" onChange={handleChange} /><br />
      <button onClick={calculateBazi}>计算八字</button>

      {baziResult && (
        <div style={{ marginTop: "1rem" }}>
          <h2>排盘结果</h2>
          <p>年柱: {baziResult.yearPillar}</p>
          <p>月柱: {baziResult.monthPillar}</p>
          <p>日柱: {baziResult.dayPillar}</p>
          <p>时柱: {baziResult.hourPillar}</p>
        </div>
      )}
    </div>
  );
}
