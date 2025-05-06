import time
from smartcard.System import readers
from smartcard.Exceptions import CardConnectionException, NoCardException
from evdev import UInput, ecodes as e

KEY_MAP = {
    '0': e.KEY_0, '1': e.KEY_1, '2': e.KEY_2, '3': e.KEY_3,
    '4': e.KEY_4, '5': e.KEY_5, '6': e.KEY_6, '7': e.KEY_7,
    '8': e.KEY_8, '9': e.KEY_9,
    'A': e.KEY_A, 'B': e.KEY_B, 'C': e.KEY_C, 'D': e.KEY_D,
    'E': e.KEY_E, 'F': e.KEY_F,
    'ENTER': e.KEY_ENTER
}

def to_hex(byte_array):
    return ''.join(f'{b:02X}' for b in byte_array)

def key_press(ui, keycode):
    ui.write(e.EV_KEY, keycode, 1)  # Key down
    ui.write(e.EV_KEY, keycode, 0)  # Key up
    ui.syn()

def type_uid(ui, uid_str):
    for ch in uid_str:
        if ch in KEY_MAP:
            key_press(ui, KEY_MAP[ch])
            time.sleep(0.03)
    key_press(ui, KEY_MAP['ENTER'])

def main():
    rlist = readers()
    if not rlist:
        print("カードリーダーが見つかりません。")
        return

    reader = rlist[0]
    print("使用中のリーダー:", reader)

    last_uid = None

    with UInput() as ui:
        while True:
            try:
                connection = reader.createConnection()
                connection.connect()

                GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
                data, sw1, sw2 = connection.transmit(GET_UID)

                if sw1 == 0x90 and sw2 == 0x00:
                    uid = to_hex(data)
                    if uid != last_uid:
                        print("カードUID:", uid)
                        type_uid(ui, uid)
                        last_uid = uid
                else:
                    last_uid = None

                connection.disconnect()

            except (CardConnectionException, NoCardException):
                last_uid = None
            except Exception as e:
                print("エラー:", e)
                last_uid = None

            time.sleep(0.3)

if __name__ == '__main__':
    main()
