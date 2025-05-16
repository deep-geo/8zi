import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleSelect = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const calculateBazi = async () => {
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    setBaziResult(data);
  };

  const shichenOptions = [
    { label: "子时 (23:00-00:59)", value: "23" },
    { label: "丑时 (01:00-02:59)", value: "1" },
    { label: "寅时 (03:00-04:59)", value: "3" },
    { label: "卯时 (05:00-06:59)", value: "5" },
    { label: "辰时 (07:00-08:59)", value: "7" },
    { label: "巳时 (09:00-10:59)", value: "9" },
    { label: "午时 (11:00-12:59)", value: "11" },
    { label: "未时 (13:00-14:59)", value: "13" },
    { label: "申时 (15:00-16:59)", value: "15" },
    { label: "酉时 (17:00-18:59)", value: "17" },
    { label: "戌时 (19:00-20:59)", value: "19" },
    { label: "亥时 (21:00-22:59)", value: "21" },
  ];

  return (
    <div className="p-6 max-w-xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">🪐 八字排盘：在线命理分析</h1>
        <p className="text-gray-600">输入生辰八字，探索命运天机</p>
      </header>

      <Card className="mb-6">
        <CardContent className="space-y-4">
          <h2 className="text-lg font-semibold">输入出生信息</h2>
          <Input type="number" name="year" placeholder="年份 (如1990)" onChange={handleChange} />
          <Input type="number" name="month" placeholder="月份 (1-12)" onChange={handleChange} />
          <Input type="number" name="day" placeholder="日期 (1-31)" onChange={handleChange} />
          <Select onValueChange={(val) => handleSelect("hour", val)}>
            <SelectTrigger>
              <SelectValue placeholder="请选择出生时辰" />
            </SelectTrigger>
            <SelectContent>
              {shichenOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={calculateBazi}>计算八字</Button>
        </CardContent>
      </Card>

      {baziResult && (
        <Card className="mb-6">
          <CardContent className="space-y-2">
            <h3 className="text-lg font-semibold">排盘结果</h3>
            <p>年柱: {baziResult.yearPillar}</p>
            <p>月柱: {baziResult.monthPillar}</p>
            <p>日柱: {baziResult.dayPillar}</p>
            <p>时柱: {baziResult.hourPillar}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-50">
        <CardContent className="text-center space-y-2">
          <p className="text-gray-700">想知道你的2025流年运势？</p>
          <Button disabled>解锁高级分析（即将上线）</Button>
        </CardContent>
      </Card>

      <footer className="mt-10 text-center text-sm text-gray-500">
        关于 | 联系我们 | 使用协议
      </footer>
    </div>
  );
}
