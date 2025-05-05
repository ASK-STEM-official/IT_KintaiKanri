import time
from smartcard.System import readers
from smartcard.Exceptions import NoCardException, CardConnectionException

def to_hex_string(byte_array):
    return ''.join(f'{b:02X}' for b in byte_array)

def main():
    rlist = readers()
    if not rlist:
        print("カードリーダーが見つかりません。")
        return

    reader = rlist[0]
    print(f"接続中: {reader}")

    last_idm = None

    while True:
        try:
            conn = reader.createConnection()
            conn.connect()

            command = [0xFF, 0xCA, 0x00, 0x00, 0x00]
            response, sw1, sw2 = conn.transmit(command)

            if sw1 == 0x90 and sw2 == 0x00:
                idm = to_hex_string(response)
                if idm != last_idm:
                    print("IDm:", idm)
                    last_idm = idm
            else:
                last_idm = None

            conn.disconnect()

        except (NoCardException, CardConnectionException):
            last_idm = None
        except Exception as e:
            print("エラー:", e)
            last_idm = None

        time.sleep(0.2)

if __name__ == '__main__':
    main()
