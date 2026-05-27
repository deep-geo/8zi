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
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
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
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>{labels[lang].title}</h1>
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
      <table style={{ width: "100%" }}>
        <thead><tr><th>Start Age</th><th>Age Range</th><th>Pillar</th></tr></thead>
        <tbody>
          {baziResult.dayun?.map((d, i) => (
            <tr key={i}><td>{d.startAge}</td><td>{d.ageRange}</td><td>{d.pillar}</td></tr>
          ))}
        </tbody>
      </table>

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
      <table style={{ width: "100%" }}>
        <thead><tr><th>Year</th><th>Pillar</th></tr></thead>
        <tbody>
          {baziResult.liunian?.map((d, i) => (
            <tr key={i}><td>{d.year}</td><td>{d.pillar}</td></tr>
          ))}
        </tbody>
      </table>

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
          <h2>{lang === "zh" ? "历史记录" : "My History"}</h2>
          {history.length === 0 ? (
            <p style={{ color: "#888" }}>{lang === "zh" ? "暂无记录，算一次命盘后自动保存。" : "No records yet. Your charts will be saved automatically."}</p>
          ) : (
            history.map((item) => (
              <div key={item.id} style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
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