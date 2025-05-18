from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from lunar_python import Solar

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
        if hasattr(eight_char, "getDaYun"):
            try:
                dy_list = eight_char.getDaYun(gender=data.gender)
                print(f"📌 getDaYun(): {len(dy_list)} items")
                result["dayun"] = [{
                    "startAge": dy.getStartAge(),
                    "ageRange": f"{dy.getStartAge()}–{dy.getStartAge() + 10}",
                    "pillar": dy.getGanZhi()
                } for dy in dy_list]
            except Exception as e:
                print(f"❌ Error in getDaYun(): {e}")

        # LiuNian
        if hasattr(eight_char, "getLiuNian"):
            base_year = data.year
            liunian_list = []
            for i in range(5):
                y = base_year + i
                try:
                    liu = eight_char.getLiuNian(y, gender=data.gender)
                    liunian_list.append({
                        "year": y,
                        "pillar": liu.getGanZhi()
                    })
                    print(f"📅 LiuNian {y}: {liu.getGanZhi()}")
                except Exception as e:
                    print(f"❌ Error in getLiuNian({y}): {e}")
            result["liunian"] = liunian_list

        print("✅ Final result ready")
        return result

    except Exception as e:
        print("❌ Exception in calculate_bazi:", e)
        return {"error": str(e)}

@app.get("/")
def read_root():
    return {"message": "Bazi API is live 🎋"}