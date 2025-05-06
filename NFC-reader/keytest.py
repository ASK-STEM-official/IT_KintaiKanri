import time
from evdev import UInput, ecodes as e

KEY_MAP = {
    'H': e.KEY_H, 'E': e.KEY_E, 'L': e.KEY_L, 'O': e.KEY_O,
    'ENTER': e.KEY_ENTER
}

def key_press(ui, key):
    ui.write(e.EV_KEY, key, 1)  # Key down
    ui.write(e.EV_KEY, key, 0)  # Key up
    ui.syn()

with UInput() as ui:
    time.sleep(3)  # 入力先にフォーカスする猶予
    for ch in "HELLO":
        key_press(ui, KEY_MAP[ch])
        time.sleep(0.05)
    key_press(ui, KEY_MAP['ENTER'])
