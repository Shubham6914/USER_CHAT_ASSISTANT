import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0)

try:
    print("Redis ping:", r.ping())
except Exception as e:
    print("Redis error:", e)