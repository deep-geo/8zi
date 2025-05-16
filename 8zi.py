from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from lunar_python import Solar

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with actual domain for production
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

        result = {
            "yearPillar": lunar.getYearInGanZhi(),
            "monthPillar": lunar.getMonthInGanZhi(),
            "dayPillar": lunar.getDayInGanZhi(),
            "hourPillar": lunar.getTimeInGanZhi(),
            "dayun": [],
            "liunian": []
        }

        # Optional DaYun support
        if hasattr(eight_char, "getDaYun"):
            dayuns = []
            for d in eight_char.getDaYun():
                dayuns.append({
                    "startAge": d.getStartAge(),
                    "ageRange": f"{d.getStartAge()}–{d.getStartAge() + 10}",
                    "pillar": d.getGanZhi()
                })
            result["dayun"] = dayuns

        # Optional LiuNian support
        if hasattr(eight_char, "getLiuNian"):
            liunian = []
            for i in range(5):
                year = data.year + i
                liu = eight_char.getLiuNian(year)
                liunian.append({
                    "year": year,
                    "pillar": liu.getGanZhi()
                })
            result["liunian"] = liunian

        return result

    except Exception as e:
        return {"error": str(e)}