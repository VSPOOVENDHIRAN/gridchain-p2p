import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)

BROKER = os.getenv("BROKER")
PORT = int(os.getenv("PORT", 8883))
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")

print(BROKER, PORT, USERNAME, PASSWORD)
#        METER SIMULATION CONFIG
#d2ed7624168549baa276fe4f8c9fb29e.s1.eu.hivemq.cloud 8883 poovuexample qY6k574ZeP_JNr@
#d2ed7624168549baa276fe4f8c9fb29e.s1.eu.hivemq.cloud 8883 poovendhiran qY6k574ZeP_JNr@
METER_IDS = ["MTR_SIM_001", "MTR_SIM_002", "MTR_SIM_003", "MTR_SIM_004"]

# Keep cumulative readings per meter
meter_readings = {
    meter_id: {"import": 0.0, "export": 0.0} for meter_id in METER_IDS
}

#        MQTT CLIENT SETUP

client = mqtt.Client(client_id="PowerLedger_Simulator")

client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()
client.tls_insecure_set(False)


print("Connecting to HiveMQ Cloud broker...")
client.connect(BROKER, PORT, 60)
print("Connected to HiveMQ Cloud broker successfully!\n")

def get_period():
    hour = datetime.now().hour
    if 6 <= hour < 9:
        return "morning_rush"
    elif 9 <= hour < 17:
        return "day_normal"
    elif 17 <= hour < 22:
        return "evening_rush"
    else:
        return "night_free"

def get_publish_interval(period):
    if period in ["morning_rush", "evening_rush"]:
        return 60
    elif period == "day_normal":
        return 180
    else:
        return 600

def generate_meter_data(meter_id, period):
    """
    ✔ All meters treated as PROSUMERS
    ✔ Separate IMPORT and EXPORT calculation
    ✔ No net direction or net power logic
    """

    # ----- Load (consumption) -----
    if period == "morning_rush":
        load_kw = random.uniform(2.0, 3.5)
    elif period == "day_normal":
        load_kw = random.uniform(1000.0, 2000.0)
    elif period == "evening_rush":
        load_kw = random.uniform(2.0, 3.5)
    else:  # night_free
        load_kw = random.uniform(0.3, 1.0)

    # ----- Solar Generation (all are prosumers) -----
    if period == "day_normal":
        gen_kw = random.uniform(0.5, 2.5)
    elif period == "morning_rush":
        gen_kw = random.uniform(0.0, 0.3)
    elif period == "evening_rush":
        gen_kw = random.uniform(0.0, 0.2)
    else:  # night_free
        gen_kw = 0.0

    # Simulated time per reading = 0.02 hours (1.2 minutes)
    dt_hours = 0.02

    # ----- DAILY ENERGY IN/OUT -----
    import_kwh = load_kw * dt_hours
    export_kwh = gen_kw * dt_hours

    # accumulate totals
    meter_readings[meter_id]["import"] += import_kwh
    meter_readings[meter_id]["export"] += export_kwh

    # ----- Electrical values -----
    voltage = round(random.uniform(220, 240), 2)
    power_watts = round(load_kw * 1000, 2)
    current = round(power_watts / voltage, 2)

    return {
        "meter_id": meter_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "period": period,
        "voltage": voltage,
        "current": current,
        "power_watts": power_watts,
        "import_kwh": round(meter_readings[meter_id]["import"], 3),
        "export_kwh": round(meter_readings[meter_id]["export"], 3),
        "status": "active"
    }


# =======================================================
try:
    print("Smart Meter Simulation (4 meters) started...\n")
    while True:
        current_period = get_period()
        interval = get_publish_interval(current_period)

        for meter_id in METER_IDS:
            data = generate_meter_data(meter_id, current_period)
            topic = f"powerledger/meter/{meter_id}/data"
            client.publish(topic, json.dumps(data))
            print(
                f"[{datetime.now().strftime('%H:%M:%S')}] {meter_id} | "
                f"Import: {data['import_kwh']} kWh | Export: {data['export_kwh']} kWh"
            )

        print(f"Next publish in {interval/60:.1f} minutes\n")
        time.sleep(interval)

except KeyboardInterrupt:

    print("Simulation stopped by user.")
    client.disconnect()
