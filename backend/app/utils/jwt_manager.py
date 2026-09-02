import jwt

class JWTManager:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def create_token(self, data: dict):
        payload = {
            **data,
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def decode_token(self, token: str):
        return jwt.decode(token, self.secret_key, algorithms=["HS256"])
