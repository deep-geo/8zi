from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from lunar_python import Solar
import logging

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/debug")
def debug_lunar():
    from lunar_python import Lunar
    return {
        "has_gender_param": "gender" in Lunar.getEightChar.__code__.co_varnames
    }

class BaziRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int  # 0–23
    gender: int = 1  # 1 = male, 0 = female


@app.post("/api/calculate")
def calculate_bazi(data: BaziRequest):
    try:
        print(f"📥 Received input: year={data.year} month={data.month} day={data.day} hour={data.hour}")

        solar = Solar(data.year, data.month, data.day, data.hour, 0, 0)
        lunar = solar.getLunar()

        lunar._gender = data.gender
        eight_char = lunar.getEightChar(gender=data.gender)

        print("✅ Gender set to", "male" if data.gender == 1 else "female")

        result = {
            "yearPillar": lunar.getYearInGanZhi(),
            "monthPillar": lunar.getMonthInGanZhi(),
            "dayPillar": lunar.getDayInGanZhi(),
            "hourPillar": lunar.getTimeInGanZhi(),
            "gender": data.gender,
            "dayun": [],
            "liunian": []
        }

        print("📜 Pillars:", result["yearPillar"], result["monthPillar"], result["dayPillar"], result["hourPillar"])

        # DaYun
        try:
            yun = eight_char.getYun(gender=data.gender)
            dayun_list = yun.getDaYun()
            print(f"📌 getDaYun(): {len(dayun_list)} items")
            result["dayun"] = [{
                "startAge": dy.getStartAge(),
                "ageRange": f"{dy.getStartAge()}–{dy.getStartAge() + 10}",
                "pillar": dy.getGanZhi()
            } for dy in dayun_list]
        except Exception as e:
            print(f"❌ Error in getDaYun(): {e}")

        # LiuNian (Use yearly solar start date to get correct year pillar)
        try:
            liunian_list = []
            for i in range(5):  # e.g., next 5 years
                y = 2025 + i
                try:
                    lunar_y = Solar(y, 1, 1).getLunar()
                    ec_y = lunar_y.getEightChar()
                    liunian_list.append({
                        "year": y,
                        "pillar": ec_y.getYear()
                    })
                    print(f"📅 LiuNian {y}: {ec_y.getYear()}")
                except Exception as e:
                    print(f"❌ Error in LiuNian({y}): {e}")
            result["liunian"] = liunian_list
        except Exception as e:
            print(f"❌ Error in liunian block: {e}")

        return result

    except Exception as e:
        print("❌ Exception in calculate_bazi:", e)
        return {"error": str(e)}

        

@app.get("/")
def read_root():
    return {"message": "Bazi API is live 🎋"}