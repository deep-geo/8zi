import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "./supabaseClient";

export default function BaziCalculator() {
  const [formData, setFormData] = useState({
    year: "", month: "", day: "", hour: "", gender: "1"
  });
  const [baziResult, setBaziResult] = useState(null);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const splitInterpretation = (interpretationText) => {
    if (!interpretationText) return { personality: "", decadeLuck: "", annualLuck: "", takeaways: "" };
  
    const matchPersonality = interpretationText.match(/\*\*1\..*?(?=\*\*2\.)/s);
    const matchDecadeLuck = interpretationText.match(/\*\*2\..*?(?=\*\*3\.|\*\*4\.|\*\*5\.|\*\*6\.|$)/s);
    const matchAnnualLuck = interpretationText.match(/\*\*5\..*?(?=\*\*6\.|Advice|Summary|$)/s);
    const matchTakeaways = interpretationText.match(/\*\*6\..*/s); // Everything from "**6." onward
  
    const safeTrim = (text) => text?.trim().replace(/\*+$/, "") || "";
  
    return {
      personality: matchPersonality ? "## Personality\n\n" + safeTrim(matchPersonality[0]) : "",
      decadeLuck: matchDecadeLuck && matchDecadeLuck[0].length > 80
        ? "## Decade Luck\n\n" + safeTrim(matchDecadeLuck[0])
        : "",
      annualLuck: matchAnnualLuck && matchAnnualLuck[0].length > 80
        ? "## Annual Luck\n\n" + safeTrim(matchAnnualLuck[0])
        : "",
      takeaways: matchTakeaways ? "## Key Takeaways & Advice\n\n" + safeTrim(matchTakeaways[0]) : "",
    };
  };

  const isError = baziResult?.interpretation?.includes("⚠️ Sorry");

    const { personality, decadeLuck, annualLuck, takeaways } = isError
    ? { personality: baziResult.interpretation, decadeLuck: "", annualLuck: "", takeaways: "" }
    : splitInterpretation(baziResult?.interpretation);

  const labels = {
    zh: {
      title: "☯️ 八字排盘计算器", year: "出生年份：", month: "出生月份：", day: "出生日：",
      hour: "出生时辰（小时制 0-23）：", gender: "性别", placeholderYear: "例如 1990",
      placeholderMonth: "1 到 12", placeholderDay: "1 到 31", placeholderHour: "例如 13 代表下午 1 点",
      calculate: "🪐 计算八字", result: "🧩 排盘结果", yearPillar: "年柱", monthPillar: "月柱",
      dayPillar: "日柱", hourPillar: "时柱", disclaimer: "本站仅供参考，不构成任何人生决策建议。我们存储您的生日以展示历史记录，您可随时在历史记录中删除所有数据。",
      switchLang: "EN"
    },
    en: {
      title: "☯️ Chinese Destiny Chart Calculator", year: "Birth Year:", month: "Birth Month:", day: "Birth Day:",
      hour: "Hour of Birth (0–23):", gender: "Gender", placeholderYear: "e.g. 1990",
      placeholderMonth: "1 to 12", placeholderDay: "1 to 31", placeholderHour: "e.g. 13 means 1 PM",
      calculate: "🧠 Generate Destiny Chart", result: "🧩 Four Pillars Result", yearPillar: "Year Pillar",
      monthPillar: "Month Pillar", dayPillar: "Day Pillar", hourPillar: "Hour Pillar",
      disclaimer: "For entertainment purposes only. Not professional advice. We store your birth data to show history — you can delete it anytime from the History panel.", switchLang: "中文"
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

  const elementMap = {
    "甲": "木", "乙": "木", "寅": "木", "卯": "木",
    "丙": "火", "丁": "火", "巳": "火", "午": "火",
    "戊": "土", "己": "土", "辰": "土", "戌": "土", "丑": "土", "未": "土",
    "庚": "金", "辛": "金", "申": "金", "酉": "金",
    "壬": "水", "癸": "水", "子": "水", "亥": "水",
  };
  const elementColors = { "木": "#4CAF50", "火": "#F44336", "土": "#FF9800", "金": "#9E9E9E", "水": "#222222" };
  const elementEmoji  = { "木": "🌳", "火": "🔥", "土": "🪨", "金": "⚙️", "水": "💧" };
  const elementNames  = { "木": lang === "zh" ? "木" : "Wood", "火": lang === "zh" ? "火" : "Fire", "土": lang === "zh" ? "土" : "Earth", "金": lang === "zh" ? "金" : "Metal", "水": lang === "zh" ? "水" : "Water" };

  const calcElements = (result) => {
    const counts = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 };
    [result.yearPillar, result.monthPillar, result.dayPillar, result.hourPillar].forEach(p => {
      if (!p) return;
      [...p].forEach(char => { if (elementMap[char]) counts[elementMap[char]]++; });
    });
    return counts;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadHistory(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadHistory(session.user.id);
      else setHistory([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async (userId) => {
    const { data } = await supabase
      .from('bazi_history')
      .select('*')
      .eq('user_id', userId)
      .not('birth_year', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  const handleLoadFromHistory = (item) => {
    setFormData({
      year: String(item.birth_year),
      month: String(item.birth_month),
      day: String(item.birth_day),
      hour: String(item.birth_hour),
      gender: String(item.gender),
    });
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAllData = async () => {
    const msg = lang === "zh"
      ? "确定删除所有历史记录？此操作不可撤销。"
      : "Delete all your saved data? This cannot be undone.";
    if (!window.confirm(msg)) return;
    await supabase.from('bazi_history').delete().eq('user_id', user.id);
    setHistory([]);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateBazi = async () => {
    setLoading(true);
    try {
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

      if (interpretationData?.error) {
        data.interpretation = "⚠️ Sorry, the AI failed to generate a reading.";
      } else {
        data.interpretation = interpretationData.interpretation;
      }

      setBaziResult(data);

      if (user) {
        await supabase.from('bazi_history').insert({
          user_id: user.id,
          birth_year: parseInt(formData.year),
          birth_month: parseInt(formData.month),
          birth_day: parseInt(formData.day),
          birth_hour: parseInt(formData.hour),
          gender: parseInt(formData.gender),
          year_pillar: data.yearPillar,
          month_pillar: data.monthPillar,
          day_pillar: data.dayPillar,
          hour_pillar: data.hourPillar,
          interpretation: data.interpretation,
        });
        loadHistory(user.id);
      }
    } catch (err) {
      setBaziResult({ error: true, interpretation: "⚠️ Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bazi-container" style={{ padding: "2rem", maxWidth: "700px", margin: "auto", fontFamily: "sans-serif" }}>
      <style>{`
        @media (max-width: 500px) {
          .bazi-container { padding: 1rem !important; }
          .bazi-title { font-size: 1.2rem !important; }
          .bazi-header { flex-direction: column !important; align-items: flex-start !important; }
          .bazi-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .bazi-table { font-size: 0.82rem; min-width: 260px; }
          .bazi-table th, .bazi-table td { padding: 0.25rem 0.4rem; }
          input[type="number"], select { font-size: 16px !important; box-sizing: border-box; }
        }
      `}</style>
      <div className="bazi-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 className="bazi-title" style={{ margin: 0 }}>{labels[lang].title}</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
            {labels[lang].switchLang}
          </button>
          {user ? (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ padding: "0.4rem 0.8rem", backgroundColor: "#eef8ff", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
              >
                {lang === "zh" ? "历史记录" : "History"}
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: "0.4rem 0.8rem", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
              >
                {lang === "zh" ? "登出" : "Logout"}
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              style={{ padding: "0.4rem 0.8rem", backgroundColor: "#4285f4", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              {lang === "zh" ? "Google 登录" : "Sign in with Google"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {["year", "month", "day", "hour"].map((field) => (
          <label key={field}>
            {labels[lang][field]}
            <input
              type="number"
              name={field}
              value={formData[field]}
              placeholder={labels[lang][`placeholder${field.charAt(0).toUpperCase() + field.slice(1)}`]}
              onChange={handleChange}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </label>
        ))}
        <div>
          <div style={{ marginBottom: "0.3rem" }}>{labels[lang].gender}</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ value: "1", label: lang === "zh" ? "男 ♂" : "Male ♂" }, { value: "0", label: lang === "zh" ? "女 ♀" : "Female ♀" }].map(opt => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "1rem" }}>
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={formData.gender === opt.value}
                  onChange={handleChange}
                  style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={calculateBazi}
          disabled={loading}
          style={{ padding: "0.75rem", backgroundColor: loading ? "#ccc" : "#ffcc00", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
        >
          {loading ? (lang === "zh" ? "⏳ 计算中，请稍候…" : "⏳ Calculating, please wait…") : labels[lang].calculate}
        </button>
        {loading && (
          <div style={{ textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
            {lang === "zh" ? "首次加载服务器可能需要约 30 秒，请耐心等待。" : "First load may take ~30s while the server wakes up."}
          </div>
        )}
      </div>



{baziResult && (
  <div style={{ marginTop: "2rem" }}>
    <h2>{labels[lang].result}</h2>

    <div style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
      <h3>🧩 Four Pillars</h3>
      <div className="bazi-table-wrapper">
      <table className="bazi-table" style={{ width: "100%" }}>
        <thead><tr><th>Pillar</th><th>Simplified</th><th>Traditional</th></tr></thead>
        <tbody>
          {["yearPillar", "monthPillar", "dayPillar", "hourPillar"].map((key) => {
            const ganZhi = baziResult[key] || "";
            const stem = ganZhi[0];
            const branch = ganZhi[1];
            const stemColor = elementColors[elementMap[stem]] || "#333";
            const branchColor = elementColors[elementMap[branch]] || "#333";
            return (
              <tr key={key}>
                <td>{labels[lang][key]}</td>
                <td style={{ fontSize: "1.3rem", letterSpacing: "0.05em" }}>
                  {elementEmoji[elementMap[stem]] || stem}
                  {branchesMap[branch] || branch}
                </td>
                <td>
                  <span style={{ color: stemColor, fontWeight: "bold" }}>{stem}</span>
                  <span style={{ color: branchColor, fontWeight: "bold" }}>{branch}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* 五行分析 */}
      {(() => {
        const counts = calcElements(baziResult);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return (
          <div style={{ marginTop: "1rem", backgroundColor: "#fff", border: "1px solid #eee", padding: "1rem", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>{lang === "zh" ? "⚖️ 五行分析" : "⚖️ Five Elements Balance"}</h3>
            {["木", "火", "土", "金", "水"].map(el => (
              <div key={el} style={{ marginBottom: "0.7rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{elementEmoji[el]}</span>
                  <span style={{ fontWeight: "bold", width: "2.5rem" }}>{elementNames[el]}</span>
                  <span style={{ color: "#888", fontSize: "0.85rem" }}>{"●".repeat(counts[el])}{counts[el] === 0 ? "—" : ""}</span>
                </div>
                <div style={{ backgroundColor: "#e8e8e8", borderRadius: "6px", height: "14px", overflow: "hidden" }}>
                  <div style={{
                    width: total > 0 ? `${(counts[el] / total) * 100}%` : "0%",
                    backgroundColor: elementColors[el],
                    height: "100%",
                    borderRadius: "6px",
                    transition: "width 0.6s ease",
                    minWidth: counts[el] > 0 ? "8px" : "0",
                  }} />
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 1️⃣ Gemini after Four Pillars */}
      <div style={{ marginTop: "1rem", backgroundColor: "#fffbe6", padding: "1rem", borderRadius: "8px" }}>
        <h3>📖 Interpretation</h3>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {personality}
        </ReactMarkdown>
      </div>
    </div>

    <div style={{ marginTop: "1.5rem", backgroundColor: "#eef8ff", padding: "1rem", borderRadius: "8px" }}>
      <h3>🔮 DaYun (Decade Luck)</h3>
      <div className="bazi-table-wrapper">
      <table className="bazi-table" style={{ width: "100%" }}>
        <thead><tr><th>Start Age</th><th>Age Range</th><th>Pillar</th></tr></thead>
        <tbody>
          {baziResult.dayun?.map((d, i) => (
            <tr key={i}><td>{d.startAge}</td><td>{d.ageRange}</td><td>{d.pillar}</td></tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* 2️⃣ Gemini after DaYun */}
      <div style={{ marginTop: "1rem", backgroundColor: "#fffbe6", padding: "1rem", borderRadius: "8px" }}>
        {/*<h3>📖 Insights</h3>*/}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {decadeLuck}
        </ReactMarkdown>
      </div>
    </div>

    <div style={{ marginTop: "1.5rem", backgroundColor: "#fff6ec", padding: "1rem", borderRadius: "8px" }}>
      <h3>📅 LiuNian (Annual Luck)</h3>
      <div className="bazi-table-wrapper">
      <table className="bazi-table" style={{ width: "100%" }}>
        <thead><tr><th>Year</th><th>Pillar</th></tr></thead>
        <tbody>
          {baziResult.liunian?.map((d, i) => (
            <tr key={i}><td>{d.year}</td><td>{d.pillar}</td></tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* 3️⃣ Gemini after LiuNian */}
      <div style={{ marginTop: "1rem", backgroundColor: "#fffbe6", padding: "1rem", borderRadius: "8px" }}>
        {/*<h3>📖 Forecast</h3>*/}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {annualLuck}
        </ReactMarkdown>
      </div>

      {/* 4️⃣ Gemini Final Advice */}
      <div style={{ marginTop: "1.5rem", backgroundColor: "#eaf8ea", padding: "1rem", borderRadius: "8px" }}>
        {/*<h3>🎯 Summary & Advice</h3>*/}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {takeaways}
        </ReactMarkdown>
      </div>
    </div>
  </div>
)}

      {user && showHistory && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>{lang === "zh" ? "历史记录" : "My History"}</h2>
            {history.length > 0 && (
              <button
                onClick={handleDeleteAllData}
                style={{ padding: "0.3rem 0.7rem", backgroundColor: "#fff0f0", color: "#cc0000", border: "1px solid #ffcccc", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
              >
                {lang === "zh" ? "删除所有数据" : "Delete my data"}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p style={{ color: "#888" }}>{lang === "zh" ? "暂无记录，算一次命盘后自动保存。" : "No records yet. Your charts will be saved automatically."}</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadFromHistory(item)}
                style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e8e8e8"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              >
                <div style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.3rem" }}>
                  {new Date(item.created_at).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
                </div>
                <div style={{ fontWeight: "bold" }}>
                  {item.birth_year}/{item.birth_month}/{item.birth_day}&nbsp;
                  {lang === "zh" ? `${item.birth_hour}时` : `${item.birth_hour}:00`}&nbsp;·&nbsp;
                  {item.gender === 1 ? (lang === "zh" ? "男" : "Male") : (lang === "zh" ? "女" : "Female")}
                </div>
                <div style={{ marginTop: "0.3rem", letterSpacing: "0.1em" }}>
                  {item.year_pillar} {item.month_pillar} {item.day_pillar} {item.hour_pillar}
                </div>
                <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#aaa" }}>
                  {lang === "zh" ? "点击重新加载 →" : "Click to load →"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
        {labels[lang].disclaimer}
      </div>
    </div>
  );
}