import random
import string


def generate_password(length=12, use_digits=True, use_special_chars=True):
    letters = string.ascii_letters
    digits = string.digits if use_digits else ''
    special_chars = string.punctuation if use_special_chars else ''

    all_chars = letters + digits + special_chars
    if not all_chars:
        raise ValueError("Нельзя создать пароль без символов")

    password = ''.join(random.choice(all_chars) for _ in range(length))
    return password
