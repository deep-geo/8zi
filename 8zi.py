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
        print(f"📥 Received input: {data}")

        solar = Solar(data.year, data.month, data.day, data.hour, 0, 0)
        lunar = solar.getLunar()
        eight_char = lunar.getEightChar(gender=1)

        # Debug: print 4 pillars
        print("📜 Pillars:")
        print("  Year:", lunar.getYearInGanZhi())
        print("  Month:", lunar.getMonthInGanZhi())
        print("  Day:", lunar.getDayInGanZhi())
        print("  Hour:", lunar.getTimeInGanZhi())

        # Debug: method check
        print("🔍 has getDaYun:", hasattr(eight_char, "getDaYun"))
        print("🔍 has getLiuNian:", hasattr(eight_char, "getLiuNian"))

        result = {
            "yearPillar": lunar.getYearInGanZhi(),
            "monthPillar": lunar.getMonthInGanZhi(),
            "dayPillar": lunar.getDayInGanZhi(),
            "hourPillar": lunar.getTimeInGanZhi(),
            "dayun": [],
            "liunian": []
        }

        # DaYun with debugging
        if hasattr(eight_char, "getDaYun"):
            try:
                dayun_raw = eight_char.getDaYun()
                print(f"✅ getDaYun() returned {len(dayun_raw)} items")
                for d in dayun_raw:
                    print("  ➤", d.getStartAge(), d.getGanZhi())
                    result["dayun"].append({
                        "startAge": d.getStartAge(),
                        "ageRange": f"{d.getStartAge()}–{d.getStartAge() + 10}",
                        "pillar": d.getGanZhi()
                    })
            except Exception as e:
                print("❌ Error calling getDaYun():", e)

        # LiuNian with debugging
        if hasattr(eight_char, "getLiuNian"):
            try:
                for i in range(5):
                    year = data.year + i
                    ln = eight_char.getLiuNian(year)
                    print(f"📅 LiuNian {year}: {ln.getGanZhi()}")
                    result["liunian"].append({
                        "year": year,
                        "pillar": ln.getGanZhi()
                    })
            except Exception as e:
                print("❌ Error calling getLiuNian():", e)

        print("✅ Final result:", result)
        return result

    except Exception as e:
        print("❌ Exception in calculate_bazi:", e)
        return {"error": str(e)}