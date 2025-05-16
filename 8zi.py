from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from lunar_python import Solar

app = FastAPI()

# Allow frontend requests (adjust origin when deploying)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BaziRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int  # 0–23

@app.post("/api/calculate")
def calculate_bazi(data: BaziRequest):
    try:
        solar = Solar(data.year, data.month, data.day, data.hour, 0, 0)
        lunar = solar.getLunar()
        eight_char = lunar.getEightChar()

        # Base Bazi Pillars
        result = {
            "yearPillar": lunar.getYearInGanZhi(),
            "monthPillar": lunar.getMonthInGanZhi(),
            "dayPillar": lunar.getDayInGanZhi(),
            "hourPillar": lunar.getTimeInGanZhi(),
        }

        # DaYun (10-Year Luck Pillars)
        dayuns = []
        for d in eight_char.getDaYun():
            dayuns.append({
                "startAge": d.getStartAge(),
                "ageRange": f"{d.getStartAge()}–{d.getStartAge() + 10}",
                "pillar": d.getGanZhi()
            })
        result["dayun"] = dayuns

        # LiuNian (Annual Luck Pillars): Next 5 years
        base_year = data.year
        liunian = []
        for i in range(5):
            year = base_year + i
            liu = eight_char.getLiuNian(year)
            liunian.append({
                "year": year,
                "pillar": liu.getGanZhi()
            })
        result["liunian"] = liunian

        return result

    except Exception as e:
        return {"error": str(e)}