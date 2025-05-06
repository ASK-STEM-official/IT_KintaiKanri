import time
import pyautogui
from smartcard.System import readers
from smartcard.Exceptions import CardConnectionException, NoCardException

def to_hex(byte_array):
    return ''.join(f'{b:02X}' for b in byte_array)

def main():
    rlist = readers()
    if not rlist:
        print("カードリーダーが見つかりません。")
        return

    reader = rlist[0]
    print("使用中のリーダー:", reader)

    last_uid = None

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
                    pyautogui.write(uid)
                    pyautogui.press('enter')
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
