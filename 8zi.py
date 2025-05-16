from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from lunar_python import Solar

app = FastAPI()

# Allow frontend requests (adjust origin when deploying)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace * with your frontend domain in production
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
        return {
            "yearPillar": lunar.getYearInGanZhi(),
            "monthPillar": lunar.getMonthInGanZhi(),
            "dayPillar": lunar.getDayInGanZhi(),
            "hourPillar": lunar.getTimeInGanZhi()
        }
    except Exception as e:
        return {"error": str(e)}